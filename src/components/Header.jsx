const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function Header({ meldsLeft, totalMelds, score, dayNumber }) {
  const now = new Date();
  const dateLabel = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

  return (
    <header className="w-full">
      <div className="flex items-end justify-between">
        <div className="text-left min-w-[72px]">
          <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold mb-1 block">Melds left</span>
          <div className="flex gap-1.5 items-center h-3.5">
            {Array.from({ length: totalMelds }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i >= meldsLeft ? 'bg-[#E0D2BB] scale-[0.62]' : 'bg-coral'}`}
              ></span>
            ))}
          </div>
        </div>
        <h1 className="font-slab text-[28px] tracking-wider font-bold m-0 uppercase text-charcoal leading-none">MELD</h1>
        <div className="text-right min-w-[72px]">
          <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold mb-1 block">Score</span>
          <div key={score} className="text-xl font-bold text-charcoal leading-none animate-pop origin-right">{score}</div>
        </div>
      </div>
      <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-muted m-0 mt-1.5 text-center">
        <span className="text-coral">#{dayNumber}</span> &middot; {dateLabel}
      </p>
    </header>
  );
}
