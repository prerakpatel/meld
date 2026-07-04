// All persistence lives on the player's device (localStorage), like Wordle:
// - the day's in-progress game, so a refresh resumes instead of resetting
// - lifetime stats and the daily streak
// There is no backend and nothing leaves the browser.

const GAME_KEY = 'meld_game_v1';
const STATS_KEY = 'meld_stats_v1';
const HOWTO_KEY = 'meld_howto_seen_v1';

const DEFAULT_STATS = {
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  lastPlayedDate: null,
};

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// localStorage can throw (private browsing, full quota) — the game must keep
// playing without persistence rather than crash, so reads fall back to null
// and writes are best-effort.
function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`MELD: could not read ${key} from localStorage`, err);
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`MELD: could not save ${key} to localStorage`, err);
  }
}

export function loadGameState(day) {
  const saved = readJson(GAME_KEY);
  return saved && saved.day === day ? saved : null;
}

export function saveGameState(state) {
  writeJson(GAME_KEY, state);
}

export function hasSeenHowTo() {
  return readJson(HOWTO_KEY) === true;
}

export function markHowToSeen() {
  writeJson(HOWTO_KEY, true);
}

export function loadStats() {
  return { ...DEFAULT_STATS, ...(readJson(STATS_KEY) ?? {}) };
}

// Called once when a game ends. Winning on consecutive days grows the
// streak; a loss resets it; results are only counted once per calendar day.
export function recordResult(won) {
  const stats = loadStats();
  const now = new Date();
  const today = localDateStr(now);
  if (stats.lastPlayedDate === today) return stats;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak;
  if (!won) {
    currentStreak = 0;
  } else if (stats.lastPlayedDate === localDateStr(yesterday)) {
    currentStreak = stats.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  const next = {
    currentStreak,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    lastPlayedDate: today,
  };
  writeJson(STATS_KEY, next);
  return next;
}
