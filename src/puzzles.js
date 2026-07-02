import { supabase } from './lib/supabaseClient';

const ROTATION_EPOCH = new Date(2026, 0, 1);

export async function getTodayPuzzle() {
  const { count, error: countError } = await supabase
    .from('puzzles')
    .select('*', { count: 'exact', head: true });

  if (countError || !count) return null;

  // Dev/testing override: ?day=N picks that day directly (wraps like the real rotation)
  const dayParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('day')
    : null;

  let day;
  if (dayParam !== null && dayParam !== '' && !Number.isNaN(Number(dayParam))) {
    day = ((Number(dayParam) - 1) % count + count) % count + 1;
  } else {
    // Pick "today" by date so everyone sees the same daily puzzle (cycles through the batch)
    const daysSinceEpoch = Math.floor((Date.now() - ROTATION_EPOCH.getTime()) / 864e5);
    day = ((daysSinceEpoch % count) + count) % count + 1;
  }

  const { data, error } = await supabase
    .from('puzzles')
    .select('day, theme, pool, words')
    .eq('day', day)
    .single();

  if (error) return null;
  return data;
}
