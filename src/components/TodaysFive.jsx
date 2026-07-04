import { KeyIcon } from './icons';

// The found-words ledger. Each of the day's five words starts as a small
// numbered "seed"; when found it blooms into a readable word pill. The
// keystone seed carries the key icon and blooms in coral. On a loss, missed
// words appear as muted pills so the player is never left wondering.
function LedgerSlot({ number, word, isKey, state }) {
  if (state === 'hidden') {
    return (
      <span className={`h-8 min-w-8 px-0 rounded-full border flex items-center justify-center ${isKey ? 'bg-coral-mist border-[#F0C9BE]' : 'bg-paper-deep border-paper-line'}`}>
        {isKey ? (
          <span className="text-coral"><KeyIcon /></span>
        ) : (
          <span className="text-[11px] text-muted font-bold">{number}</span>
        )}
      </span>
    );
  }

  const missed = state === 'missed';
  return (
    <span
      className={`h-8 px-3 rounded-full border-[1.5px] flex items-center gap-1.5 animate-flyin ${
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

export default function TodaysFive({ wordOrder, validWords, found, revealed }) {
  const foundCount = wordOrder.filter((k) => found.includes(k)).length;

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-1.5 px-1">
        <h3 className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold m-0">Today&rsquo;s five</h3>
        <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold">{foundCount}/5</span>
      </div>
      <div className="flex flex-wrap items-start content-start gap-1.5 min-h-[74px]">
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
            />
          );
        })}
      </div>
    </section>
  );
}
