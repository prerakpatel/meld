const TILE_BANK = 'w-full h-(--tile-h) rounded-xl bg-white border-2 flex items-center justify-center text-[length:var(--tile-fs)] font-bold cursor-pointer select-none transition-[transform,box-shadow] duration-100 px-1 font-slab';

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
            className={`${TILE_BANK} border-charcoal text-charcoal shadow-[3px_4px_0_#1a1a1a] active:translate-x-[3px] active:translate-y-[4px] active:shadow-none ${isSelected ? 'opacity-30 pointer-events-none' : ''} ${isFlashing ? 'animate-flash' : ''}`}
            onClick={() => onPick(i)}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
}
