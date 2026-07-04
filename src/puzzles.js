import { PUZZLES_B64 } from './data/puzzles.data';

// The puzzle rotation starts counting from this local calendar date (day 1).
const ROTATION_EPOCH = { year: 2026, month: 0, day: 1 };

let cache = null;
function allPuzzles() {
  if (!cache) cache = JSON.parse(atob(PUZZLES_B64));
  return cache;
}

// Whole calendar days between the epoch and the player's local date.
// Computed from date *components* (not raw milliseconds) so daylight-saving
// shifts can never make a day appear twice or get skipped.
function daysSinceEpoch(now) {
  const a = Date.UTC(ROTATION_EPOCH.year, ROTATION_EPOCH.month, ROTATION_EPOCH.day);
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 864e5);
}

// The puzzle for the player's current local calendar day (same for everyone
// in the same timezone, like Wordle). Cycles through the batch when the
// rotation runs past the last day.
export function getTodayPuzzle(now = new Date()) {
  const puzzles = allPuzzles();
  const count = puzzles.length;

  // Dev-only testing override: ?day=N picks that day directly (wraps like
  // the real rotation). Stripped from production builds so players can't
  // peek at other days by editing the URL.
  const dayParam = import.meta.env.DEV && typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('day')
    : null;

  let day;
  if (dayParam !== null && dayParam !== '' && !Number.isNaN(Number(dayParam))) {
    day = ((Number(dayParam) - 1) % count + count) % count + 1;
  } else {
    day = ((daysSinceEpoch(now) % count) + count) % count + 1;
  }

  return puzzles.find((p) => p.day === day) ?? null;
}
