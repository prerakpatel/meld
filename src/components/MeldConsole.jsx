import { PRIMARY_BTN } from './styles';

const TILE_INSLOT = 'w-full h-full rounded-xl bg-white border-2 border-charcoal flex items-center justify-center text-xl font-bold text-charcoal cursor-pointer select-none font-slab';

function Slot({ chunk, onPull }) {
  return (
    <div className={`w-[clamp(104px,29vw,124px)] h-(--slot-h) rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${chunk ? 'border-tile-edge bg-transparent p-0' : 'border-paper-line bg-paper-deep'}`}>
      {chunk && (
        <div className={TILE_INSLOT} onClick={onPull}>
          {chunk.txt}
        </div>
      )}
    </div>
  );
}

export default function MeldConsole({ slots, onPull, onMeld, disabled, shaking }) {
  return (
    <div className={`bg-white border border-paper-line rounded-[20px] pt-3.5 px-3 pb-3 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${shaking ? 'animate-shake' : ''}`}>
      <div className="flex justify-center items-center gap-3 w-full mb-1.5">
        <Slot chunk={slots[0]} onPull={() => onPull(0)} />
        <span className="text-2xl text-[#c9c1b1] font-semibold">+</span>
        <Slot chunk={slots[1]} onPull={() => onPull(1)} />
      </div>
      <div className="text-[13px] text-muted mb-2 text-center h-5 flex items-center justify-center">
        {slots[0] && slots[1] ? (
          <span className="text-moss-deep font-bold tracking-widest font-slab">
            {slots[0].txt + slots[1].txt}
          </span>
        ) : (
          'tap two chunks to meld'
        )}
      </div>
      <button
        className={`${PRIMARY_BTN} font-slab text-lg tracking-[0.02em] px-6 h-(--btn-h) flex items-center justify-center`}
        disabled={disabled}
        onClick={onMeld}
      >
        Meld
      </button>
    </div>
  );
}
