import { KeyIcon } from './icons';

// The found-words ledger: five fixed seats in a 3 + 2 arrangement, so the
// area keeps the exact same shape whether it holds nothing or five long
// words — nothing ever reflows. The four ordinary words take seats 1-4 and
// the keystone always has the last seat, wider than the rest, with its key
// icon. A seat is a dashed hollow until its word is found, then it fills in
// place. A hinted word's seat glows coral so the player knows where their
// hint lives. On a loss, missed words appear in their seats, muted.
const SEAT = 'h-(--seed-h) rounded-full min-w-0 flex items-center justify-center';

function Seat({ number, word, isKey, state, hinted, onSeatTap, span }) {
  if (state === 'hidden') {
    // Dashed hollow seats read as empty, not as buttons; a tap still gets a
    // friendly explanation instead of a dead press.
    return (
      <button
        type="button"
        className={`${SEAT} ${span} border border-dashed bg-transparent px-0 cursor-default ${
          hinted ? 'border-coral' : isKey ? 'border-[#F0C9BE]' : 'border-[#cfc7b8]'
        }`}
        onClick={() => onSeatTap(isKey)}
        aria-label={isKey ? 'Seat for the keystone word' : `Seat for word ${number}`}
      >
        {isKey ? (
          <span className="flex items-center gap-1.5 text-coral opacity-80">
            <KeyIcon />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase">Keystone</span>
          </span>
        ) : (
          <span className={`text-[11px] font-bold ${hinted ? 'text-coral-deep' : 'text-muted'}`}>{number}</span>
        )}
      </button>
    );
  }

  const missed = state === 'missed';
  return (
    <span
      className={`${SEAT} ${span} gap-1.5 px-2 border-[1.5px] animate-flyin ${
        missed
          ? 'bg-transparent border-dashed border-[#cfc7b8]'
          : isKey
            ? 'bg-coral-mist border-coral'
            : 'bg-white border-tile-edge'
      }`}
    >
      {isKey && <span className={missed ? 'text-muted' : 'text-coral'}><KeyIcon className="block" /></span>}
      <span className={`font-slab text-[length:var(--seat-fs)] font-bold uppercase tracking-wide leading-none truncate ${missed ? 'text-muted' : isKey ? 'text-coral-deep' : 'text-charcoal'}`}>
        {word}
      </span>
    </span>
  );
}

export default function TodaysFive({ wordOrder, validWords, found, revealed, hintedKeys, onSeatTap }) {
  const foundCount = wordOrder.filter((k) => found.includes(k)).length;
  // Ordinary words keep puzzle order in seats 1-4; the keystone is seat 5.
  const seats = [
    ...wordOrder.filter((k) => !validWords[k]?.key),
    ...wordOrder.filter((k) => validWords[k]?.key),
  ];

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-1.5 px-1">
        <h3 className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold m-0">Today&rsquo;s five</h3>
        <span className="text-[10px] tracking-[0.16em] uppercase text-muted font-bold">{foundCount}/{wordOrder.length}</span>
      </div>
      {/* Six columns: seats 1-3 span two each, seats 4-5 span three each. */}
      <div className="grid grid-cols-6 gap-1.5">
        {seats.map((k, idx) => {
          const isFound = found.includes(k);
          const isMissed = revealed.includes(k);
          return (
            <Seat
              key={k}
              number={idx + 1}
              word={validWords[k]?.word}
              isKey={validWords[k]?.key}
              span={idx < 3 ? 'col-span-2' : 'col-span-3'}
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
