// Establishes "today" from a clock the player can't change — Vercel's own
// server clock via /api/today — rather than trusting the device's clock,
// which can be set forward to preview tomorrow's puzzle early, or set back
// to make an already-played day look unplayed again.
//
// The result is cached as a plain calendar-date string (not a raw
// timestamp), so a brief offline moment can reuse the last confirmed day
// without the cached value silently going stale as real time passes. If the
// device has never once verified successfully, there is no trustworthy
// fallback — the caller gets null and should show a "check your connection"
// state rather than guessing from the device clock.

const CACHE_KEY = 'meld_verified_date_v1';

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Local midnight of the given YYYY-MM-DD string — matches what puzzles.js
// expects from a Date (it only reads the Y/M/D components).
function dateAtLocalMidnight(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function getVerifiedDate() {
  try {
    const res = await fetch('/api/today', { cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const { now } = await res.json();
    const instant = new Date(now);
    if (Number.isNaN(instant.getTime())) throw new Error('unparseable date');

    const dateStr = localDateStr(instant);
    try {
      localStorage.setItem(CACHE_KEY, dateStr);
    } catch {
      // localStorage may be unavailable (private browsing, full quota) —
      // the verified date still works for this load, just isn't cached.
    }
    return dateAtLocalMidnight(dateStr);
  } catch (err) {
    console.warn('MELD: could not verify the date from the server', err);
    let cached = null;
    try {
      cached = localStorage.getItem(CACHE_KEY);
    } catch {
      // ignore
    }
    return cached ? dateAtLocalMidnight(cached) : null;
  }
}
