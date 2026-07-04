import { useState, useEffect, useMemo } from 'react';
import './index.css';
import { getTodayPuzzle, isPracticeSession } from './puzzles';
import { loadGameState, saveGameState, loadStats, recordResult, hasSeenHowTo, markHowToSeen } from './lib/storage';
import HowToPlay from './components/HowToPlay';
import Header from './components/Header';
import MeldConsole from './components/MeldConsole';
import TileGrid from './components/TileGrid';
import TodaysFive from './components/TodaysFive';
import EndCard from './components/EndCard';
import { LightbulbIcon } from './components/icons';
import { PRIMARY_BTN, SECONDARY_BTN } from './components/styles';

const START_MELDS = 4;
const PTS_PER_WORD = 20;
const PTS_KEYSTONE = 15;
const HINT_COST = 1;

// Practice games and dev day-previews never touch the real saved game or streak.
const isPractice = isPracticeSession();
const isEphemeralSession = isPractice || (
  import.meta.env.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('day')
);

export default function App() {
  const puzzle = useMemo(() => getTodayPuzzle(), []);
  const saved = useMemo(
    () => (puzzle && !isEphemeralSession ? loadGameState(puzzle.day) : null),
    [puzzle],
  );
  const [stats, setStats] = useState(() => loadStats());
  const [showHelp, setShowHelp] = useState(() => !hasSeenHowTo());

  const closeHelp = () => {
    setShowHelp(false);
    markHowToSeen();
  };

  // Derived puzzle state
  const { tiles, validWords, wordOrder, totalWords } = useMemo(() => {
    if (!puzzle) return { tiles: [], validWords: {}, wordOrder: [], totalWords: 0 };

    const validWords = {};
    const wordOrder = [];

    puzzle.words.forEach(o => {
      const k = o.a + "+" + o.b;
      validWords[k] = { word: o.w, key: !!o.key };
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

  // Active hints: [{ key, tileIdx }] — the starting tile of a hinted word
  // stays coral until that word is found.
  const [hints, setHints] = useState(() => saved?.hints ?? []);

  // Every meaningful change is saved immediately, so closing the tab or
  // refreshing resumes the same game (and can't be used to retry a bad day).
  useEffect(() => {
    if (!puzzle || isEphemeralSession) return;
    saveGameState({ day: puzzle.day, found, melds, score, over, revealed, hints });
  }, [puzzle, found, melds, score, over, revealed, hints]);

  const showToast = (msg, type = '') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 1600);
  };

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

  // A hint drops the starting chunk of an unfound word into the first slot
  // and keeps that tile (and the word's ledger seed) coral until it's solved.
  const handleHint = () => {
    if (over) return;
    const rem = wordOrder.filter(k => !found.includes(k));
    if (!rem.length) return;

    // Hint plain words first; the keystone stays the day's payoff and is
    // only hinted when it's the last word left.
    const unhinted = rem.filter(k => !hints.some(h => h.key === k));
    const target = unhinted.find(k => !validWords[k].key) ?? unhinted[0];
    if (!target) {
      showToast('Your hint is already glowing in the bank.');
      return;
    }

    if (melds <= HINT_COST) {
      showToast('Not enough melds to hint.', 'err');
      return;
    }

    const chunkA = target.split('+')[0];
    const tileIdx = tiles.indexOf(chunkA);
    setHints(h => [...h, { key: target, tileIdx }]);
    setSlots([{ idx: tileIdx, txt: chunkA }, null]);
    setMelds(melds - HINT_COST);
    showToast(`A word starts with ${chunkA} — find its partner.`);
  };

  const endGame = (won, currentFound) => {
    setOver(true);
    setShowEndCard(true);
    setRevealed(wordOrder.filter(k => !currentFound.includes(k)));
    if (!isEphemeralSession) setStats(recordResult(won));
  };

  const shareText = useMemo(() => {
    if (!puzzle) return '';
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

  if (!puzzle) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
        <span className="font-slab text-2xl font-bold text-charcoal">MELD</span>
        <p className="text-sm text-ink-soft m-0">Today&rsquo;s puzzle couldn&rsquo;t load. Pull to refresh, or try again in a moment.</p>
      </div>
    );
  }

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
          practice={isPractice}
          onHelp={() => setShowHelp(true)}
        />

        {/* Leftover height splits 1:2 above/below the play block (the console
            rides high, near the header), and the block's own rhythm scales
            with the viewport via --gap-y. */}
        <div className="flex-1 min-h-2.5" />
        <div className="flex flex-col gap-(--gap-y)">
          <MeldConsole
            slots={slots}
            onPull={handlePull}
            onMeld={handleMeld}
            disabled={over || !slots[0] || !slots[1]}
            shaking={shaking}
          />

          <TileGrid
            tiles={tiles}
            selectedIdxs={slots.filter(Boolean).map(s => s.idx)}
            flashIdxs={flashTiles}
            hintedIdxs={hints.filter(h => !found.includes(h.key)).map(h => h.tileIdx)}
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
                {isPractice && (
                  <button className={SECONDARY_BTN} onClick={() => { window.location.href = '?practice'; }}>
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
        />
      </div>

      {showHelp && <HowToPlay onClose={closeHelp} />}

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
