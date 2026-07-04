const TILE_BANK = 'w-full h-(--tile-h) rounded-xl border-2 flex items-center justify-center text-[length:var(--tile-fs)] font-bold select-none transition-all duration-200 px-1 font-slab';

// Fixed 4x2 grid: every puzzle has exactly 8 chunks of 3-4 letters, so the
// board is the same shape every single day (like Wordle's grid).
// On a win the tiles flash in a staggered wave (celebrate); once the game is
// over they settle into quiet paper.
export default function TileGrid({ tiles, selectedIdxs, flashIdxs, over, celebrate, onPick }) {
  const quiet = over && !celebrate;
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 w-full">
      {tiles.map((t, i) => {
        const isSelected = selectedIdxs.includes(i);
        const isFlashing = flashIdxs.includes(i) || celebrate;
        return (
          <div
            key={i}
            className={`${TILE_BANK} ${
              quiet
                ? 'bg-paper-deep border-paper-line text-muted shadow-none pointer-events-none'
                : 'bg-white border-charcoal text-charcoal cursor-pointer shadow-[3px_4px_0_#1a1a1a] active:translate-x-[3px] active:translate-y-[4px] active:shadow-none'
            } ${isSelected ? 'opacity-30 pointer-events-none' : ''} ${isFlashing ? 'animate-flash' : ''}`}
            style={celebrate ? { animationDelay: `${i * 70}ms` } : undefined}
            onClick={() => onPick(i)}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
}
