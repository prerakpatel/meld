import { PRIMARY_BTN } from './styles';

const TILE_INSLOT = 'w-full h-full rounded-xl bg-white border-2 border-charcoal flex items-center justify-center text-xl font-bold text-charcoal cursor-pointer select-none font-slab shadow-[2px_3px_0_#1a1a1a]';

function Slot({ chunk, onPull }) {
  return (
    <div className={`w-[clamp(104px,29vw,124px)] h-(--slot-h) rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${chunk ? 'border-transparent bg-transparent p-0' : 'border-paper-line bg-paper-deep'}`}>
      {chunk ? (
        <div className={TILE_INSLOT} onClick={onPull}>
          {chunk.txt}
        </div>
      ) : (
        <span className="text-[13px] text-[#c9c1b1] font-semibold select-none">chunk</span>
      )}
    </div>
  );
}

export default function MeldConsole({ slots, clue, onPull, onMeld, disabled, shaking }) {
  return (
    <div className={`bg-white border border-paper-line rounded-[20px] pt-3.5 px-3.5 pb-3.5 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${shaking ? 'animate-shake' : ''}`}>
      <div className="flex justify-center items-center gap-2.5 w-full mb-1.5">
        <Slot chunk={slots[0]} onPull={() => onPull(0)} />
        <span className="w-7 h-7 shrink-0 rounded-full bg-white border border-paper-line flex items-center justify-center text-lg text-[#c9c1b1] font-semibold leading-none">+</span>
        <Slot chunk={slots[1]} onPull={() => onPull(1)} />
      </div>
      <div className="text-[13px] text-muted mb-2 text-center min-h-5 flex items-center justify-center w-full min-w-0">
        {slots[0] && slots[1] ? (
          <span className="text-moss-deep font-bold tracking-widest font-slab">
            {slots[0].txt + slots[1].txt}
          </span>
        ) : clue ? (
          <span className="text-[12px] leading-snug text-coral-deep italic line-clamp-2 px-1">
            💡 {clue}
          </span>
        ) : (
          'tap two chunks to meld'
        )}
      </div>
      <button
        className={`${PRIMARY_BTN} text-lg tracking-[0.02em] px-6 h-(--btn-h) flex items-center justify-center`}
        disabled={disabled}
        onClick={onMeld}
      >
        Meld
      </button>
    </div>
  );
}
