// Domain filter, DOMAIN_MAP, and NextDNS log processing.
// Kept in a separate file so filter rules are never accidentally overwritten when home.js is edited.
// To add/remove filtered domains, edit ONLY this file.

export const DOMAIN_MAP = {
  // Social
  'instagram.com':   { name: 'Instagram',    d: 'instagram' },
  'tiktok.com':      { name: 'TikTok',       d: 'tiktok' },
  'twitter.com':     { name: 'Twitter',      d: 'twitter' },
  'x.com':           { name: 'Twitter',      d: 'twitter' },
  'snapchat.com':    { name: 'Snapchat',     d: 'snapchat' },
  'pinterest.com':   { name: 'Pinterest',    d: 'social' },
  'tumblr.com':      { name: 'Tumblr',       d: 'social' },
  'reddit.com':      { name: 'Reddit',       d: 'reddit' },
  'facebook.com':    { name: 'Facebook',     d: 'social' },
  'linkedin.com':    { name: 'LinkedIn',     d: 'social' },
  'bereal.com':      { name: 'BeReal',       d: 'social' },
  // Video
  'youtube.com':     { name: 'YouTube',      d: 'youtube' },
  'netflix.com':     { name: 'Netflix',      d: 'video' },
  'hulu.com':        { name: 'Hulu',         d: 'video' },
  'disneyplus.com':  { name: 'Disney+',      d: 'video' },
  'twitch.tv':       { name: 'Twitch',       d: 'video' },
  'vimeo.com':       { name: 'Vimeo',        d: 'video' },
  'peacocktv.com':   { name: 'Peacock',      d: 'video' },
  'paramountplus.com': { name: 'Paramount+', d: 'video' },
  'hbomax.com':      { name: 'Max',          d: 'video' },
  'max.com':         { name: 'Max',          d: 'video' },
  'primevideo.com':  { name: 'Prime Video',  d: 'video' },
  'crunchyroll.com': { name: 'Crunchyroll',  d: 'video' },
  // Music
  'spotify.com':     { name: 'Spotify',      d: 'spotify' },
  'soundcloud.com':  { name: 'SoundCloud',   d: 'music' },
  'pandora.com':     { name: 'Pandora',      d: 'music' },
  'tidal.com':       { name: 'Tidal',        d: 'music' },
  'deezer.com':      { name: 'Deezer',       d: 'music' },
  'apple.com':       { name: 'Apple Music',  d: 'music' },
  // Gaming
  'discord.com':     { name: 'Discord',      d: 'discord' },
  'steam.com':       { name: 'Steam',        d: 'gaming' },
  'epicgames.com':   { name: 'Epic Games',   d: 'gaming' },
  'roblox.com':      { name: 'Roblox',       d: 'gaming' },
  'minecraft.net':   { name: 'Minecraft',    d: 'gaming' },
  'xbox.com':        { name: 'Xbox',         d: 'gaming' },
  'playstation.com': { name: 'PlayStation',  d: 'gaming' },
  // Shopping
  'amazon.com':      { name: 'Amazon',       d: 'shopping' },
  'ebay.com':        { name: 'eBay',         d: 'shopping' },
  'etsy.com':        { name: 'Etsy',         d: 'shopping' },
  'shein.com':       { name: 'SHEIN',        d: 'shopping' },
  'target.com':      { name: 'Target',       d: 'shopping' },
  'walmart.com':     { name: 'Walmart',      d: 'shopping' },
  'bestbuy.com':     { name: 'Best Buy',     d: 'shopping' },
  'nike.com':        { name: 'Nike',         d: 'shopping' },
  'fashionnova.com': { name: 'Fashion Nova', d: 'shopping' },
  // Food
  'doordash.com':    { name: 'DoorDash',     d: 'food' },
  'ubereats.com':    { name: 'Uber Eats',    d: 'food' },
  'grubhub.com':     { name: 'Grubhub',      d: 'food' },
  'chipotle.com':    { name: 'Chipotle',     d: 'food' },
  // Dating
  'tinder.com':      { name: 'Tinder',       d: 'dating' },
  'bumble.com':      { name: 'Bumble',       d: 'dating' },
  'hinge.co':        { name: 'Hinge',        d: 'dating' },
  'match.com':       { name: 'Match',        d: 'dating' },
  // News
  'nytimes.com':     { name: 'NY Times',     d: 'news' },
  'cnn.com':         { name: 'CNN',          d: 'news' },
  'bbc.com':         { name: 'BBC',          d: 'news' },
  'foxnews.com':     { name: 'Fox News',     d: 'news' },
  'buzzfeed.com':    { name: 'BuzzFeed',     d: 'news' },
  // Sports
  'espn.com':        { name: 'ESPN',         d: 'sports' },
  'nba.com':         { name: 'NBA',          d: 'sports' },
  'nfl.com':         { name: 'NFL',          d: 'sports' },
  'mlb.com':         { name: 'MLB',          d: 'sports' },
  // Tech
  'github.com':      { name: 'GitHub',       d: 'github' },
  'stackoverflow.com': { name: 'Stack Overflow', d: 'tech' },
  'google.com':      { name: 'Google',       d: 'tech' },
  'gmail.com':       { name: 'Gmail',        d: 'email' },
  'outlook.com':     { name: 'Outlook',      d: 'email' },
  'yahoo.com':       { name: 'Yahoo',        d: 'tech' },
  // Travel
  'airbnb.com':      { name: 'Airbnb',       d: 'travel' },
  'expedia.com':     { name: 'Expedia',      d: 'travel' },
  'booking.com':     { name: 'Booking',      d: 'travel' },
  'uber.com':        { name: 'Uber',         d: 'travel' },
  'lyft.com':        { name: 'Lyft',         d: 'travel' },
  // Finance
  'paypal.com':      { name: 'PayPal',       d: 'finance' },
  'venmo.com':       { name: 'Venmo',        d: 'finance' },
  'cashapp.com':     { name: 'Cash App',     d: 'finance' },
  'robinhood.com':   { name: 'Robinhood',    d: 'finance' },
  'coinbase.com':    { name: 'Coinbase',     d: 'finance' },
  // AI
  'claude.ai':       { name: 'Claude',       d: 'tech' },
  'grok.com':        { name: 'Grok',         d: 'tech' },
  // Design
  'canva.com':       { name: 'Canva',        d: 'tech' },
};

// TikTok CDN domains are remapped to tiktok.com so their traffic counts under TikTok.
const TIKTOK_ALIASES = new Set(['tiktokcdn-us.com', 'tiktokv.us']);

// Infrastructure substrings — any domain containing one of these is hidden regardless of DOMAIN_MAP.
// This covers CDN, analytics, tracking, telemetry, and app background traffic.
const INFRA_SUBSTRINGS = [
  'cdn', 'static', 'assets', 'tracker', 'tracking', 'telemetry',
  'analytics', 'measurement', 'doubleclick', 'adsystem', 'adservice',
  'metric', 'beacon', 'pixel', 'crashlytics', 'sentry', 'datadog',
  'newrelic', 'hotjar', 'mixpanel', 'segment', 'appsflyer', 'braze',
  'cloudfront', 'akamai', 'fastly', 'akadns', 'edgekey',
  'googleapis', 'gstatic', 'googlevideo', 'googleusercontent',
  'firebase', 'firebaseapp', 'firestore',
  'icloud', 'aaplimg', 'apple-dns',
  'cloudflare', 'cloudflareinsights',
  'digicert', 'letsencrypt', 'ocsp',
  'ytimg', 'googlevideo',
  'supabase', 'nextdns', 'ngrok',
  'appcenter', 'snssdk', 'tokenex', 'sift',
  'exp.host', 'expo',
];

// Returns true if the domain is infrastructure that users never intentionally visit.
function isInfra(root) {
  const lower = root.toLowerCase();
  for (const sub of INFRA_SUBSTRINGS) {
    if (lower.includes(sub)) return true;
  }
  // More than 3 dots = deeply nested CDN/infra subdomain.
  if ((lower.match(/\./g) || []).length > 3) return true;
  return false;
}

// Derive a human-readable display name from a root domain when it's not in DOMAIN_MAP.
// Strips the TLD and capitalizes the first letter: "nytimes.com" → "Nytimes".
function autoName(root) {
  const base = root.split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function formatMins(mins) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

const BROWSER_PATTERNS = [
  /safari/i, /chrome/i, /firefox/i, /chromium/i, /webkit/i,
  /com\.apple\.mobilesafari/i, /com\.google\.chrome/i, /com\.mozilla\.firefox/i,
];

// Returns 'browser', 'app', or null (unknown) based on the NextDNS clientName field.
function getClientType(entry) {
  const raw = (entry.clientName || entry.client || '');
  if (!raw || typeof raw !== 'string') return null;
  for (const pat of BROWSER_PATTERNS) {
    if (pat.test(raw)) return 'browser';
  }
  // Bundle ID format = native app.
  if (/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i.test(raw) && raw.includes('.')) return 'app';
  return null;
}

// Build a sorted app list from NextDNS log entries.
// Show rule: DOMAIN_MAP entries use their mapped name + icon; unknown domains that pass the
// infra filter get an auto-generated name + globe icon; infra domains are always hidden.
export function buildApps(entries) {
  const counts = {};
  for (const entry of entries) {
    const root = TIKTOK_ALIASES.has(entry.root) ? 'tiktok.com' : entry.root;
    if (!counts[root]) counts[root] = { n: 0, browserHits: 0, appHits: 0 };
    counts[root].n++;
    const ct = getClientType(entry);
    if (ct === 'browser') counts[root].browserHits++;
    else if (ct === 'app') counts[root].appHits++;
  }

  const apps = [];
  let shownCount  = 0;
  let hiddenCount = 0;
  for (const [root, { n, browserHits, appHits }] of Object.entries(counts)) {
    if (isInfra(root)) { hiddenCount++; continue; }
    shownCount++;
    const mins   = n * 2;
    const via    = browserHits > appHits ? 'browser' : (appHits > browserHits ? 'app' : null);
    const mapped = DOMAIN_MAP[root];
    apps.push(mapped
      ? { name: mapped.name, d: mapped.d,    dur: formatMins(mins), m: mins, via }
      : { name: autoName(root), d: 'globe',  dur: formatMins(mins), m: mins, via },
    );
  }

  apps.sort((a, b) => b.m - a.m);
  console.log(`[filter] ${shownCount} shown, ${hiddenCount} hidden (infra) out of ${shownCount + hiddenCount} unique domains (${entries.length} log entries)`);
  return apps;
}

// Returns epoch-ms of the most recent log entry, or null if none.
export function getLastSeenAt(entries) {
  if (!entries || entries.length === 0) return null;
  let latest = 0;
  for (const entry of entries) {
    if (!entry.timestamp) continue;
    const t = new Date(entry.timestamp).getTime();
    if (t > latest) latest = t;
  }
  return latest > 0 ? latest : null;
}

// Screen time = number of today's log entries × 2 minutes per entry.
// Each NextDNS log entry represents approximately 2 minutes of active use.
export function calcScreenTimeToday(entries) {
  if (!entries || entries.length === 0) return null;
  const todayStartMs = new Date().setHours(0, 0, 0, 0);
  let count = 0;
  for (const entry of entries) {
    if (!entry.timestamp) continue;
    if (new Date(entry.timestamp).getTime() >= todayStartMs) count++;
  }
  return count > 0 ? count * 2 : 0;
}
