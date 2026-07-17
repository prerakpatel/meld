// The one piece of MELD that isn't static: a tiny, stateless endpoint that
// tells the client what time it really is, using Vercel's own clock — not
// the player's device clock, which anyone can change in Settings to preview
// tomorrow's puzzle early or replay today's after resetting it back.
//
// No database, no accounts, nothing to maintain — just today's date, always
// freshly computed, never cached.

export const config = { runtime: 'edge' };

export default function handler() {
  return new Response(JSON.stringify({ now: new Date().toISOString() }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
