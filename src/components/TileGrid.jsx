const TILE_BANK = 'w-full h-[52px] rounded-xl bg-white border-2 border-charcoal shadow-[0_4px_0_#1a1a1a] flex items-center justify-center text-[17px] font-bold text-charcoal cursor-pointer select-none transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-[0_0_0_#1a1a1a] px-1 font-slab';

// Fixed 4x2 grid: every puzzle has exactly 8 chunks of 3-4 letters, so the
// board is the same shape every single day (like Wordle's grid).
export default function TileGrid({ tiles, selectedIdxs, flashIdxs, onPick }) {
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 w-full">
      {tiles.map((t, i) => {
        const isSelected = selectedIdxs.includes(i);
        const isFlashing = flashIdxs.includes(i);
        return (
          <div
            key={i}
            className={`${TILE_BANK} ${isSelected ? 'opacity-30 pointer-events-none' : ''} ${isFlashing ? 'animate-flash' : ''}`}
            onClick={() => onPick(i)}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
}
