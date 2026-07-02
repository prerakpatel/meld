import { supabase } from './supabaseClient';

const EMPTY_STREAK = { current_streak: 0, longest_streak: 0, last_played_date: null };

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function fetchStreak(playerId) {
  if (!playerId) return EMPTY_STREAK;

  const { data, error } = await supabase
    .from('player_stats')
    .select('current_streak, longest_streak, last_played_date')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error || !data) return EMPTY_STREAK;
  return data;
}

export async function recordResult(playerId, perfect) {
  if (!playerId) return EMPTY_STREAK;

  const existing = await fetchStreak(playerId);
  const today = new Date();
  const todayStr = dateStr(today);

  // Already recorded today (e.g. reloading, or testing with ?day=) — don't double-count
  if (existing.last_played_date === todayStr) return existing;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateStr(yesterday);

  let current_streak;
  if (!perfect) {
    current_streak = 0;
  } else if (existing.last_played_date === yesterdayStr) {
    current_streak = existing.current_streak + 1;
  } else {
    current_streak = 1;
  }

  const longest_streak = Math.max(existing.longest_streak, current_streak);

  const { data, error } = await supabase
    .from('player_stats')
    .upsert({ player_id: playerId, current_streak, longest_streak, last_played_date: todayStr })
    .select('current_streak, longest_streak, last_played_date')
    .single();

  if (error) return existing;
  return data;
}
