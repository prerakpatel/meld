// Shared button/tile class recipes (kept as strings so Tailwind can see them at build time).

// Letterpress language: charcoal outline + angled down-right hard shadow,
// pressed = the element travels into its own shadow.
export const PRIMARY_BTN = 'font-slab font-bold text-charcoal bg-coral rounded-xl border-2 border-charcoal cursor-pointer w-full text-center shadow-[3px_4px_0_#1a1a1a] transition-[transform,box-shadow] duration-100 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none disabled:bg-paper-deep disabled:text-muted disabled:border-paper-line disabled:shadow-none disabled:cursor-default disabled:translate-x-0 disabled:translate-y-0';

export const SECONDARY_BTN = 'px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap border border-[#d1c8b8] bg-transparent text-charcoal active:scale-95 disabled:opacity-50 disabled:cursor-default';
