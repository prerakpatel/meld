import { useState, useEffect, useMemo, useRef } from 'react';
import './index.css';
import { getTodayPuzzle, getRandomPuzzle } from './puzzles';
import { getVerifiedDate } from './lib/serverTime';
import { hasSeenHowTo, markHowToSeen } from './lib/storage';
import GameBoard from './components/GameBoard';
import HowToPlay from './components/HowToPlay';

// Dev-only day previews are ephemeral (never saved) like practice games.
const isDevDayOverride = import.meta.env.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('day');

const SECRET_TAPS = 7;
const TAP_WINDOW_MS = 1200;

export default function App() {
  // "Today" is decided by a server clock, not the device's — the device
  // clock is exactly what let a player skip to tomorrow's puzzle early or
  // rewind a finished day back to unplayed. `now === undefined` means still
  // resolving; `null` means it could not be verified at all (no network,
  // and never verified before on this device).
  const [now, setNow] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    getVerifiedDate().then((d) => { if (!cancelled) setNow(d); });
    return () => { cancelled = true; };
  }, []);

  const daily = useMemo(() => (now ? getTodayPuzzle(now) : null), [now]);
  const [showHelp, setShowHelp] = useState(() => !hasSeenHowTo());

  // Hidden creator mode: 7 quick taps on the MELD wordmark toggle practice —
  // random puzzles that never touch the daily game, saved progress, or streak.
  const [practicePuzzle, setPracticePuzzle] = useState(null);
  const [dealNonce, setDealNonce] = useState(0);
  const [mountToast, setMountToast] = useState(null);
  const taps = useRef({ count: 0, last: 0 });

  const handleWordmarkTap = () => {
    const tapNow = Date.now();
    taps.current = {
      count: tapNow - taps.current.last < TAP_WINDOW_MS ? taps.current.count + 1 : 1,
      last: tapNow,
    };
    if (taps.current.count < SECRET_TAPS) return;

    taps.current.count = 0;
    if (practicePuzzle) {
      setPracticePuzzle(null);
      setMountToast('Back to today’s puzzle.');
    } else {
      setPracticePuzzle(getRandomPuzzle());
      setMountToast('Practice mode — your daily game is safe.');
    }
    setDealNonce(n => n + 1);
  };

  const dealNewPractice = () => {
    setPracticePuzzle(getRandomPuzzle());
    setMountToast(null);
    setDealNonce(n => n + 1);
  };

  const closeHelp = () => {
    setShowHelp(false);
    markHowToSeen();
  };

  const puzzle = practicePuzzle ?? daily;

  if (now === undefined) {
    // Brief and on-brand — this resolves in well under a second on any
    // normal connection, so it should read as a beat, not a loading screen.
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
        <span className="font-display text-2xl text-charcoal uppercase tracking-[0.04em]">MELD</span>
      </div>
    );
  }

  if (!puzzle) {
    const reason = now === null
      ? 'MELD needs to check the date with our server the first time you play — please connect and try again.'
      : 'Today’s puzzle couldn’t load. Pull to refresh, or try again in a moment.';
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
        <span className="font-slab text-2xl font-bold text-charcoal">MELD</span>
        <p className="text-sm text-ink-soft m-0">{reason}</p>
      </div>
    );
  }

  return (
    <>
      <GameBoard
        key={`${practicePuzzle ? 'practice' : 'daily'}-${puzzle.day}-${dealNonce}`}
        puzzle={puzzle}
        now={practicePuzzle ? new Date() : now}
        ephemeral={!!practicePuzzle || isDevDayOverride}
        practice={!!practicePuzzle}
        mountToast={mountToast}
        onHelp={() => setShowHelp(true)}
        onWordmarkTap={handleWordmarkTap}
        onNewPractice={dealNewPractice}
      />

      {showHelp && <HowToPlay onClose={closeHelp} />}
    </>
  );
}
