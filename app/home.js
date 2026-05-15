import React, { useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path, Circle, Ellipse, Rect, Polygon, G, Text as ST,
} from 'react-native-svg';
import AvatarCustom, { AVATAR_DEFAULTS } from '../components/AvatarCustom';

const W = Dimensions.get('window').width;
const CARD_W = Math.floor((W - 36) / 2);

const P = {
  bg: '#F9F7FF',
  white: '#FFFFFF',
  red: '#E85D75',
  blue: '#5B9BD5',
  redPale: '#FFF0F3',
  bluePale: '#EEF5FF',
  dark: '#1C1C1E',
  mid: '#8E8E93',
  green: '#4CAF82',
  greenPale: '#E8F7EF',
  amberPale: '#FEF3C7',
};

// getDay() returns 0=Sun … 6=Sat; shift to Mon=0 … Sun=6 to match DAYS array.
const TODAY_IDX = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const PEOPLE = [
  {
    id: 'me',
    name: 'You',
    color: P.red,
    pale: P.redPale,
    lastSeenAt: null,
    avatarConfig: { ...AVATAR_DEFAULTS, hairColor: '#E85D75', skinTone: '#FFD0DC' },
    screenTime: '4h 12m',
    streak: 12,
    avgTime: '3h 45m',
    longestDay: '5h 30m',
    week: [252, 210, 290, 180, 320, 180, 145],
    apps: [
      { name: 'Instagram', d: 'instagram', dur: '47m', m: 47 },
      { name: 'YouTube',   d: 'youtube',   dur: '38m', m: 38 },
      { name: 'TikTok',    d: 'tiktok',    dur: '29m', m: 29 },
      { name: 'Twitter',   d: 'twitter',   dur: '22m', m: 22 },
      { name: 'Safari',    d: 'safari',    dur: '18m', m: 18 },
    ],
  },
  {
    id: 'dylan',
    name: 'Dylan',
    color: P.blue,
    pale: P.bluePale,
    lastSeenAt: null,
    avatarConfig: { ...AVATAR_DEFAULTS, hairStyle: 'short', hairColor: '#1A4A6A', skinTone: '#D4EEFA' },
    screenTime: '3h 47m',
    streak: 12,
    avgTime: '3h 20m',
    longestDay: '4h 55m',
    week: [227, 195, 240, 260, 185, 220, 310],
    apps: [
      { name: 'Discord', d: 'discord', dur: '55m', m: 55 },
      { name: 'YouTube', d: 'youtube', dur: '42m', m: 42 },
      { name: 'Reddit',  d: 'reddit',  dur: '21m', m: 21 },
      { name: 'Spotify', d: 'spotify', dur: '15m', m: 15 },
      { name: 'Chrome',  d: 'chrome',  dur: '12m', m: 12 },
    ],
  },
];

// ─── NEXTDNS DATA PROCESSING ─────────────────────────────────────────────────

const DOMAIN_MAP = {
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
};

// Exact root domains that are infrastructure noise — never shown as apps.
const IGNORED_ROOTS = new Set([
  // Apple system infrastructure
  'apple-dns.net', 'icloud.com', 'icloud-content.com', 'mzstatic.com', 'aaplimg.com',
  'ocsp.apple.com', 'push.apple.com', 'courier.push.apple.com',
  'guzzoni.apple.com', 'xp.apple.com', 'mask.icloud.com', 'appattest.apple.com',
  // DNS / CDN / cloud infrastructure
  'akadns.net', 'akamai.net', 'akamaiedge.net', 'akamaihd.net',
  'cloudflare.net', 'cloudfront.net', 'fastly.net', 'amazonaws.com', 'digicert.com',
  'googleapis.com', 'nextdns.io', 'windows.net',
  // Analytics, tracking, crash-reporting SDKs
  'mixpanel.com', 'braze.com', 'intercom.io', 'intercom.com',
  'appsflyersdk.com', 'sentry.io', 'app-analytics-services.com',
  'firebase.com', 'datadoghq.com', 'doubleverify.com', 'supabase.co',
  'pendo.io', 'googletagmanager.com', 'ampproject.org',
  // Identity / SSO providers
  'inscloudgate.net', 'insops.net', 'helloid.cloud', 'helloid.com',
  // LMS / education portals
  'canvaslms.com', 'instructure.com',
  // Screen-time monitor app (its own traffic)
  'stayfreeapps.com',
  // Snapchat CDN (not real usage)
  'sc-gw.com', 'sc-cdn.net',
  // Dev / tunnel / Expo tooling
  'exp.direct', 'exp.host', 'expo.dev',
]);

// Substrings that mark any root domain as infrastructure noise.
const IGNORED_SUBSTRINGS = [
  // Apple / Akamai
  'akadns', 'akamai', 'aaplimg', 'mzstatic', 'phobos', 'ocsp',
  // Infra / security / cloud
  'digicert', 'fastly', 'cloudflare', 'cloudfront', 'amazonaws', 'azurewebsites',
  // Analytics / tracking / crash
  'sentry', 'mixpanel', 'braze', 'intercom', 'appsflyer',
  'amplitude', 'segment', 'analytics', 'telemetry', 'metrics', 'tracker',
  'firebase', 'datadog', 'googleapis', 'supabase',
  'doubleclick', 'doubleverify', 'crashlytics', 'bugsnag', 'newrelic', 'dynatrace',
  'tagmanager', 'pendo', 'helloid', 'ampproject',
  // LMS / education / SSO portals
  'instructure', 'canvaslms', 'inscloudgate', 'insops',
  // School district patterns
  'k12',
  // CDN / delivery patterns
  'cdn', 'delivery', 'edge', 'static', 'assets', 'media',
  // Dev / tunnel tools
  'ngrok', 'exp.direct', 'localhost',
];

// TikTok CDN domains that should be merged into tiktok.com instead of shown separately.
const TIKTOK_ALIASES = new Set(['tiktokcdn-us.com', 'tiktokv.us']);

function isIgnoredDomain(root) {
  if (!root) return true;
  if (IGNORED_ROOTS.has(root)) return true;
  const lower = root.toLowerCase();
  return IGNORED_SUBSTRINGS.some(sub => lower.includes(sub));
}

function getRootDomain(domain) {
  const parts = (domain || '').split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : domain;
}

function formatMins(mins) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

// Returns true only if the SLD looks like a real brand name, not a CDN/hash identifier.
function looksLikeBrand(sld) {
  if (!sld || sld.length < 2 || sld.length > 22) return false;
  // Too many digits (>25% of chars)
  const digits = (sld.match(/\d/g) || []).length;
  if (digits > Math.ceil(sld.length * 0.25)) return false;
  // Any run of 3+ consecutive digits
  if (/\d{3,}/.test(sld)) return false;
  // Pure hex string of 6+ chars (e.g. cloudfront hash subdomains leaking through)
  if (/^[0-9a-f]{6,}$/i.test(sld)) return false;
  // Looks like a UUID or hash fragment (8+ alphanum, no vowels → likely a token)
  if (sld.length >= 8 && !/[aeiou]/i.test(sld)) return false;
  return true;
}

// Build sorted app list from NextDNS log entries.
// TikTok CDN aliases are merged into tiktok.com before filtering.
// Unknown domains only appear if they pass the looksLikeBrand heuristic.
function buildApps(entries) {
  const counts = {};
  for (const entry of entries) {
    // Remap TikTok CDN domains to canonical tiktok.com before any filtering.
    const root = TIKTOK_ALIASES.has(entry.root) ? 'tiktok.com' : entry.root;
    if (isIgnoredDomain(root)) continue;
    counts[root] = (counts[root] || 0) + 1;
  }
  const apps = Object.entries(counts)
    .map(([root, count]) => {
      const mins = count * 2;
      const mapped = DOMAIN_MAP[root];
      if (mapped) return { name: mapped.name, d: mapped.d, dur: formatMins(mins), m: mins };
      // Unknown domain: only show if the SLD looks like a real brand name.
      const sld = root.split('.')[0];
      if (!looksLikeBrand(sld)) return null;
      return { name: root.replace(/^www\./, ''), d: 'globe', dur: formatMins(mins), m: mins };
    })
    .filter(Boolean)
    .sort((a, b) => b.m - a.m);
  console.log('[buildApps] entries:', entries.length, '| visible domains:', apps.length);
  return apps;
}

// Returns epoch-ms of the most recent log entry, or null if no valid timestamps.
function getLastSeenAt(entries) {
  if (!entries || entries.length === 0) return null;
  let latest = 0;
  for (const entry of entries) {
    if (!entry.timestamp) continue;
    const t = new Date(entry.timestamp).getTime();
    if (t > latest) latest = t;
  }
  return latest > 0 ? latest : null;
}

// Active screen time: group today's entries into 5-min windows, count windows
// with >= 2 entries as active, return total minutes.
function calcScreenTimeToday(entries) {
  if (!entries || entries.length === 0) return null;
  const todayStartMs = new Date().setHours(0, 0, 0, 0);
  const windows = {};
  for (const entry of entries) {
    if (!entry.timestamp) continue;
    const t = new Date(entry.timestamp).getTime();
    if (t < todayStartMs) continue;
    const key = Math.floor(t / (5 * 60 * 1000));
    windows[key] = (windows[key] || 0) + 1;
  }
  const activeWindows = Object.values(windows).filter(c => c >= 2).length;
  return activeWindows * 5;
}

// Fetch logs from NextDNS API for a given profile. Returns null on any failure.
async function fetchNextDNSLogs(profileId, apiKey) {
  if (!profileId || !apiKey) return null;
  try {
    const res = await fetch(
      `https://api.nextdns.io/profiles/${profileId}/logs`,
      { headers: { 'X-Api-Key': apiKey } },
    );
    if (!res.ok) {
      console.log('[fetchNextDNSLogs] HTTP', res.status, 'for profile', profileId);
      return null;
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.log('[fetchNextDNSLogs] error:', err.message);
    return null;
  }
}

// ─── AVATARS ──────────────────────────────────────────────────────────────────
// Dynamic avatars rendered via AvatarCustom — see components/AvatarCustom.js

// ─── ICONS ────────────────────────────────────────────────────────────────────

const HeartIcon = ({ color = P.green, size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 13 13" fill="none">
    <Path
      d="M6.5 11.5C6.5 11.5 1 7.8 1 4.5C1 2.8 2.3 1.5 4 1.5C5 1.5 6 2.2 6.5 3C7 2.2 8 1.5 9 1.5C10.7 1.5 12 2.8 12 4.5C12 7.8 6.5 11.5 6.5 11.5Z"
      fill={color}
    />
  </Svg>
);

const GearIcon = ({ size = 22, color = P.mid }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Rect x="3" y="9" width="14" height="10" rx="3.5" fill={P.green} />
    <Path d="M7 9V6.5C7 4.3 13 4.3 13 6.5V9" stroke={P.green} strokeWidth="2.3" fill="none" strokeLinecap="round" />
    <Circle cx="10" cy="14.5" r="1.8" fill="white" />
  </Svg>
);

const AppIcon = ({ d, s = 32 }) => {
  const icons = {
    instagram: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFE8EE" />
        <Rect x="7" y="7" width="18" height="18" rx="5.5" stroke="#E8849A" strokeWidth="2" fill="none" />
        <Circle cx="16" cy="16" r="4.5" stroke="#E8849A" strokeWidth="2" fill="none" />
        <Circle cx="22" cy="10" r="1.4" fill="#E8849A" />
      </Svg>
    ),
    youtube: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFE8E8" />
        <Rect x="4" y="10" width="24" height="14" rx="4" stroke="#FF8080" strokeWidth="2" fill="none" />
        <Polygon points="13,13 13,21 22,17" fill="#FF8080" />
      </Svg>
    ),
    tiktok: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#F0EEF8" />
        <Path
          d="M21 8C21.5 11 24.5 12.5 26 12.5V15C24 15 22 14 20.5 12.5V21C20.5 24.5 17.8 27 14.5 27C11.2 27 8.5 24.5 8.5 21C8.5 17.5 11.2 15 14.5 15V18.5C13 18.5 12 19.5 12 21C12 22.5 13 23.5 14.5 23.5C16 23.5 17 22.5 17 21V8Z"
          fill="#8B7FD4"
        />
      </Svg>
    ),
    twitter: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F4FF" />
        <Path d="M7 7L14.5 17.5L7 26H10L16 19.5L21.5 26H26L17.5 15L25 7H22L15.5 13.5L10.5 7Z" fill="#5B9BD5" />
      </Svg>
    ),
    safari: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F8F0" />
        <Circle cx="16" cy="16" r="9" stroke="#4CAF82" strokeWidth="2" fill="none" />
        <Path d="M16 7V9M16 23V25M7 16H9M23 16H25" stroke="#4CAF82" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 20L16 16L20 12" stroke="#E85D75" strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="16" cy="16" r="2" fill="#4CAF82" />
      </Svg>
    ),
    discord: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#EEEEFF" />
        <Path
          d="M10 24C10 24 8 10 13 9C15 8.5 16 9 17 10C18 9 19 8.5 21 9C26 10 24 24 24 24C24 24 22 26 18.5 26L17.5 24H14.5L13.5 26C10 26 10 24 10 24Z"
          stroke="#7B84E0" strokeWidth="2" fill="none" strokeLinejoin="round"
        />
        <Circle cx="14" cy="17" r="2.2" fill="#7B84E0" />
        <Circle cx="19" cy="17" r="2.2" fill="#7B84E0" />
      </Svg>
    ),
    reddit: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFF0EA" />
        <Circle cx="16" cy="18.5" r="8" stroke="#FF8C69" strokeWidth="2" fill="none" />
        <Circle cx="13" cy="17.5" r="1.7" fill="#FF8C69" />
        <Circle cx="19" cy="17.5" r="1.7" fill="#FF8C69" />
        <Path d="M13 21.5Q16 24 19 21.5" stroke="#FF8C69" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <Circle cx="16" cy="8" r="2" fill="#FF8C69" />
        <Path d="M16 10V13" stroke="#FF8C69" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M16 9C18 8 21 9 23 10.5" stroke="#FF8C69" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </Svg>
    ),
    spotify: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F7EE" />
        <Circle cx="16" cy="16" r="9" stroke="#4CAF82" strokeWidth="2" fill="none" />
        <Path d="M10 13C13 11.5 19 11.5 22 13" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M11 17C13.5 15.8 18.5 15.8 21 17" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M12.5 21C14.5 20.2 17.5 20.2 19.5 21" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" fill="none" />
      </Svg>
    ),
    chrome: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#F5F0FF" />
        <Circle cx="16" cy="16" r="9" stroke="#8B7FD4" strokeWidth="2" fill="none" />
        <Circle cx="16" cy="16" r="4" fill="#8B7FD4" />
        <Path d="M16 7V12M24 11.5L19.5 14.1M24 20.5L19.5 17.9M16 25V20M8 20.5L12.5 17.9M8 11.5L12.5 14.1"
          stroke="#8B7FD4" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    ),
    github: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#F0EEF8" />
        <Path d="M16 7C11 7 7 11 7 16c0 4 2.6 7.4 6.2 8.6.5.1.7-.2.7-.4v-1.5c-2.5.5-3.1-1.2-3.1-1.2-.4-1.1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.5 0-1 .3-1.8.9-2.4-.1-.2-.4-1.1.1-2.4 0 0 .8-.2 2.5.9.7-.2 1.5-.3 2.2-.3.8 0 1.5.1 2.2.3 1.7-1.1 2.5-.9 2.5-.9.5 1.3.2 2.2.1 2.4.6.7.9 1.5.9 2.4 0 3.5-2.1 4.3-4.1 4.5.3.3.6.8.6 1.7v2.5c0 .2.2.5.7.4C22.4 23.4 25 20 25 16c0-5-4-9-9-9z" fill="#8B7FD4" />
      </Svg>
    ),
    snapchat: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFFDE8" />
        <Path d="M16 7c-3 0-5 2-5 5v1c-.5.1-1.5.4-1.5 1s1 .8 1.5 1.3c-.3.8-1 1.7-2 2 .5.5 2 .5 2.5.8.5.3.5 1 2.5 1s2-.7 2.5-1c.5-.3 2-.3 2.5-.8-1-.3-1.7-1.2-2-2 .5-.5 1.5-.8 1.5-1.3s-1-.9-1.5-1V12c0-3-2-5-5-5z" stroke="#F5C518" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </Svg>
    ),
    social: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFE8EE" />
        <Path d="M8 11h12a2 2 0 012 2v5a2 2 0 01-2 2h-2l-2 3-2-3H8a2 2 0 01-2-2v-5a2 2 0 012-2z" stroke="#E8849A" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <Path d="M11 15h6M11 18h4" stroke="#E8849A" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    ),
    video: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFE8E8" />
        <Rect x="5" y="10" width="16" height="12" rx="3" stroke="#FF8080" strokeWidth="2" fill="none" />
        <Path d="M21 14l6-3v10l-6-3z" stroke="#FF8080" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <Path d="M9 16h6M9 19h3" stroke="#FF8080" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    ),
    music: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F7EE" />
        <Path d="M20 8v11" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" />
        <Path d="M14 11v11" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" />
        <Path d="M14 11l6-3" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" />
        <Circle cx="12" cy="22" r="2.5" stroke="#4CAF82" strokeWidth="2" fill="none" />
        <Circle cx="18" cy="19" r="2.5" stroke="#4CAF82" strokeWidth="2" fill="none" />
      </Svg>
    ),
    gaming: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#EEEEFF" />
        <Rect x="5" y="12" width="22" height="12" rx="5" stroke="#7B84E0" strokeWidth="2" fill="none" />
        <Path d="M11 16v4M9 18h4" stroke="#7B84E0" strokeWidth="2" strokeLinecap="round" />
        <Circle cx="21" cy="16.5" r="1.2" fill="#7B84E0" />
        <Circle cx="23.5" cy="19" r="1.2" fill="#7B84E0" />
      </Svg>
    ),
    shopping: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFF0EA" />
        <Path d="M11 13h10l-1.5 8H12.5z" stroke="#FF8C69" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <Path d="M13 13V11a3 3 0 016 0v2" stroke="#FF8C69" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Circle cx="14" cy="23" r="1" fill="#FF8C69" />
        <Circle cx="19" cy="23" r="1" fill="#FF8C69" />
      </Svg>
    ),
    food: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFF8E8" />
        <Path d="M12 8v5a3 3 0 003 3v7" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M10 8v4M12 8v4M14 8v4" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <Path d="M20 8c0 0 2 1.5 2 5s-2 3.5-2 3.5V24" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" fill="none" />
      </Svg>
    ),
    dating: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#FFF0F3" />
        <Path d="M16 25C16 25 7 19 7 13C7 10 9.5 8 12.5 8C14 8 15.2 8.8 16 10C16.8 8.8 18 8 19.5 8C22.5 8 25 10 25 13C25 19 16 25 16 25Z" fill="#E85D75" opacity="0.85" />
      </Svg>
    ),
    news: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#EEF5FF" />
        <Rect x="7" y="8" width="18" height="16" rx="3" stroke="#5B9BD5" strokeWidth="2" fill="none" />
        <Rect x="10" y="11" width="6" height="5" rx="1.5" stroke="#5B9BD5" strokeWidth="1.5" fill="none" />
        <Path d="M18 12h3M18 15h3M10 19h12M10 22h8" stroke="#5B9BD5" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    ),
    sports: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F7EF" />
        <Path d="M16 8l2 5h5l-4 3 1.5 5-4.5-3-4.5 3L13 16 9 13h5z" stroke="#4CAF82" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      </Svg>
    ),
    tech: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#F0EEF8" />
        <Rect x="6" y="9" width="20" height="12" rx="3" stroke="#8B7FD4" strokeWidth="2" fill="none" />
        <Path d="M12 25h8M16 21v4" stroke="#8B7FD4" strokeWidth="2" strokeLinecap="round" />
        <Path d="M10 13h2M14 13h2" stroke="#8B7FD4" strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    ),
    email: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#EEF5FF" />
        <Rect x="6" y="10" width="20" height="14" rx="3" stroke="#5B9BD5" strokeWidth="2" fill="none" />
        <Path d="M6 13l10 7 10-7" stroke="#5B9BD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    ),
    travel: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F7EF" />
        <Path d="M9 19l4-8 2.5 5 2.5-4 3 7" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M7 24h18" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    ),
    finance: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#E8F7EF" />
        <Circle cx="16" cy="16" r="9" stroke="#4CAF82" strokeWidth="2" fill="none" />
        <Path d="M16 10v12" stroke="#4CAF82" strokeWidth="2" strokeLinecap="round" />
        <Path d="M13 12.5c0-1.4 1.3-2.5 3-2.5s3 .8 3 2s-1.5 2-3 2.5-3 1-3 2.5 1.3 2.5 3 2.5 3-1.1 3-2.5" stroke="#4CAF82" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </Svg>
    ),
    globe: (
      <Svg width={s} height={s} viewBox="0 0 32 32">
        <Rect width="32" height="32" rx="9" fill="#F5F3FF" />
        <Circle cx="16" cy="16" r="9" stroke="#BBBBCC" strokeWidth="2" fill="none" />
        <Ellipse cx="16" cy="16" rx="4.5" ry="9" stroke="#BBBBCC" strokeWidth="1.5" fill="none" />
        <Path d="M7 16h18M8.5 11.5h15M8.5 20.5h15" stroke="#BBBBCC" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    ),
  };
  return icons[d] || icons.globe;
};

// ─── WEEK BARS ────────────────────────────────────────────────────────────────

const WeekBars = ({ data, color, compact = true }) => {
  const max = Math.max(...data) || 1; // guard against all-zero (avoids NaN from 0/0)
  const chartH = compact ? 40 : 70;
  const barW = compact ? 12 : 26;
  const gap = compact ? 5 : 9;
  const totalW = 7 * barW + 6 * gap;
  const svgH = chartH + 18;

  return (
    <Svg width={totalW} height={svgH} viewBox={`0 0 ${totalW} ${svgH}`}>
      {data.map((v, i) => {
        const hasData = v > 0;
        const bh = hasData ? Math.max(4, (v / max) * chartH) : 2; // 2px placeholder for no-data days
        const x = i * (barW + gap);
        const y = chartH - bh;
        const isToday = i === TODAY_IDX;
        const barColor = isToday ? color : '#E5E0F5';
        return (
          <G key={i}>
            <Rect
              x={x} y={y} width={barW} height={bh}
              rx={barW / 2}
              fill={barColor}
              opacity={hasData ? 1 : 0.45}
            />
            <ST
              x={x + barW / 2} y={svgH - 1}
              textAnchor="middle"
              fontSize={compact ? 9 : 11}
              fill={isToday ? color : '#BBBBCC'}
              fontWeight={isToday ? '700' : '400'}
            >
              {DAYS[i]}
            </ST>
          </G>
        );
      })}
    </Svg>
  );
};

// ─── HOME CARD ────────────────────────────────────────────────────────────────

const PersonCard = ({ person, onPress }) => {
  const maxM = person.apps.length > 0 ? Math.max(...person.apps.map(a => a.m)) : 1;
  const nowMs = Date.now();
  const online = person.lastSeenAt != null && (nowMs - person.lastSeenAt) < 5 * 60 * 1000;
  const lastSeenMins = person.lastSeenAt != null ? Math.floor((nowMs - person.lastSeenAt) / 60000) : null;

  return (
    <TouchableOpacity style={[s.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[s.avatarBg, { backgroundColor: person.pale }]}>
        <AvatarCustom config={person.avatarConfig} size={74} />
      </View>
      <View style={s.nameRow}>
        <Text style={s.personName}>{person.name}</Text>
        <HeartIcon color={online ? P.green : '#BBBBCC'} />
      </View>
      {!online && lastSeenMins !== null && (
        <Text style={s.lastSeen}>last seen {lastSeenMins}m ago</Text>
      )}
      <Text style={[s.screenTime, { color: person.color }]}>{person.screenTime}</Text>
      <View style={s.barsWrap}>
        <WeekBars data={person.week} color={person.color} compact />
      </View>
      {person.apps.slice(0, 5).map((app, i) => (
        <View key={i} style={s.appItem}>
          <View style={s.appTop}>
            <View style={s.appLeft}>
              <AppIcon d={app.d} s={20} />
              <Text style={s.appName} numberOfLines={1}>{app.name}</Text>
            </View>
            <Text style={[s.appDur, { color: person.color }]}>{app.dur}</Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFg, { width: `${(app.m / maxM) * 100}%`, backgroundColor: person.color }]} />
          </View>
        </View>
      ))}
    </TouchableOpacity>
  );
};

// ─── HOME VIEW ────────────────────────────────────────────────────────────────

const HomeView = ({ onSelect, onSettings, people }) => (
  <SafeAreaView style={s.root}>
    <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
    <ScrollView contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.logo}>breakup.</Text>
        <View style={s.sharedBadge}>
          <Text style={s.sharedBadgeTxt}>🔥 12 day shared streak</Text>
        </View>
        <TouchableOpacity style={s.gearBtn} onPress={onSettings} activeOpacity={0.7}>
          <GearIcon size={24} />
        </TouchableOpacity>
      </View>
      <View style={s.cardsRow}>
        {people.map(p => (
          <PersonCard key={p.id} person={p} onPress={() => onSelect(p)} />
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// ─── DETAIL SCREEN ────────────────────────────────────────────────────────────

const DetailScreen = ({ person, onBack }) => {
  const [mood, setMood] = useState(null);
  const maxM = Math.max(...person.apps.map(a => a.m));
  const MOODS = ['😊', '😴', '😤', '🥰', '😅'];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
      <ScrollView contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={s.back}>
          <Text style={[s.backTxt, { color: person.color }]}>← Back</Text>
        </TouchableOpacity>

        <View style={s.hero}>
          <View style={[s.heroAvatarBg, { backgroundColor: person.pale }]}>
            <AvatarCustom config={person.avatarConfig} size={112} />
          </View>
          <Text style={s.heroName}>{person.name}</Text>
          <View style={s.streakBadge}>
            <Text style={s.streakBadgeTxt}>🔥 {person.streak} day streak</Text>
          </View>
        </View>

        <View style={s.statRow}>
          {[
            { label: 'Today',     val: person.screenTime },
            { label: '7-day avg', val: person.avgTime },
            { label: 'Longest',   val: person.longestDay },
          ].map((stat, i) => (
            <View key={i} style={[s.statCard, { borderColor: person.color + '55' }]}>
              <Text style={[s.statNum, { color: person.color }]}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>This Week</Text>
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <WeekBars data={person.week} color={person.color} compact={false} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Mood Check-in</Text>
          <View style={s.moodRow}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.moodBtn, mood === m && { backgroundColor: person.color + '22', borderColor: person.color }]}
                onPress={() => setMood(mood === m ? null : m)}
              >
                <Text style={s.moodEmoji}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {mood ? (
            <Text style={[s.moodPicked, { color: person.color }]}>Feeling {mood} today</Text>
          ) : null}
        </View>

        <View style={[s.nthBadge, { borderColor: P.green + '55' }]}>
          <LockIcon size={22} />
          <View style={{ flex: 1 }}>
            <Text style={s.nthTitle}>Nothing to hide</Text>
            <Text style={s.nthSub}>Full transparency enabled</Text>
          </View>
          <Text style={{ fontSize: 18, color: P.green }}>✓</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>App Activity</Text>
          <View style={{ marginTop: 10 }}>
            {person.apps.map((app, i) => (
              <View key={i} style={[s.detailApp, i < person.apps.length - 1 && { marginBottom: 16 }]}>
                <AppIcon d={app.d} s={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={s.detailAppHead}>
                    <Text style={s.detailAppName}>{app.name}</Text>
                    <Text style={[s.detailAppDur, { color: person.color }]}>{app.dur}</Text>
                  </View>
                  <View style={s.barBgLg}>
                    <View style={[s.barFgLg, { width: `${(app.m / maxM) * 100}%`, backgroundColor: person.color }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [people, setPeople] = useState(PEOPLE);
  const credentialsRef = useRef({ my: null, partner: null });

  useFocusEffect(
    useCallback(() => {
      function applyLogs(myLogs, partnerLogs, myName, partnerName, myAvatar, partnerAvatar) {
        setPeople(prev => prev.map(p => {
          if (p.id === 'me') {
            const apps = myLogs ? buildApps(myLogs) : [];
            const screenTimeMins = myLogs ? calcScreenTimeToday(myLogs) : null;
            const lastSeenAt = getLastSeenAt(myLogs);
            const update = { ...p, lastSeenAt };
            if (myName) update.name = myName;
            if (apps.length > 0) update.apps = apps;
            if (screenTimeMins !== null) update.screenTime = formatMins(screenTimeMins);
            if (myAvatar) update.avatarConfig = myAvatar;
            return update;
          }
          if (p.id === 'dylan') {
            const apps = partnerLogs ? buildApps(partnerLogs) : [];
            const screenTimeMins = partnerLogs ? calcScreenTimeToday(partnerLogs) : null;
            const lastSeenAt = getLastSeenAt(partnerLogs);
            const update = { ...p, lastSeenAt };
            if (partnerName) update.name = partnerName;
            if (apps.length > 0) update.apps = apps;
            if (screenTimeMins !== null) update.screenTime = formatMins(screenTimeMins);
            if (partnerAvatar) update.avatarConfig = partnerAvatar;
            return update;
          }
          return p;
        }));
      }

      async function loadRealData() {
        console.log('[HomeScreen] useFocusEffect fired — loading per-user data');

        // Step 1: read only the logged-in user's Supabase ID from AsyncStorage.
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) { console.log('[HomeScreen] no userId — using mock'); return; }

        // Step 2: fetch the logged-in user's own row, including partner_id.
        const avatarSelect = 'name, partner_id, nextdns_profile_id, nextdns_api_key, hair_style, hair_color, skin_tone, eye_style, mouth_style, accessory';
        const { data: myRow, error: myErr } = await supabase
          .from('users')
          .select(avatarSelect)
          .eq('id', userId)
          .single();
        if (myErr) console.log('[HomeScreen] my row error:', myErr.message);

        // Step 3: use partner_id from the user's own Supabase row (not AsyncStorage).
        const partnerId = myRow?.partner_id ?? null;
        const { data: partnerRow, error: partnerErr } = partnerId
          ? await supabase.from('users').select(avatarSelect).eq('id', partnerId).single()
          : { data: null, error: null };
        if (partnerErr) console.log('[HomeScreen] partner row error:', partnerErr.message);

        credentialsRef.current = {
          my: myRow ? { profileId: myRow.nextdns_profile_id, apiKey: myRow.nextdns_api_key } : null,
          partner: partnerRow ? { profileId: partnerRow.nextdns_profile_id, apiKey: partnerRow.nextdns_api_key } : null,
        };

        // Load my avatar from AsyncStorage (reflects edits made in Avatar Builder immediately)
        const [[, hs], [, hc], [, st], [, es], [, ms], [, ac]] = await AsyncStorage.multiGet([
          'avatarHairStyle', 'avatarHairColor', 'avatarSkinTone',
          'avatarEyeStyle', 'avatarMouthStyle', 'avatarAccessory',
        ]);
        const myAvatar = {
          hairStyle:  hs || myRow?.hair_style  || AVATAR_DEFAULTS.hairStyle,
          hairColor:  hc || myRow?.hair_color  || '#E85D75',
          skinTone:   st || myRow?.skin_tone   || '#FFD0DC',
          eyeStyle:   es || myRow?.eye_style   || AVATAR_DEFAULTS.eyeStyle,
          mouthStyle: ms || myRow?.mouth_style || AVATAR_DEFAULTS.mouthStyle,
          accessory:  ac || myRow?.accessory   || AVATAR_DEFAULTS.accessory,
        };
        const partnerAvatar = partnerRow ? {
          hairStyle:  partnerRow.hair_style  || AVATAR_DEFAULTS.hairStyle,
          hairColor:  partnerRow.hair_color  || '#1A4A6A',
          skinTone:   partnerRow.skin_tone   || '#D4EEFA',
          eyeStyle:   partnerRow.eye_style   || AVATAR_DEFAULTS.eyeStyle,
          mouthStyle: partnerRow.mouth_style || AVATAR_DEFAULTS.mouthStyle,
          accessory:  partnerRow.accessory   || AVATAR_DEFAULTS.accessory,
        } : null;

        // Log each card's profile ID before fetching — if they are the same, the Supabase fetch is wrong.
        console.log('[HomeScreen] ME card     — NextDNS profileId:', myRow?.nextdns_profile_id ?? 'MISSING');
        console.log('[HomeScreen] PARTNER card — NextDNS profileId:', partnerRow?.nextdns_profile_id ?? 'MISSING');
        if (
          myRow?.nextdns_profile_id != null &&
          myRow?.nextdns_profile_id === partnerRow?.nextdns_profile_id
        ) {
          console.log('[HomeScreen] WARNING: both profile IDs are identical — Supabase fetch is returning the same row for both users!');
        }

        // Step 4: make two completely separate NextDNS API calls using each person's own credentials.
        // Left card = logged-in user (me). Right card = partner.
        const myLogs      = await fetchNextDNSLogs(myRow?.nextdns_profile_id, myRow?.nextdns_api_key);
        const partnerLogs = await fetchNextDNSLogs(partnerRow?.nextdns_profile_id, partnerRow?.nextdns_api_key);

        console.log('[HomeScreen] ME logs:', myLogs?.length ?? 'null', '| PARTNER logs:', partnerLogs?.length ?? 'null');
        applyLogs(myLogs, partnerLogs, myRow?.name, partnerRow?.name, myAvatar, partnerAvatar);
      }

      loadRealData().catch(err => console.log('[HomeScreen] error:', err.message));

      const interval = setInterval(async () => {
        const { my, partner } = credentialsRef.current;
        if (!my?.profileId) return;
        const [myLogs, partnerLogs] = await Promise.all([
          fetchNextDNSLogs(my.profileId, my.apiKey),
          fetchNextDNSLogs(partner?.profileId, partner?.apiKey),
        ]);
        applyLogs(myLogs, partnerLogs, null, null);
      }, 60000);

      return () => clearInterval(interval);
    }, [])
  );

  if (selected) return <DetailScreen person={selected} onBack={() => setSelected(null)} />;
  return <HomeView onSelect={setSelected} onSettings={() => router.push('/settings')} people={people} />;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  scrollPad: { paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 18, paddingHorizontal: 20, position: 'relative' },
  gearBtn: { position: 'absolute', top: 12, right: 18, padding: 6 },
  logo: { fontSize: 46, fontWeight: '900', fontStyle: 'italic', color: P.red, fontFamily: SERIF },
  tagline: { fontSize: 14, color: P.mid, marginTop: 2 },
  sharedBadge: {
    marginTop: 12,
    backgroundColor: P.amberPale,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
  },
  sharedBadgeTxt: { color: '#B45309', fontWeight: '700', fontSize: 13 },

  cardsRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8 },
  card: {
    backgroundColor: P.white,
    borderRadius: 22,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarBg: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 1,
  },
  personName: { fontSize: 15, fontWeight: '700', color: P.dark },
  lastSeen: { fontSize: 9.5, color: P.mid, textAlign: 'center', marginTop: -2, marginBottom: 3 },
  screenTime: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: SERIF,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  barsWrap: { alignItems: 'center', marginBottom: 10 },

  appItem: { marginBottom: 7 },
  appTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  appLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  appName: { fontSize: 10.5, fontWeight: '600', color: P.dark, flex: 1 },
  appDur: { fontSize: 10, fontWeight: '700' },
  barBg: { height: 3, backgroundColor: '#EEECF8', borderRadius: 2, overflow: 'hidden' },
  barFg: { height: '100%', borderRadius: 2 },

  back: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  backTxt: { fontSize: 17, fontWeight: '600' },

  hero: { alignItems: 'center', paddingBottom: 16 },
  heroAvatarBg: {
    width: 168, height: 168, borderRadius: 84,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { fontSize: 30, fontWeight: '800', color: P.dark, marginTop: 14 },
  streakBadge: {
    marginTop: 8, backgroundColor: P.amberPale,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
  },
  streakBadgeTxt: { color: '#B45309', fontWeight: '700', fontSize: 13 },

  statRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: P.white, borderRadius: 16,
    padding: 12, alignItems: 'center', borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statNum: { fontSize: 14, fontWeight: '800', fontFamily: SERIF },
  statLabel: { fontSize: 11, color: P.mid, marginTop: 2 },

  section: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: P.white,
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: P.dark },

  moodRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  moodBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F3FF', borderWidth: 2, borderColor: 'transparent',
  },
  moodEmoji: { fontSize: 22 },
  moodPicked: { textAlign: 'center', marginTop: 10, fontWeight: '600', fontSize: 13 },

  nthBadge: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: P.greenPale,
    borderRadius: 16, padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 10, borderWidth: 1.5,
  },
  nthTitle: { fontSize: 14, fontWeight: '700', color: P.green },
  nthSub: { fontSize: 11, color: P.green, opacity: 0.7, marginTop: 2 },

  detailApp: { flexDirection: 'row', alignItems: 'center' },
  detailAppHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  detailAppName: { fontSize: 15, fontWeight: '600', color: P.dark },
  detailAppDur: { fontSize: 14, fontWeight: '700' },
  barBgLg: { height: 6, backgroundColor: '#EEECF8', borderRadius: 3, overflow: 'hidden' },
  barFgLg: { height: '100%', borderRadius: 3 },
});
