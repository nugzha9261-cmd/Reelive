import { createClient } from "npm:@supabase/supabase-js@2";
import opentype from "npm:opentype.js@1.3.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHOTSTACK_ENV = Deno.env.get("SHOTSTACK_ENV") || "stage";
const SHOTSTACK_BASE = `https://api.shotstack.io/${SHOTSTACK_ENV}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!SHOTSTACK_API_KEY) throw new Error("SHOTSTACK_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate user
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      clipUrls,
      clipDayNumbers,
      clipDates,
      title,
      journeyId,
      duration,
      clipCount,
      soundtrackUrl,
    } = await req.json();

    if (!clipUrls || !Array.isArray(clipUrls) || clipUrls.length === 0) {
      return new Response(JSON.stringify({ error: "No clips provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Shotstack timeline
    const CLIP_DURATION = 2;
    const OUTPUT_SIZE = { width: 720, height: 1280 };
    const totalDuration = clipUrls.length * CLIP_DURATION;

    const videoClips = clipUrls.map((url: string, i: number) => ({
      asset: { type: "video", src: url, volume: soundtrackUrl ? 0 : 1 },
      start: i * CLIP_DURATION,
      length: CLIP_DURATION,
    }));

    // Build overlay track for day labels. Shotstack does not reliably render
    // custom SVG fonts, so convert the handwritten font glyphs into SVG paths.
    let caveatFont: opentype.Font | null = null;
    try {
      const fontRes = await fetch(
        "https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjRV6SII.ttf",
      );
      if (fontRes.ok) {
        caveatFont = opentype.parse(await fontRes.arrayBuffer());
      }
    } catch (e) {
      console.warn("[compile-video] Caveat font fetch failed:", e);
    }

    const buildBadgeSvg = (dayNum: number): string => {
      const text = `Day ${dayNum}`;
      const fontSize = 48;
      const padX = 26;
      const padY = 22;

      if (caveatFont) {
        const textPath = caveatFont.getPath(text, 0, 0, fontSize);
        const box = textPath.getBoundingBox();
        const width = Math.ceil(box.x2 - box.x1 + padX * 2);
        const height = Math.ceil(box.y2 - box.y1 + padY * 2);
        const x = padX - box.x1;
        const y = padY - box.y1;
        const pathData = caveatFont.getPath(text, x, y, fontSize).toPathData(2);

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="2" dy="3" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.95"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path d="${pathData}" fill="#ffffff" filter="url(#soft-shadow)"/>
</svg>`;
      }

      const textWidth = Math.round(text.length * fontSize * 0.6);
      const width = textWidth + padX * 2;
      const height = fontSize + padY * 2;
      const textY = padY + fontSize * 0.82;

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="2" dy="3" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.95"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <text x="${width / 2}" y="${textY}" text-anchor="middle"
        font-family="'Comic Sans MS', 'Chalkboard SE', cursive"
        font-weight="700" font-size="${fontSize}" fill="#ffffff"
        filter="url(#soft-shadow)">${text}</text>
</svg>`;
    };

    // Upload unique badges to storage and cache their public URLs by day number
    const badgeUrlByDay = new Map<number, string>();
    if (clipDayNumbers && Array.isArray(clipDayNumbers)) {
      const uniqueDays = Array.from(
        new Set(
          clipDayNumbers.filter((d: number | null): d is number => d != null),
        ),
      );
      await Promise.all(uniqueDays.map(async (dayNum) => {
        const svg = buildBadgeSvg(dayNum);
        const path = `badges/day-${dayNum}-${user.id}-${Date.now()}.svg`;
        const { error: upErr } = await supabase.storage
          .from("compilations")
          .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
            contentType: "image/svg+xml",
            upsert: true,
          });
        if (upErr) {
          console.error(`[compile-video] Badge upload failed for day ${dayNum}:`, upErr);
          return;
        }
        const { data: pub } = supabase.storage
          .from("compilations")
          .getPublicUrl(path);
        if (pub?.publicUrl) badgeUrlByDay.set(dayNum, pub.publicUrl);
      }));
    }

    const overlayClips: any[] = [];
    if (clipDayNumbers && Array.isArray(clipDayNumbers)) {
      clipDayNumbers.forEach((dayNum: number | null, i: number) => {
        if (dayNum != null) {
          const src = badgeUrlByDay.get(dayNum);
          if (!src) return;
          overlayClips.push({
            asset: {
              type: "image",
              src,
            },
            start: i * CLIP_DURATION,
            length: CLIP_DURATION,
            position: "bottom",
            offset: { y: 0.2 },
            fit: "none",
            scale: 1,
          });
        }
      });
    }

    // Build date stamp SVGs (top-left corner) and overlay clips
    const buildDateSvg = (dateLabel: string): string => {
      const fontSize = 36;
      const padX = 16;
      const padY = 8;
      const textWidth = Math.round(dateLabel.length * fontSize * 0.55);
      const width = textWidth + padX * 2;
      const height = fontSize + padY * 2;
      const rx = 8;
      const textY = padY + fontSize * 0.78;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" ry="${rx}" fill="#000000" fill-opacity="0.45"/>
  <text x="${width / 2}" y="${textY}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="600" font-size="${fontSize}" fill="#ffffff">${dateLabel}</text>
</svg>`;
    };

    const formatDate = (iso: string): string => {
      try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(d);
      } catch {
        return "";
      }
    };

    const dateUrlByLabel = new Map<string, string>();
    const dateLabels: (string | null)[] = [];
    if (clipDates && Array.isArray(clipDates)) {
      for (const iso of clipDates) {
        dateLabels.push(iso ? formatDate(iso) || null : null);
      }
      const uniqueLabels = Array.from(
        new Set(dateLabels.filter((l): l is string => !!l)),
      );
      await Promise.all(uniqueLabels.map(async (label) => {
        const svg = buildDateSvg(label);
        const slug = label.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
        const path = `dates/date-${slug}-${user.id}-${Date.now()}.svg`;
        const { error: upErr } = await supabase.storage
          .from("compilations")
          .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
            contentType: "image/svg+xml",
            upsert: true,
          });
        if (upErr) {
          console.error(`[compile-video] Date upload failed for ${label}:`, upErr);
          return;
        }
        const { data: pub } = supabase.storage
          .from("compilations")
          .getPublicUrl(path);
        if (pub?.publicUrl) dateUrlByLabel.set(label, pub.publicUrl);
      }));
    }

    const dateOverlayClips: any[] = [];
    dateLabels.forEach((label, i) => {
      if (!label) return;
      const src = dateUrlByLabel.get(label);
      if (!src) return;
      dateOverlayClips.push({
        asset: { type: "image", src },
        start: i * CLIP_DURATION,
        length: CLIP_DURATION,
        position: "topLeft",
        offset: { x: 0.03, y: -0.03 },
        fit: "none",
        scale: 1,
      });
    });

    // Track order: higher index in array = rendered on top
    // We want: day badge (top) > date stamp > video > audio (bottom)
    const tracks: any[] = [];
    if (overlayClips.length > 0) {
      tracks.push({ clips: overlayClips });
    }
    if (dateOverlayClips.length > 0) {
      tracks.push({ clips: dateOverlayClips });
    }
    tracks.push({ clips: videoClips });

    const timeline: any = { tracks };

    // Add soundtrack if provided
    // Use audio track clips for looping support (repeats when video > track length)
    // Shotstack's soundtrack property doesn't loop, so we manually tile audio clips
    if (soundtrackUrl && typeof soundtrackUrl === "string") {
      const estimatedTrackLength = 90; // seconds - safe default for most tracks
      const audioClips: any[] = [];
      let audioStart = 0;

      while (audioStart < totalDuration) {
        const remaining = totalDuration - audioStart;
        const isLast = remaining <= estimatedTrackLength;
        audioClips.push({
          asset: {
            type: "audio",
            src: soundtrackUrl,
            volume: 1,
            ...(isLast ? { effect: "fadeOut" } : {}),
          },
          start: audioStart,
          length: Math.min(estimatedTrackLength, remaining),
        });
        audioStart += estimatedTrackLength;
      }

      // Add audio track at the bottom (plays behind video)
      tracks.push({ clips: audioClips });

      console.log(
        `[compile-video] Adding soundtrack with looping: ${soundtrackUrl}, video duration: ${totalDuration}s, audio segments: ${audioClips.length}`,
      );
    }

    const renderBody = {
      timeline,
      output: {
        format: "mp4",
        size: OUTPUT_SIZE,
        fps: 30,
      },
    };

    console.log(
      `[compile-video] Submitting ${clipUrls.length} clips to Shotstack (${SHOTSTACK_ENV})`,
    );

    // Create job record
    const { data: job, error: dbError } = await supabase
      .from("compilation_jobs")
      .insert({
        user_id: user.id,
        status: "processing",
        clip_urls: clipUrls,
        clip_day_numbers: clipDayNumbers || [],
        title: title || "Compilation",
        journey_id: journeyId || null,
        clip_count: clipCount || clipUrls.length,
        duration: duration || clipUrls.length * CLIP_DURATION,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[compile-video] DB error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Process in background
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const renderRes = await fetch(`${SHOTSTACK_BASE}/render`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": SHOTSTACK_API_KEY,
            },
            body: JSON.stringify(renderBody),
          });

          const renderData = await renderRes.json();

          if (!renderRes.ok) {
            console.error(
              "[compile-video] Shotstack error:",
              JSON.stringify(renderData),
            );
            await supabase
              .from("compilation_jobs")
              .update({
                status: "failed",
                error_message: `Shotstack API error: ${
                  renderData?.response?.message || renderRes.statusText
                }`,
              })
              .eq("id", job.id);
            return;
          }

          const renderId = renderData?.response?.id;
          console.log(`[compile-video] Render submitted: ${renderId}`);

          await supabase
            .from("compilation_jobs")
            .update({ render_id: renderId })
            .eq("id", job.id);
        } catch (err) {
          console.error("[compile-video] Background error:", err);
          await supabase
            .from("compilation_jobs")
            .update({
              status: "failed",
              error_message: err instanceof Error
                ? err.message
                : "Unknown error",
            })
            .eq("id", job.id);
        }
      })(),
    );

    return new Response(
      JSON.stringify({
        jobId: job.id,
        status: "processing",
        message: "Compilation started in the cloud!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[compile-video] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Compilation failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
