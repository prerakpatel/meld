import emberFlame from '../assets/ember.webp';

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function Header({ meldsLeft, totalMelds, score, dayNumber, theme, themeShimmer, practice, ember, onHelp, onWordmarkTap }) {
  const now = new Date();
  // The subtitle is the day's theme when it genuinely has one, else the date.
  const dateLabel = practice ? 'PRACTICE' : theme ?? `${MONTHS[now.getMonth()]} ${now.getDate()}`;

  return (
    <header className="w-full relative">
      <button
        className="absolute -top-1 -right-1.5 w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none text-muted cursor-pointer transition-colors duration-150 hover:text-ink active:scale-90"
        onClick={onHelp}
        aria-label="How to play"
      >
        <span className="material-symbols-rounded text-[24px] leading-none" aria-hidden="true">help</span>
      </button>
      <h1
        className="font-display text-[length:var(--mast-fs)] tracking-[0.04em] font-normal m-0 uppercase text-charcoal leading-none text-center select-none"
        onClick={onWordmarkTap}
      >
        MELD
      </h1>
      <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-muted m-0 mt-1 text-center">
        <span className="text-coral">#{dayNumber}</span> &middot;{' '}
        <span className={themeShimmer ? 'inline-block animate-themein' : ''}>{dateLabel}</span>
      </p>
      <div className="flex items-end justify-between mt-2">
        <div className="text-left">
          <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold block">Melds left</span>
          <div className="flex gap-1.5 items-center h-5">
            {Array.from({ length: totalMelds }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i >= meldsLeft ? 'bg-[#E0D2BB] scale-[0.62]' : 'bg-coral'}`}
              ></span>
            ))}
            {ember && (
              <img
                src={emberFlame}
                alt="Your Ember — today's hint is free"
                title="Your Ember — today's hint is free"
                className="w-4 h-4 ml-0.5"
              />
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold block">Score</span>
          <div className="h-5 flex items-center justify-end">
            <span key={score} className="text-[20px] font-bold text-charcoal leading-none animate-pop origin-right inline-block">{score}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
