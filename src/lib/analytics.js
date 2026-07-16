// Anonymous, cookie-free analytics via Umami Cloud — inert until a website
// id is configured (VITE_UMAMI_WEBSITE_ID env var, set in Vercel).
//
// The rule: the game must never NEED the network to play. Every call here is
// fire-and-forget and fails silently; nothing blocks or breaks offline.
//
// "New vs. returning" is self-reported by the device (from its own local
// stats) rather than by tracking people — more accurate and more private.

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const SCRIPT_SRC = 'https://cloud.umami.is/script.js';

export function initAnalytics() {
  // No id configured, or local development: stay silent.
  if (!WEBSITE_ID || import.meta.env.DEV) return;
  try {
    const script = document.createElement('script');
    script.defer = true;
    script.src = SCRIPT_SRC;
    script.dataset.websiteId = WEBSITE_ID;
    document.head.appendChild(script);
  } catch (err) {
    console.warn('MELD: analytics failed to load', err);
  }
}

// Fire-and-forget custom event. No-ops when the script isn't loaded
// (unconfigured, blocked by the browser, or offline).
export function track(event, data) {
  try {
    window.umami?.track(event, data);
  } catch (err) {
    console.warn('MELD: analytics event failed', err);
  }
}
