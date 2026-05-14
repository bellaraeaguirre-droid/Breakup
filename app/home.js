import React, { useState, useCallback } from 'react';
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

const TODAY = 0;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const PEOPLE = [
  {
    id: 'me',
    name: 'You',
    color: P.red,
    pale: P.redPale,
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

// Domains that are infrastructure noise — never shown as apps.
const IGNORED_ROOTS = new Set(['apple-dns.net', 'exp.direct']);

function getRootDomain(domain) {
  const parts = (domain || '').split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : domain;
}

function formatMins(mins) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

// Build sorted app list from NextDNS log entries.
// Every root domain appears — known ones get a mapped name+icon, unknown ones show raw domain with globe icon.
function buildApps(entries) {
  const counts = {};
  for (const entry of entries) {
    const root = entry.root;
    if (!root || IGNORED_ROOTS.has(root)) continue;
    counts[root] = (counts[root] || 0) + 1;
  }
  const apps = Object.entries(counts)
    .map(([root, count]) => {
      const mins = count * 2;
      const mapped = DOMAIN_MAP[root];
      return mapped
        ? { name: mapped.name, d: mapped.d, dur: formatMins(mins), m: mins }
        : { name: root.replace(/^www\./, ''), d: 'globe', dur: formatMins(mins), m: mins };
    })
    .sort((a, b) => b.m - a.m);
  console.log('[buildApps] entries:', entries.length, '| total domains:', apps.length);
  return apps;
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

const AvatarMe = ({ large = false }) => {
  const [w, h] = large ? [112, 138] : [74, 90];
  return (
    <Svg width={w} height={h} viewBox="0 0 100 124" fill="none">
      <Ellipse cx="50" cy="110" rx="28" ry="14" fill="#FFB8C8" />
      <Circle cx="50" cy="56" r="37" fill="#FFD0DC" />
      <Circle cx="50" cy="20" r="18" fill="#E85D75" />
      <Ellipse cx="50" cy="36" rx="25" ry="11" fill="#E85D75" />
      <Ellipse cx="24" cy="45" rx="9" ry="16" fill="#E85D75" />
      <Ellipse cx="76" cy="45" rx="9" ry="16" fill="#E85D75" />
      <Circle cx="30" cy="64" r="8" fill="#FFB8C8" opacity="0.65" />
      <Circle cx="70" cy="64" r="8" fill="#FFB8C8" opacity="0.65" />
      <Circle cx="41" cy="54" r="5" fill="#1C1C1E" />
      <Circle cx="59" cy="54" r="5" fill="#1C1C1E" />
      <Circle cx="43" cy="52" r="1.8" fill="white" />
      <Circle cx="61" cy="52" r="1.8" fill="white" />
      <Path d="M41 68 Q50 76 59 68" stroke="#1C1C1E" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
};

const AvatarDylan = ({ large = false }) => {
  const [w, h] = large ? [112, 138] : [74, 90];
  return (
    <Svg width={w} height={h} viewBox="0 0 100 124" fill="none">
      <Ellipse cx="50" cy="110" rx="28" ry="14" fill="#A8D8F0" />
      <Circle cx="50" cy="56" r="37" fill="#D4EEFA" />
      <Ellipse cx="50" cy="25" rx="30" ry="16" fill="#1A4A6A" />
      <Rect x="22" y="32" width="56" height="12" fill="#1A4A6A" />
      <Ellipse cx="19" cy="45" rx="9" ry="19" fill="#1A4A6A" />
      <Ellipse cx="81" cy="45" rx="9" ry="19" fill="#1A4A6A" />
      <Circle cx="30" cy="64" r="7" fill="#A8D8F0" opacity="0.75" />
      <Circle cx="70" cy="64" r="7" fill="#A8D8F0" opacity="0.75" />
      <Circle cx="41" cy="54" r="4.5" fill="#1C1C1E" />
      <Circle cx="59" cy="54" r="4.5" fill="#1C1C1E" />
      <Circle cx="42.5" cy="52.5" r="1.6" fill="white" />
      <Circle cx="60.5" cy="52.5" r="1.6" fill="white" />
      <Path d="M41 68 Q50 75 59 68" stroke="#1C1C1E" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
};

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
  const max = Math.max(...data);
  const chartH = compact ? 40 : 70;
  const barW = compact ? 12 : 26;
  const gap = compact ? 5 : 9;
  const totalW = 7 * barW + 6 * gap;
  const svgH = chartH + 18;

  return (
    <Svg width={totalW} height={svgH} viewBox={`0 0 ${totalW} ${svgH}`}>
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * chartH);
        const x = i * (barW + gap);
        const y = chartH - bh;
        const isToday = i === TODAY;
        return (
          <G key={i}>
            <Rect
              x={x} y={y} width={barW} height={bh}
              rx={barW / 2}
              fill={isToday ? color : '#E5E0F5'}
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
  const Char = person.id === 'me' ? AvatarMe : AvatarDylan;
  const maxM = Math.max(...person.apps.map(a => a.m));

  return (
    <TouchableOpacity style={[s.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[s.avatarBg, { backgroundColor: person.pale }]}>
        <Char large={false} />
      </View>
      <View style={s.nameRow}>
        <Text style={s.personName}>{person.name}</Text>
        <HeartIcon />
      </View>
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
  const Char = person.id === 'me' ? AvatarMe : AvatarDylan;
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
            <Char large />
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

  // Runs on mount AND every time the screen regains focus (e.g. back from settings).
  useFocusEffect(
    useCallback(() => {
      async function loadRealData() {
        console.log('[HomeScreen] useFocusEffect fired — loading per-user data');
        const [[, userId], [, partnerId]] = await AsyncStorage.multiGet(['userId', 'partnerId']);
        if (!userId) { console.log('[HomeScreen] no userId — using mock'); return; }

        const [{ data: myRow, error: myErr }, { data: partnerRow, error: partnerErr }] = await Promise.all([
          supabase.from('users').select('name, nextdns_profile_id, nextdns_api_key').eq('id', userId).single(),
          partnerId
            ? supabase.from('users').select('name, nextdns_profile_id, nextdns_api_key').eq('id', partnerId).single()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (myErr) console.log('[HomeScreen] my row error:', myErr.message);
        if (partnerErr) console.log('[HomeScreen] partner row error:', partnerErr.message);
        console.log('[HomeScreen] my profileId:', myRow?.nextdns_profile_id, '| partner profileId:', partnerRow?.nextdns_profile_id);

        const [myLogs, partnerLogs] = await Promise.all([
          fetchNextDNSLogs(myRow?.nextdns_profile_id, myRow?.nextdns_api_key),
          fetchNextDNSLogs(partnerRow?.nextdns_profile_id, partnerRow?.nextdns_api_key),
        ]);
        console.log('[HomeScreen] my logs:', myLogs?.length ?? 'null', '| partner logs:', partnerLogs?.length ?? 'null');

        setPeople(prev => prev.map(p => {
          if (p.id === 'me') {
            const apps = myLogs ? buildApps(myLogs) : [];
            console.log('[HomeScreen] YOU — real apps:', apps.length);
            const update = { ...p };
            if (myRow?.name) update.name = myRow.name;
            if (apps.length > 0) update.apps = apps;
            return update;
          }
          if (p.id === 'dylan') {
            const apps = partnerLogs ? buildApps(partnerLogs) : [];
            console.log('[HomeScreen] PARTNER — real apps:', apps.length);
            const update = { ...p };
            if (partnerRow?.name) update.name = partnerRow.name;
            if (apps.length > 0) update.apps = apps;
            return update;
          }
          return p;
        }));
      }
      loadRealData().catch(err => console.log('[HomeScreen] error:', err.message));
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
