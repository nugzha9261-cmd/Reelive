/**
 * Reel cache — stores compiled reel mp4 files on-device for instant + offline playback.
 *
 * Strategy:
 *  - On native (Capacitor): cache mp4 in Directory.Data/reels/{id}.mp4, return a webview-safe URI.
 *  - On web: caching is skipped, remote URL is returned as-is.
 *
 * Failures fall back to the remote URL — never block playback on cache errors.
 */
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const REEL_DIR = 'reels';
const inFlight = new Map<string, Promise<string>>();

const isNative = () => Capacitor.isNativePlatform();

const fileNameFor = (id: string) => `${REEL_DIR}/${id}.mp4`;

const ensureDir = async () => {
  try {
    await Filesystem.mkdir({
      path: REEL_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // already exists
  }
};

const existingLocalUri = async (id: string): Promise<string | null> => {
  try {
    const { uri } = await Filesystem.getUri({
      path: fileNameFor(id),
      directory: Directory.Data,
    });
    // Convert file:// to a webview-safe URL
    return Capacitor.convertFileSrc(uri);
  } catch {
    return null;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip "data:*;base64," prefix
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const downloadAndCache = async (id: string, remoteUrl: string): Promise<string> => {
  await ensureDir();

  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const base64 = await blobToBase64(blob);

  await Filesystem.writeFile({
    path: fileNameFor(id),
    data: base64,
    directory: Directory.Data,
  });

  const { uri } = await Filesystem.getUri({
    path: fileNameFor(id),
    directory: Directory.Data,
  });
  return Capacitor.convertFileSrc(uri);
};

/**
 * Return a playable URI for the reel.
 * Uses cached local file if available; otherwise downloads in the background and
 * returns the remote URL for immediate playback. Subsequent calls return the local URI.
 */
export const getLocalReelUri = async (
  id: string,
  remoteUrl: string
): Promise<string> => {
  if (!isNative() || !remoteUrl) return remoteUrl;

  const existing = await existingLocalUri(id);
  if (existing) {
    // Confirm the file actually exists (getUri doesn't check)
    try {
      const stat = await Filesystem.stat({
        path: fileNameFor(id),
        directory: Directory.Data,
      });
      if (stat.size > 0) return existing;
    } catch {
      // fall through to re-download
    }
  }

  // Deduplicate concurrent downloads of the same reel
  if (!inFlight.has(id)) {
    inFlight.set(
      id,
      downloadAndCache(id, remoteUrl).finally(() => inFlight.delete(id))
    );
  }

  try {
    return await inFlight.get(id)!;
  } catch (err) {
    console.warn('[reel-cache] download failed, using remote URL:', err);
    return remoteUrl;
  }
};

export const deleteLocalReel = async (id: string): Promise<void> => {
  if (!isNative()) return;
  try {
    await Filesystem.deleteFile({
      path: fileNameFor(id),
      directory: Directory.Data,
    });
  } catch {
    // not cached, ignore
  }
};

export const clearReelCache = async (): Promise<void> => {
  if (!isNative()) return;
  try {
    await Filesystem.rmdir({
      path: REEL_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // nothing to clear
  }
};

export const getReelCacheSize = async (): Promise<number> => {
  if (!isNative()) return 0;
  try {
    const { files } = await Filesystem.readdir({
      path: REEL_DIR,
      directory: Directory.Data,
    });
    let total = 0;
    for (const f of files) {
      total += typeof (f as any).size === 'number' ? (f as any).size : 0;
    }
    return total;
  } catch {
    return 0;
  }
};
