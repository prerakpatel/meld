import { useState, useEffect, useMemo } from 'react';
import { loadGameState, saveGameState, loadStats, recordResult, shouldGreetTheme } from '../lib/storage';
import Header from './Header';
import MeldConsole from './MeldConsole';
import TileGrid from './TileGrid';
import TodaysFive from './TodaysFive';
import EndCard from './EndCard';
import { LightbulbIcon } from './icons';
import { PRIMARY_BTN, SECONDARY_BTN } from './styles';

const START_MELDS = 4;
const PTS_PER_WORD = 20;
const PTS_KEYSTONE = 15;
const HINT_COST = 1;

// One full game of MELD. Remounted (via key) when the puzzle changes —
// entering/leaving practice or dealing a new practice puzzle.
// `ephemeral` games never save progress or touch the streak.
export default function GameBoard({ puzzle, ephemeral, practice, mountToast, onHelp, onWordmarkTap, onNewPractice }) {
  const saved = useMemo(
    () => (ephemeral ? null : loadGameState(puzzle.day)),
    [puzzle, ephemeral],
  );
  const [stats, setStats] = useState(() => loadStats());
  // Play the theme's settle-in shimmer only on the first view of a new day.
  const [themeShimmer] = useState(() => !ephemeral && !!puzzle.theme && shouldGreetTheme(puzzle.day));

  // Derived puzzle state
  const { tiles, validWords, wordOrder, totalWords } = useMemo(() => {
    const validWords = {};
    const wordOrder = [];

    puzzle.words.forEach(o => {
      const k = o.a + "+" + o.b;
      validWords[k] = { word: o.w, key: !!o.key, def: o.d };
      wordOrder.push(k);
    });

    return { tiles: puzzle.pool, validWords, wordOrder, totalWords: wordOrder.length };
  }, [puzzle]);

  // Game state (restored from the device if today's game is in progress)
  const [slots, setSlots] = useState([null, null]);
  const [found, setFound] = useState(() => saved?.found ?? []);
  const [melds, setMelds] = useState(() => saved?.melds ?? START_MELDS);
  const [score, setScore] = useState(() => saved?.score ?? 0);
  const [over, setOver] = useState(() => saved?.over ?? false);
  const [showEndCard, setShowEndCard] = useState(false);
  const [revealed, setRevealed] = useState(() => saved?.revealed ?? []);

  // UI state
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });
  const [flashTiles, setFlashTiles] = useState([]);
  const [shaking, setShaking] = useState(false);

  // Hints: [{ key, clue }] — a crossword-style definition of an unfound
  // word. The active clue sits in the meld console; the word's ledger seat
  // glows until it's solved.
  const [hints, setHints] = useState(() => saved?.hints ?? []);
  const activeHint = hints.find(h => !found.includes(h.key)) ?? null;

  // Every meaningful change is saved immediately, so closing the tab or
  // refreshing resumes the same game (and can't be used to retry a bad day).
  useEffect(() => {
    if (ephemeral) return;
    saveGameState({ day: puzzle.day, found, melds, score, over, revealed, hints });
  }, [puzzle, ephemeral, found, melds, score, over, revealed, hints]);

  const showToast = (msg, type = '') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 1600);
  };

  // Announce mode switches (entering/leaving practice) once on mount.
  useEffect(() => {
    if (mountToast) showToast(mountToast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = (idx) => {
    if (over) return;
    if (slots.some(s => s && s.idx === idx)) return;

    const openIdx = slots.indexOf(null);
    if (openIdx < 0) return;

    const newSlots = [...slots];
    newSlots[openIdx] = { idx, txt: tiles[idx] };
    setSlots(newSlots);
  };

  const handlePull = (slotIndex) => {
    if (over) return;
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
  };

  const handleClear = () => {
    if (over) return;
    setSlots([null, null]);
  };

  const handleMeld = () => {
    if (over || !slots[0] || !slots[1]) return;

    const joined = slots[0].txt + slots[1].txt;
    // Accept the intended pair — or any other split that spells one of
    // today's words, so the player is never punished for being right.
    const exact = slots[0].txt + '+' + slots[1].txt;
    const k = validWords[exact] ? exact : wordOrder.find(w => validWords[w].word === joined);
    setSlots([null, null]);

    if (k && !found.includes(k)) {
      // Correct meld
      const newFound = [...found, k];
      setFound(newFound);

      const pts = PTS_PER_WORD + (validWords[k].key ? PTS_KEYSTONE : 0) + melds;
      setScore(s => s + pts);

      setFlashTiles([slots[0].idx, slots[1].idx]);
      setTimeout(() => setFlashTiles([]), 500);

      showToast(`+${pts}  ${validWords[k].word} ✓`, 'good');

      if (newFound.length === totalWords) {
        setOver(true); // lock input immediately; the card follows the animation
        setTimeout(() => endGame(true, newFound), 500);
      }
    } else if (k) {
      showToast('Already melded that.');
    } else if (puzzle.ok?.includes(joined)) {
      // A real word, just not one of today's five — honesty costs nothing
      showToast(`${joined} is a word — but not one of today's five.`);
    } else {
      // Wrong meld
      const newMelds = melds - 1;
      setMelds(newMelds);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      showToast('Not a word — meld spent.', 'err');

      if (newMelds <= 0) {
        setOver(true); // lock input immediately; the card follows the shake
        setTimeout(() => endGame(false, found), 500);
      }
    }
  };

  // A hint is a crossword-style clue: the definition of one unfound word
  // (falling back to its starting chunk when no definition exists). It stays
  // visible in the console until the word is solved. One clue at a time.
  const handleHint = () => {
    if (over) return;
    const rem = wordOrder.filter(k => !found.includes(k));
    if (!rem.length) return;

    if (activeHint) {
      showToast('Solve your current clue first — its seat is glowing.');
      return;
    }

    if (melds <= HINT_COST) {
      showToast('Not enough melds to hint.', 'err');
      return;
    }

    // Hint plain words first; the keystone stays the day's payoff and is
    // only hinted when it's the last word left.
    const unhinted = rem.filter(k => !hints.some(h => h.key === k));
    const target = unhinted.find(k => !validWords[k].key) ?? unhinted[0];
    const w = validWords[target];
    const clue = w.def ?? `starts with “${target.split('+')[0]}”`;

    setHints(h => [...h, { key: target, clue }]);
    setMelds(melds - HINT_COST);
    showToast('Clue revealed — 1 meld spent.');
  };

  const endGame = (won, currentFound) => {
    setOver(true);
    setShowEndCard(true);
    setRevealed(wordOrder.filter(k => !currentFound.includes(k)));
    if (!ephemeral) setStats(recordResult(won));
  };

  const shareText = useMemo(() => {
    const grid = wordOrder.map(k => {
      if (found.includes(k)) return validWords[k].key ? '🟨' : '🟩';
      return '⬜';
    }).join('');
    return `MELD #${puzzle.day}  ${score}pts\n${grid}`;
  }, [puzzle, wordOrder, validWords, found, score]);

  const copyResult = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
        .then(() => showToast('Copied!', 'good'))
        .catch(() => showToast('Copy failed', 'err'));
    } else {
      showToast('Copy not supported on this browser', 'err');
    }
  };

  return (
    <>
      <div
        className="h-full w-full max-w-[430px] mx-auto flex flex-col px-[18px]"
        style={{
          paddingTop: 'calc(10px + env(safe-area-inset-top))',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        <Header
          meldsLeft={melds}
          totalMelds={START_MELDS}
          score={score}
          dayNumber={puzzle.day}
          theme={puzzle.theme}
          themeShimmer={themeShimmer}
          practice={practice}
          onHelp={onHelp}
          onWordmarkTap={onWordmarkTap}
        />

        {/* Leftover height splits 1:2 above/below the play block (the console
            rides high, near the header), and the block's own rhythm scales
            with the viewport via --gap-y. */}
        <div className="flex-1 min-h-2.5" />
        <div className="flex flex-col gap-(--gap-y)">
          <MeldConsole
            slots={slots}
            clue={over ? null : activeHint?.clue}
            onPull={handlePull}
            onMeld={handleMeld}
            disabled={over || !slots[0] || !slots[1]}
            shaking={shaking}
          />

          <TileGrid
            tiles={tiles}
            selectedIdxs={slots.filter(Boolean).map(s => s.idx)}
            flashIdxs={flashTiles}
            onPick={handlePick}
          />

          <div className="flex gap-3 justify-center">
            {!over ? (
              <>
                <button className={`${SECONDARY_BTN} text-coral-deep border-[#e3c4be] bg-[#fdf5f3] flex items-center`} onClick={handleHint}>
                  <LightbulbIcon /> Hint (-1 meld)
                </button>
                <button className={SECONDARY_BTN} onClick={handleClear}>
                  Clear
                </button>
              </>
            ) : (
              <>
                <button className={`${PRIMARY_BTN} px-6 py-2.5 text-[15px] max-w-[220px]`} onClick={() => setShowEndCard(true)}>
                  Show result
                </button>
                {practice && (
                  <button className={SECONDARY_BTN} onClick={onNewPractice}>
                    New puzzle
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex-[2] min-h-2.5" />

        <TodaysFive
          wordOrder={wordOrder}
          validWords={validWords}
          found={found}
          revealed={revealed}
          hintedKeys={hints.map(h => h.key)}
          onSeatTap={(isKey) => showToast(isKey
            ? 'The keystone’s seat — find it for a bonus.'
            : 'One of today’s five lives here — meld it to fill the seat.')}
        />
      </div>

      {showEndCard && (
        <EndCard
          won={found.length === totalWords}
          foundCount={found.length}
          totalWords={totalWords}
          score={score}
          meldsLeft={melds}
          stats={stats}
          shareText={shareText}
          onCopy={copyResult}
          onClose={() => setShowEndCard(false)}
        />
      )}

      <div
        className={`fixed left-1/2 -translate-x-1/2 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 z-[90] ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'} ${toast.type === 'err' ? 'bg-err' : toast.type === 'good' ? 'bg-moss-deep' : 'bg-charcoal'}`}
        style={{ top: 'calc(64px + env(safe-area-inset-top))' }}
      >
        {toast.msg}
      </div>
    </>
  );
}
