// All persistence lives on the player's device (localStorage), like Wordle:
// - the day's in-progress game, so a refresh resumes instead of resetting
// - lifetime stats and the daily streak
// There is no backend and nothing leaves the browser.

// v2: keyed by day number so one day's progress can never be silently
// overwritten by another day's (the previous single-slot format could be
// clobbered by jumping to a different day and back — see loadGameState).
const GAMES_KEY = 'meld_games_v2';
const MAX_SAVED_GAMES = 60;
const STATS_KEY = 'meld_stats_v1';
const HOWTO_KEY = 'meld_howto_seen_v1';

const DEFAULT_STATS = {
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  lastPlayedDate: null,
  emberEarnedDate: null,
  emberUsedDate: null,
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
  const all = readJson(GAMES_KEY) ?? {};
  return all[day] ?? null;
}

// Each day's progress lives under its own key, so playing (or previewing) a
// different day can never overwrite another day's saved state. Pruned to a
// generous cap so localStorage can't grow without bound over the life of
// the game.
export function saveGameState(state) {
  const all = readJson(GAMES_KEY) ?? {};
  all[state.day] = state;

  const days = Object.keys(all).map(Number).sort((a, b) => a - b);
  for (const day of days.slice(0, days.length - MAX_SAVED_GAMES)) delete all[day];

  writeJson(GAMES_KEY, all);
}

// True only on the first view of a given day's puzzle — used to play the
// theme reveal shimmer once, not on every reload.
const GREET_KEY = 'meld_theme_greet_v1';
export function shouldGreetTheme(day) {
  if (readJson(GREET_KEY) === day) return false;
  writeJson(GREET_KEY, day);
  return true;
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
// A flawless win (all melds intact) earns an Ember: tomorrow's hint is free.
// `now` must be the server-verified date (see lib/serverTime.js) — trusting
// the device clock here is exactly what let a spoofed clock replay days and
// inflate streaks.
export function recordResult(won, flawless, now) {
  const stats = loadStats();
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
    ...stats,
    currentStreak,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    lastPlayedDate: today,
    emberEarnedDate: won && flawless ? today : stats.emberEarnedDate,
  };
  writeJson(STATS_KEY, next);
  return next;
}

// The Ember glows only on the day after it was earned, and only until used.
// `now` must be the server-verified date — see recordResult.
export function hasEmberToday(now) {
  const stats = loadStats();
  if (!stats.emberEarnedDate) return false;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return stats.emberEarnedDate === localDateStr(yesterday)
    && stats.emberUsedDate !== localDateStr(now);
}

export function consumeEmber(now) {
  writeJson(STATS_KEY, { ...loadStats(), emberUsedDate: localDateStr(now) });
}

// True once per day: used to show the "your Ember is glowing" reminder only
// on the first open, not every refresh.
const EMBER_GREET_KEY = 'meld_ember_greet_v1';
export function shouldRemindEmber(day) {
  if (readJson(EMBER_GREET_KEY) === day) return false;
  writeJson(EMBER_GREET_KEY, day);
  return true;
}
