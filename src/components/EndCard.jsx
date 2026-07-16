import { PRIMARY_BTN } from './styles';
import emberFlame from '../assets/ember.webp';

export default function EndCard({ won, foundCount, totalWords, score, meldsLeft, stats, emberEarned, shareText, canShare, onShare, onCopy, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-[rgba(237,232,223,0.85)] backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[380px] max-h-[94svh] overflow-y-auto pt-6 px-6 pb-6 bg-tile border border-tile-edge rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)] text-center animate-flyin-slow z-[100]">
        <button
          className="absolute top-4 right-4 bg-transparent border-none text-[28px] text-muted cursor-pointer w-9 h-9 flex items-center justify-center rounded-full leading-none transition-all duration-200 hover:bg-[#E0D2BB] hover:text-ink active:scale-90"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="font-slab text-[30px] font-bold m-0 mb-1 text-ink">{won ? 'Melded ☕' : 'Out of melds'}</h2>
        <p className="text-[14px] text-ink-soft m-0 mb-4">
          {won
            ? meldsLeft === 4 ? 'All five, not a meld wasted.' : `All five found · ${meldsLeft} ${meldsLeft === 1 ? 'meld' : 'melds'} to spare`
            : `Found ${foundCount} of ${totalWords} — the rest are below.`}
        </p>
        <div className="font-slab text-[44px] font-bold leading-none text-coral mb-1">{score}</div>
        <p className="text-[11px] tracking-[0.16em] uppercase text-muted font-bold m-0 mb-4">points</p>
        {emberEarned && (
          <div
            className="flex flex-col items-center mb-3 animate-flyin-slow"
            style={{ animationDelay: '450ms', animationFillMode: 'both' }}
          >
            <span className="w-12 h-12 rounded-full bg-coral-mist border border-[#F0C9BE] flex items-center justify-center">
              <img src={emberFlame} alt="" className="w-8 h-8" />
            </span>
            <span className="text-[11px] tracking-[0.16em] uppercase font-bold text-coral-deep mt-1.5">Ember earned</span>
            <span className="text-[12px] text-muted mt-0.5">Tomorrow&rsquo;s hint is free</span>
          </div>
        )}
        <p className="text-[14px] text-ink-soft m-0 mb-1">
          Streak <b>{stats.currentStreak}</b> &middot; best <b>{stats.longestStreak}</b>
        </p>
        <p className="text-[12px] text-muted m-0 mb-4">
          Played {stats.gamesPlayed} &middot; won {stats.gamesWon}
          {stats.gamesPlayed > 0 && ` (${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%)`}
        </p>
        <div className="font-mono text-[15px] tracking-widest bg-white/60 border border-dashed border-tile-edge rounded-xl p-3 mb-4 whitespace-pre-line text-left">
          {shareText}
        </div>
        {canShare ? (
          <>
            <button className={`${PRIMARY_BTN} text-lg px-6 py-3`} onClick={onShare}>
              Share result
            </button>
            <button
              className="mt-3 mx-auto block bg-transparent border-none cursor-pointer text-[13px] font-semibold text-muted underline underline-offset-2 hover:text-ink-soft"
              onClick={onCopy}
            >
              Copy instead
            </button>
          </>
        ) : (
          <button className={`${PRIMARY_BTN} text-lg px-6 py-3`} onClick={onCopy}>
            Copy result
          </button>
        )}
      </div>
    </>
  );
}
