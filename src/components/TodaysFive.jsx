import { KeyIcon } from './icons';

// The found-words ledger. Each of the day's five words starts as a small
// numbered "seed"; when found it blooms into a readable word pill. The
// keystone seed carries the key icon and blooms in coral. A hinted word's
// seed glows coral so the player knows where their hint lives. On a loss,
// missed words appear as muted pills so the player is never left wondering.
function LedgerSlot({ number, word, isKey, state, hinted, onSeatTap }) {
  if (state === 'hidden') {
    // Dashed hollow circles read as empty seats, not buttons; a tap still
    // gets a friendly explanation instead of a dead press.
    return (
      <button
        type="button"
        className={`h-(--seed-h) min-w-(--seed-h) px-0 rounded-full border border-dashed bg-transparent flex items-center justify-center cursor-default ${
          hinted
            ? 'border-coral'
            : isKey
              ? 'border-[#F0C9BE]'
              : 'border-[#cfc7b8]'
        }`}
        onClick={() => onSeatTap(isKey)}
        aria-label={isKey ? 'Seat for the keystone word' : `Seat for word ${number}`}
      >
        {isKey ? (
          <span className="text-coral opacity-80"><KeyIcon /></span>
        ) : (
          <span className={`text-[11px] font-bold ${hinted ? 'text-coral-deep' : 'text-muted'}`}>{number}</span>
        )}
      </button>
    );
  }

  const missed = state === 'missed';
  return (
    <span
      className={`h-(--seed-h) px-3 rounded-full border-[1.5px] flex items-center gap-1.5 animate-flyin ${
        missed
          ? 'bg-transparent border-dashed border-[#cfc7b8]'
          : isKey
            ? 'bg-coral-mist border-coral'
            : 'bg-white border-tile-edge'
      }`}
    >
      {isKey && <span className={missed ? 'text-muted' : 'text-coral'}><KeyIcon className="block" /></span>}
      <span className={`font-slab text-[13px] font-bold uppercase tracking-wide leading-none ${missed ? 'text-muted' : isKey ? 'text-coral-deep' : 'text-charcoal'}`}>
        {word}
      </span>
    </span>
  );
}

export default function TodaysFive({ wordOrder, validWords, found, revealed, hintedKeys, onSeatTap }) {
  const foundCount = wordOrder.filter((k) => found.includes(k)).length;

  return (
    <section className="w-full border-t border-[#DCD5C7] pt-2">
      <div className="flex items-baseline justify-between mb-1.5 px-1">
        <h3 className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold m-0">Today&rsquo;s five</h3>
        <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold">{foundCount}/5</span>
      </div>
      <div className="flex flex-wrap items-start content-start gap-1.5 min-h-[calc(2*var(--seed-h)+0.375rem)]">
        {wordOrder.map((k, idx) => {
          const isFound = found.includes(k);
          const isMissed = revealed.includes(k);
          return (
            <LedgerSlot
              key={k}
              number={idx + 1}
              word={validWords[k]?.word}
              isKey={validWords[k]?.key}
              state={isFound ? 'found' : isMissed ? 'missed' : 'hidden'}
              hinted={hintedKeys.includes(k) && !isFound}
              onSeatTap={onSeatTap}
            />
          );
        })}
      </div>
    </section>
  );
}
