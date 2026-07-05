import { useRef, useLayoutEffect } from 'react';

const TILE_BANK = 'w-full h-(--tile-h) rounded-xl border-2 flex items-center justify-center text-[length:var(--tile-fs)] font-bold select-none transition-all duration-200 px-1 font-slab';

// Fixed 4x2 grid: every puzzle has exactly 8 chunks of 3-4 letters, so the
// board is the same shape every single day (like Wordle's grid).
// On a win the tiles flash in a staggered wave (celebrate); once the game is
// over they settle into quiet paper. Shuffles animate FLIP-style: each tile
// glides from its old position to its new one.
export default function TileGrid({ tiles, selectedChunks, flashChunks, over, celebrate, onPick }) {
  const quiet = over && !celebrate;
  const containerRef = useRef(null);
  const positionsRef = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextPositions = new Map();
    for (const el of container.children) {
      nextPositions.set(el.dataset.chunk, el.getBoundingClientRect());
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      for (const el of container.children) {
        const prev = positionsRef.current.get(el.dataset.chunk);
        if (!prev) continue;
        const now = nextPositions.get(el.dataset.chunk);
        const dx = prev.left - now.left;
        const dy = prev.top - now.top;
        if (dx || dy) {
          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: 'translate(0, 0)' },
            ],
            { duration: 450, easing: 'cubic-bezier(0.22, 0.9, 0.24, 1)' },
          );
        }
      }
    }
    positionsRef.current = nextPositions;
  }, [tiles]);

  return (
    <div ref={containerRef} className="grid grid-cols-4 grid-rows-2 gap-2 w-full">
      {tiles.map((t, i) => {
        const isSelected = selectedChunks.includes(t);
        const isFlashing = flashChunks.includes(t) || celebrate;
        return (
          <div
            key={t}
            data-chunk={t}
            className={`${TILE_BANK} ${
              quiet
                ? 'bg-paper-deep border-paper-line text-muted shadow-none pointer-events-none'
                : 'bg-white border-charcoal text-charcoal cursor-pointer shadow-[3px_4px_0_#1a1a1a] active:translate-x-[3px] active:translate-y-[4px] active:shadow-none'
            } ${isSelected ? 'opacity-30 pointer-events-none' : ''} ${isFlashing ? 'animate-flash' : ''}`}
            style={celebrate ? { animationDelay: `${i * 70}ms` } : undefined}
            onClick={() => onPick(t)}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
}
