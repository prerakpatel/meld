import { KeyIcon } from './icons';
import { PRIMARY_BTN } from './styles';

const MINI_TILE = 'inline-flex items-center justify-center h-7 px-2 rounded-lg bg-white border-2 border-charcoal shadow-[2px_2px_0_#1a1a1a] font-slab text-[13px] font-bold text-charcoal';

function Rule({ children }) {
  return <li className="text-[13px] leading-snug text-ink-soft">{children}</li>;
}

export default function HowToPlay({ onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-[rgba(237,232,223,0.85)] backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[380px] max-h-[92svh] overflow-y-auto pt-6 px-6 pb-5 bg-tile border border-tile-edge rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)] animate-flyin-slow z-[100]">
        <button
          className="absolute top-4 right-4 bg-transparent border-none text-[28px] text-muted cursor-pointer w-9 h-9 flex items-center justify-center rounded-full leading-none transition-all duration-200 hover:bg-[#E0D2BB] hover:text-ink active:scale-90"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="font-slab text-[24px] font-bold m-0 mb-0.5 text-ink text-center">How to play</h2>
        <p className="text-[13px] text-muted m-0 mb-3 text-center">Meld chunks into words. Find all five.</p>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className={MINI_TILE}>COT</span>
          <span className="text-muted font-semibold">+</span>
          <span className={MINI_TILE}>TON</span>
          <span className="text-muted font-semibold">=</span>
          <span className="font-slab text-[15px] font-bold text-moss-deep tracking-wide">COTTON</span>
        </div>

        <ul className="m-0 mb-3 pl-4 flex flex-col gap-2 list-disc marker:text-coral">
          <Rule>Tap two chunks, then press <b>Meld</b> — every word is exactly two chunks.</Rule>
          <Rule>Find all <b>five</b> of today&rsquo;s words. A chunk can belong to more than one word, so tiles never disappear.</Rule>
          <Rule>A wrong meld spends one of your <b>4 melds</b>. Spend them all and the day is over.</Rule>
          <Rule>
            <span className="inline-flex items-center gap-1 align-middle text-coral"><KeyIcon className="inline-block" /></span>{' '}
            One word is the <b>keystone</b> — finding it is worth extra points.
          </Rule>
          <Rule>Stuck? A <b>hint</b> places a word&rsquo;s first chunk for you and keeps it glowing. It costs 1 meld.</Rule>
        </ul>

        <p className="text-[12px] text-muted m-0 mb-3 text-center">A new puzzle at midnight — the same five words for everyone.</p>

        <button className={`${PRIMARY_BTN} text-lg px-6 py-2.5`} onClick={onClose}>
          Play
        </button>

        <p className="text-[10px] tracking-[0.12em] uppercase text-muted m-0 mt-3 text-center">
          An original game by Prerak Patel
        </p>
      </div>
    </>
  );
}
