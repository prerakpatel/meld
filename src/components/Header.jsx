const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function Header({ meldsLeft, totalMelds, score, dayNumber }) {
  const now = new Date();
  const dateLabel = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

  return (
    <header className="w-full">
      <h1 className="font-slab text-[length:var(--mast-fs)] tracking-wider font-bold m-0 uppercase text-charcoal leading-none text-center">MELD</h1>
      <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-muted m-0 mt-1 text-center">
        <span className="text-coral">#{dayNumber}</span> &middot; {dateLabel}
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
