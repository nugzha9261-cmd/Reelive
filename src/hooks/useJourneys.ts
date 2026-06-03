import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Journey, VideoClip, JourneyType } from '@/types/journey';

const mapJourney = (j: any): Journey => ({
  id: j.id,
  name: j.name,
  type: j.type as JourneyType,
  description: j.description || undefined,
  photo: j.photo || undefined,
  dateOfBirth: j.date_of_birth || undefined,
  createdAt: j.created_at,
  lastCaptureDate: j.last_capture_date || undefined,
  clipCount: j.clip_count,
  showDayNumbers: j.show_day_numbers ?? true,
});

const fetchJourneysFromDb = async () => {
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapJourney);
};

export const useJourneys = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: journeys = [], isLoading: loading } = useQuery({
    queryKey: ['journeys', user?.id],
    queryFn: fetchJourneysFromDb,
    enabled: !!user,
    staleTime: 60_000, // 60s before refetch
    gcTime: 10 * 60 * 1000, // keep in cache 10 min
    placeholderData: (prev) => prev, // show stale data instantly while refetching
  });

  const addJourney = async (journey: Omit<Journey, 'id' | 'createdAt' | 'clipCount'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('journeys')
      .insert({
        user_id: user.id,
        name: journey.name,
        type: journey.type,
        description: journey.description || null,
        date_of_birth: journey.dateOfBirth || null,
        photo: journey.photo || null,
        show_day_numbers: journey.showDayNumbers ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding journey:', error);
      return null;
    }

    const newJourney = mapJourney(data);
    queryClient.setQueryData(['journeys', user.id], (old: Journey[] = []) => [newJourney, ...old]);
    return newJourney;
  };

  const updateJourney = async (journeyId: string, updates: { photo?: string; name?: string; description?: string }) => {
    if (!user) return false;

    const dbUpdates: Record<string, any> = {};
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { error } = await supabase
      .from('journeys')
      .update(dbUpdates)
      .eq('id', journeyId);

    if (error) {
      console.error('Error updating journey:', error);
      return false;
    }

    queryClient.setQueryData(['journeys', user.id], (old: Journey[] = []) =>
      old.map((j) => (j.id === journeyId ? { ...j, ...updates } : j))
    );
    return true;
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['journeys', user?.id] });

  const extractStoragePath = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const marker = '/videos/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  const deleteJourney = async (journeyId: string) => {
    if (!user) return false;

    // 1. Fetch all clips for this journey to get storage paths
    const { data: clipsData, error: clipsErr } = await supabase
      .from('video_clips')
      .select('video_url, thumbnail_url')
      .eq('journey_id', journeyId);

    if (clipsErr) {
      console.error('Error fetching clips for deletion:', clipsErr);
      return false;
    }

    // 2. Remove files from storage
    const paths: string[] = [];
    (clipsData || []).forEach((c) => {
      const v = extractStoragePath(c.video_url);
      const t = extractStoragePath(c.thumbnail_url);
      if (v) paths.push(v);
      if (t && t !== v) paths.push(t);
    });

    if (paths.length > 0) {
      const { error: storageErr } = await supabase.storage.from('videos').remove(paths);
      if (storageErr) {
        console.error('Error removing storage files:', storageErr);
        // continue anyway — DB cleanup is more important
      }
    }

    // 3. Delete video_clips rows
    const { error: clipsDelErr } = await supabase
      .from('video_clips')
      .delete()
      .eq('journey_id', journeyId);
    if (clipsDelErr) {
      console.error('Error deleting clips:', clipsDelErr);
      return false;
    }

    // 4. Clean up compilation jobs tied to this journey
    await supabase.from('compilation_jobs').delete().eq('journey_id', journeyId);

    // 5. Delete the journey row
    const { error: journeyErr } = await supabase
      .from('journeys')
      .delete()
      .eq('id', journeyId);
    if (journeyErr) {
      console.error('Error deleting journey:', journeyErr);
      return false;
    }

    queryClient.setQueryData(['journeys', user.id], (old: Journey[] = []) =>
      old.filter((j) => j.id !== journeyId)
    );
    queryClient.invalidateQueries({ queryKey: ['journeys', user.id] });
    return true;
  };

  return { journeys, loading, addJourney, updateJourney, deleteJourney, refetch };
};

export const useJourneyClips = (journeyId: string) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const fetchClips = useCallback(async () => {
    if (!user || !journeyId) {
      setClips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('video_clips')
      .select('*')
      .eq('journey_id', journeyId)
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Error fetching clips:', error);
    } else {
      const mappedClips: VideoClip[] = (data || []).map((c) => ({
        id: c.id,
        journeyId: c.journey_id,
        uri: c.video_url,
        thumbnail: c.thumbnail_url || c.video_url,
        capturedAt: c.captured_at,
        duration: Number(c.duration),
        isHighlight: c.is_highlight,
        weekNumber: c.week_number,
        isBestOfDay: (c as any).is_best_of_day ?? false,
        isBestOfWeek: (c as any).is_best_of_week ?? false,
        isBestOfMonth: (c as any).is_best_of_month ?? false,
      }));
      setClips(mappedClips);
    }
    setLoading(false);
  }, [user, journeyId]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const toggleHighlight = async (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const newValue = !clip.isHighlight;
    
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, isHighlight: newValue } : c
      )
    );

    const { error } = await supabase
      .from('video_clips')
      .update({ is_highlight: newValue })
      .eq('id', clipId);

    if (error) {
      console.error('Error toggling highlight:', error);
      setClips((prev) =>
        prev.map((c) =>
          c.id === clipId ? { ...c, isHighlight: !newValue } : c
        )
      );
    }
  };

  const deleteClip = async (clipId: string) => {
    const { error } = await supabase
      .from('video_clips')
      .delete()
      .eq('id', clipId);

    if (error) {
      console.error('Error deleting clip:', error);
      return false;
    }

    setClips((prev) => prev.filter((c) => c.id !== clipId));
    return true;
  };

  const toggleBestOf = async (clipId: string, type: 'day' | 'week' | 'month') => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const fieldMap = {
      day: { local: 'isBestOfDay', db: 'is_best_of_day' },
      week: { local: 'isBestOfWeek', db: 'is_best_of_week' },
      month: { local: 'isBestOfMonth', db: 'is_best_of_month' },
    } as const;

    const field = fieldMap[type];
    const currentValue = clip[field.local as keyof VideoClip] as boolean;
    const newValue = !currentValue;

    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, [field.local]: newValue } : c
      )
    );

    const { error } = await supabase
      .from('video_clips')
      .update({ [field.db]: newValue } as any)
      .eq('id', clipId);

    if (error) {
      console.error(`Error toggling ${type}:`, error);
      setClips((prev) =>
        prev.map((c) =>
          c.id === clipId ? { ...c, [field.local]: currentValue } : c
        )
      );
    }
  };

  return { clips, loading, toggleHighlight, toggleBestOf, deleteClip, refetch: fetchClips };
};
