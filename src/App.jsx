import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import './index.css';
import { getTodayPuzzle } from './puzzles';
import { getPlayerId } from './lib/playerId';
import { fetchStreak, recordResult } from './lib/streaks';

const LightbulbIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1.5 align-text-top">
    <g id="lightbulb">
      <path id="Vector" d="M8.75 8.16676C8.86667 7.58338 9.15833 7.17501 9.625 6.70831C10.2083 6.18327 10.5 5.42487 10.5 4.66648C10.5 3.73815 10.1313 2.84784 9.47487 2.19141C8.8185 1.53498 7.92826 1.1662 7 1.1662C6.07174 1.1662 5.1815 1.53498 4.52513 2.19141C3.86875 2.84784 3.5 3.73815 3.5 4.66648C3.5 5.24986 3.61667 5.94992 4.375 6.70831C4.78333 7.11668 5.13333 7.58338 5.25 8.16676M5.25 10.5003H8.75M5.83333 12.8338H8.16667" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </g>
  </svg>
);

const KeyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="block mx-auto">
    <g id="key" clipPath="url(#clip0_18_368)">
      <path id="Vector" d="M7.7496 3.7496L8.8996 4.8996C8.99306 4.99121 9.11872 5.04253 9.2496 5.04253C9.38048 5.04253 9.50614 4.99121 9.5996 4.8996L10.6496 3.8496C10.7412 3.75614 10.7925 3.63048 10.7925 3.4996C10.7925 3.36872 10.7412 3.24306 10.6496 3.1496L9.4996 1.9996M10.4996 0.9996L5.69955 5.7996M6.4996 7.7496C6.4996 9.26838 5.26838 10.4996 3.7496 10.4996C2.23082 10.4996 0.9996 9.26838 0.9996 7.7496C0.9996 6.23082 2.23082 4.9996 3.7496 4.9996C5.26838 4.9996 6.4996 6.23082 6.4996 7.7496Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </g>
    <defs>
      <clipPath id="clip0_18_368">
        <rect width="12" height="12" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const START_MELDS = 4;
const PTS_PER_WORD = 20;
const PTS_KEYSTONE = 15;
const HINT_COST = 1;

const PRIMARY_BTN = 'font-sans font-bold text-white bg-coral rounded-xl border-none cursor-pointer transition-transform w-full text-center shadow-[0_4px_0_#c24d34] active:translate-y-1 active:shadow-[0_0_0_#c24d34] disabled:opacity-50 disabled:cursor-default disabled:translate-y-0 disabled:shadow-[0_4px_0_#c24d34]';
const SECONDARY_BTN = 'px-5 py-2.5 rounded-full text-[13px] font-semibold border border-[#d1c8b8] bg-transparent text-charcoal active:scale-95 disabled:opacity-50 disabled:cursor-default';
const TILE_BANK = 'w-[calc(25%-8px)] h-15 rounded-xl bg-white border-2 border-charcoal shadow-[0_4px_0_#1a1a1a] flex items-center justify-center text-xl font-bold text-charcoal cursor-pointer select-none transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-[0_0_0_#1a1a1a]';
const TILE_INSLOT = 'w-full h-full rounded-xl bg-white border-2 border-charcoal flex items-center justify-center text-xl font-bold text-charcoal cursor-pointer select-none active:translate-y-1';

export default function App() {
  const [puzzle, setPuzzle] = useState(null);
  const [puzzleError, setPuzzleError] = useState(false);
  const playerId = useMemo(() => getPlayerId(), []);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });

  useEffect(() => {
    let cancelled = false;
    getTodayPuzzle().then((p) => {
      if (cancelled) return;
      if (p) setPuzzle(p);
      else setPuzzleError(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStreak(playerId).then((s) => {
      if (!cancelled) setStreak(s);
    });
    return () => { cancelled = true; };
  }, [playerId]);

  // Derived puzzle state
  const { tiles, validWords, wordOrder, totalWords } = useMemo(() => {
    if (!puzzle) return { tiles: [], validWords: {}, wordOrder: [], totalWords: 0 };
    
    const validWords = {};
    const wordOrder = [];
    
    puzzle.words.forEach(o => {
      const k = o.a + "+" + o.b;
      validWords[k] = { 
        word: o.w, 
        note: o.key ? "the keystone — today's cozy word" : "", 
        key: !!o.key 
      };
      wordOrder.push(k);
    });
    
    return {
      tiles: puzzle.pool,
      validWords,
      wordOrder,
      totalWords: wordOrder.length
    };
  }, [puzzle]);

  // Game state
  const [slots, setSlots] = useState([null, null]);
  const [found, setFound] = useState([]);
  const [melds, setMelds] = useState(START_MELDS);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [showEndCard, setShowEndCard] = useState(false);
  const [revealed, setRevealed] = useState([]);
  
  // UI State
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });
  const [flashTiles, setFlashTiles] = useState([]);

  // Auto-fit: measure the board's natural height and shrink it to fit the
  // viewport, however many tile rows today's puzzle needs — the layout
  // adapts to the content instead of the content being constrained to fit
  // a fixed number of rows.
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const recompute = () => {
      const natural = el.scrollHeight;
      const available = window.innerHeight;
      setScale(natural > available ? available / natural : 1);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [puzzle]);

  // Toast helper
  const showToast = (msg, type = '') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 1400);
  };

  const handlePick = (idx) => {
    if (over) return;
    
    // Don't pick if already in a slot
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

    const k = slots[0].txt + '+' + slots[1].txt;
    
    if (validWords[k] && !found.includes(k)) {
      // Correct Meld
      const newFound = [...found, k];
      setFound(newFound);
      
      const pts = PTS_PER_WORD + (validWords[k].key ? PTS_KEYSTONE : 0) + melds;
      setScore(s => s + pts);
      
      // Flash animation
      setFlashTiles([slots[0].idx, slots[1].idx]);
      setTimeout(() => setFlashTiles([]), 500);

      showToast(`+${pts}  ${validWords[k].word} ✓`, 'good');
      setSlots([null, null]);

      if (newFound.length === totalWords) {
        setTimeout(() => endGame(true, newFound), 500);
      }
    } else if (found.includes(k)) {
      // Already found
      showToast('Already melded that.');
      setSlots([null, null]);
    } else {
      // Wrong Meld
      const newMelds = melds - 1;
      setMelds(newMelds);
      showToast('Not a word — meld spent.', 'err');
      setSlots([null, null]);
      
      if (newMelds <= 0) {
        setTimeout(() => endGame(false, found), 500);
      }
    }
  };

  const handleHint = () => {
    if (over) return;
    const rem = wordOrder.filter(k => !found.includes(k));
    if (!rem.length) return;
    
    if (melds <= HINT_COST) {
      showToast('Not enough melds to hint.', 'err');
      return;
    }
    
    showToast('Try a word starting with ' + rem[0].split('+')[0]);
    const newMelds = melds - HINT_COST;
    setMelds(newMelds);
    if (newMelds <= 0) {
      setTimeout(() => endGame(false, found), 500);
    }
  };

  const endGame = (perfect, currentFound) => {
    setOver(true);
    setShowEndCard(true);

    const newRevealed = [];
    wordOrder.forEach(k => {
      if (!currentFound.includes(k)) {
        newRevealed.push(k);
      }
    });
    setRevealed(newRevealed);

    recordResult(playerId, perfect).then(setStreak);
  };

  const copyResult = () => {
    const grid = wordOrder.map(k => {
      if (found.includes(k)) return validWords[k].key ? '🟨' : '🟩';
      return '⬜';
    }).join('');
    
    const text = `MELD #${puzzle.day || 1}  ${score}pts\n${grid}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Copied!', 'good'))
        .catch(() => showToast('Copy failed', 'err'));
    } else {
      showToast('Copy not supported on this browser', 'err');
    }
  };

  if (puzzleError) return <div>Couldn't load today's puzzle. Please refresh.</div>;
  if (!puzzle) return <div>Loading...</div>;

  return (
    <>
    <div
      ref={wrapRef}
      className="w-full max-w-[430px] mx-auto flex flex-col"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      <header className="mb-3 w-full max-w-[360px] mx-auto">
        <div className="flex items-end justify-between">
          <div className="text-left">
            <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold mb-1 block">MELDS LEFT</span>
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: START_MELDS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i >= melds ? 'bg-[#E0D2BB] scale-[0.62]' : 'bg-coral'}`}
                ></span>
              ))}
            </div>
          </div>
          <h1 className="font-slab text-[30px] tracking-wider font-bold m-0 uppercase text-charcoal leading-none">MELD</h1>
          <div className="text-right">
            <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold mb-1 block">SCORE</span>
            <div className="text-xl font-bold text-charcoal leading-none">{score}</div>
          </div>
        </div>
        <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-muted m-0 mt-2 text-center">
          <span className="text-coral">#{puzzle.day || 1}</span> &middot; {puzzle.theme || 'FIRESIDE'}
        </p>
      </header>

      <div className="bg-white border border-tile-edge rounded-[20px] pt-6 px-4 pb-5 flex flex-col items-center mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-center items-center gap-3 w-full mb-4">
          <div className={`w-[110px] h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${slots[0] ? 'border-[#d1c8b8] bg-transparent p-0' : 'border-[#E6E1D6] bg-[#F5F2EB]'}`}>
            {slots[0] && (
              <div className={`${TILE_INSLOT} font-slab`} onClick={() => handlePull(0)}>
                {slots[0].txt}
              </div>
            )}
          </div>
          <span className="text-2xl text-[#c9c1b1] font-semibold">+</span>
          <div className={`w-[110px] h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${slots[1] ? 'border-[#d1c8b8] bg-transparent p-0' : 'border-[#E6E1D6] bg-[#F5F2EB]'}`}>
            {slots[1] && (
              <div className={`${TILE_INSLOT} font-slab`} onClick={() => handlePull(1)}>
                {slots[1].txt}
              </div>
            )}
          </div>
        </div>
        <div className="text-[13px] text-muted mb-4 text-center">
          {slots[0] && slots[1] ? (
            <span className="text-moss-deep font-bold tracking-widest">
              {slots[0].txt + slots[1].txt}
            </span>
          ) : (
            'tap two chunks to meld'
          )}
        </div>
        <button
          className={`${PRIMARY_BTN} font-slab text-lg tracking-[0.02em] px-6 py-3.5`}
          disabled={over || !slots[0] || !slots[1]}
          onClick={handleMeld}
        >
          Meld
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 mx-auto max-w-[380px]">
        {tiles.map((t, i) => {
          const isSelected = slots.some(s => s && s.idx === i);
          const isFlashing = flashTiles.includes(i);
          return (
            <div
              key={i}
              className={`${TILE_BANK} font-slab ${isSelected ? 'opacity-30 pointer-events-none' : ''} ${isFlashing ? 'animate-flash' : ''}`}
              onClick={() => handlePick(i)}
            >
              {t}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center my-4">
        {!over ? (
          <>
            <button className={`${SECONDARY_BTN} text-coral-deep border-[#e3c4be] bg-[#fdf5f3] flex items-center`} onClick={handleHint} disabled={over}>
              <LightbulbIcon /> Hint (-1 meld)
            </button>
            <button className={SECONDARY_BTN} onClick={handleClear} disabled={over}>
              Clear
            </button>
          </>
        ) : (
          <button className={`${PRIMARY_BTN} font-slab px-6 py-2.5 text-[15px]`} onClick={() => setShowEndCard(true)}>
            Show Result
          </button>
        )}
      </div>

      <div className="mt-auto mb-5">
        <h3 className="text-[11px] tracking-[0.16em] uppercase text-muted font-bold m-0 mb-2 ml-1">TODAY'S FIVE</h3>
        <div className="bg-white border border-tile-edge rounded-[20px] p-4 flex flex-col gap-3">
          {wordOrder.map((k, idx) => {
            const isFound = found.includes(k);
            const isMissed = revealed.includes(k);
            const isKey = validWords[k]?.key;

            if (isFound || isMissed) {
              return (
                <div key={k} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isKey ? 'border-2 border-coral bg-transparent text-coral' : 'bg-[#F5F2EB] text-muted'}`}>
                    {isKey ? <KeyIcon /> : (idx + 1)}
                  </div>
                  <div
                    className={`font-slab text-lg font-bold tracking-wider uppercase animate-flyin ${isKey ? 'text-coral' : 'text-charcoal'} ${isMissed ? 'opacity-50' : ''}`}
                  >
                    {validWords[k].word}
                  </div>
                  {isKey && <div className="ml-auto text-[10px] tracking-[0.16em] uppercase text-coral font-bold">KEYSTONE</div>}
                </div>
              );
            }

            // Empty slot
            return (
              <div key={`empty-${idx}`} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isKey ? 'border-2 border-coral bg-transparent text-coral' : 'bg-[#F5F2EB] text-muted'}`}>
                  {isKey ? <KeyIcon /> : (idx + 1)}
                </div>
                {isKey && <div className="ml-auto text-[10px] tracking-[0.16em] uppercase text-coral font-bold">KEYSTONE</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {showEndCard && (
      <>
        <div className="fixed inset-0 bg-[rgba(237,232,223,0.85)] backdrop-blur-sm z-50 animate-fade-in" onClick={() => setShowEndCard(false)} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[380px] pt-10 px-6 pb-8 bg-tile border border-tile-edge rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)] text-center animate-flyin-slow z-100">
          <button
            className="absolute top-4 right-4 bg-transparent border-none text-[28px] text-muted cursor-pointer w-9 h-9 flex items-center justify-center rounded-full leading-none transition-all duration-200 hover:bg-[#E0D2BB] hover:text-ink active:scale-90"
            onClick={() => setShowEndCard(false)}
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="font-slab text-[32px] font-bold m-0 mb-3 text-ink">{found.length === totalWords ? 'Melded ☕' : 'Out of melds'}</h2>
          <p className="text-[15px] text-ink-soft m-0 mb-6">
            Found <b>{found.length}/{totalWords}</b> &middot; score <b>{score}</b>
            {found.length === totalWords && ` · ${melds} to spare`}
          </p>
          <p className="text-[15px] text-ink-soft m-0 mb-6">
            Streak: <b>{streak.current_streak}🔥</b> &middot; best <b>{streak.longest_streak}</b>
          </p>
          <div className="font-mono text-[15px] tracking-widest bg-white/60 border border-dashed border-tile-edge rounded-xl p-4 mb-6 whitespace-pre-line text-left">
            {`MELD #${puzzle.day || 1}  ${score}pts\n`}
            {wordOrder.map(k => found.includes(k) ? (validWords[k].key ? '🟨' : '🟩') : '⬜').join('')}
          </div>
          <button className={`${PRIMARY_BTN} font-slab`} onClick={copyResult}>
            Copy result
          </button>
        </div>
      </>
    )}

    <div className={`fixed left-1/2 bottom-10 -translate-x-1/2 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 z-90 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'} ${toast.type === 'err' ? 'bg-err' : toast.type === 'good' ? 'bg-moss-deep' : 'bg-charcoal'}`}>
      {toast.msg}
    </div>
    </>
  );
}
