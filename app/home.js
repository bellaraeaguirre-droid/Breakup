import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { buildApps, getLastSeenAt, calcScreenTimeToday, formatMins } from '../lib/domainFilter';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Platform, Modal, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path, Circle, Ellipse, Rect, Polygon, G, Text as ST,
} from 'react-native-svg';
import AvatarCustom, { AVATAR_DEFAULTS } from '../components/AvatarCustom';

const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;
const CARD_W  = Math.floor((W - 36) / 2);
const SHEET_H = Math.round(H * 0.70);
const SERIF   = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

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

const CrownIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 19h20M3 19l2-9 4.5 5L12 5l2.5 10L19 10l2 9"
      stroke="#FFB800" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const SmallLockIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2.5"
      stroke={P.dark} strokeWidth="2" fill="none" />
    <Path d="M7 11V7a5 5 0 0110 0v4"
      stroke={P.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

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

const FREE_VISIBLE = 3; // app rows shown unblurred for free users

// Small inline icon + label shown below the domain name.
const ViaIcon = ({ type }) => {
  if (type === 'browser') {
    return (
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="#BBBBCC" strokeWidth="1" fill="none" />
        <Path d="M0.5 3h9" stroke="#BBBBCC" strokeWidth="0.8" />
        <Circle cx="2" cy="1.8" r="0.6" fill="#BBBBCC" />
        <Circle cx="3.5" cy="1.8" r="0.6" fill="#BBBBCC" />
      </Svg>
    );
  }
  if (type === 'app') {
    return (
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Rect x="2.5" y="0.5" width="5" height="9" rx="1.5" stroke="#BBBBCC" strokeWidth="1" fill="none" />
        <Circle cx="5" cy="8" r="0.65" fill="#BBBBCC" />
        <Path d="M3.8 0.5h2.4" stroke="#BBBBCC" strokeWidth="0.8" strokeLinecap="round" />
      </Svg>
    );
  }
  return null;
};

const AppRow = ({ app, maxM, color }) => (
  <View style={s.appItem}>
    <View style={s.appTop}>
      <View style={s.appLeft}>
        <AppIcon d={app.d} s={20} />
        <View style={s.appNameCol}>
          <Text style={s.appName} numberOfLines={1}>{app.name}</Text>
          {app.via != null && (
            <View style={s.viaRow}>
              <ViaIcon type={app.via} />
              <Text style={s.viaTxt}>{app.via === 'browser' ? 'Browser' : 'App'}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[s.appDur, { color }]}>{app.dur}</Text>
    </View>
    <View style={s.barBg}>
      <View style={[s.barFg, { width: `${(app.m / maxM) * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const PersonCard = ({ person, onPress, isPaid, onUpgrade }) => {
  const maxM = person.apps.length > 0 ? Math.max(...person.apps.map(a => a.m)) : 1;
  const nowMs = Date.now();
  const online = person.lastSeenAt != null && (nowMs - person.lastSeenAt) < 5 * 60 * 1000;
  const lastSeenMins = person.lastSeenAt != null ? Math.floor((nowMs - person.lastSeenAt) / 60000) : null;

  const apps = person.apps.slice(0, 5);
  const visibleApps = isPaid ? apps : apps.slice(0, FREE_VISIBLE);
  const hiddenApps  = isPaid ? []   : apps.slice(FREE_VISIBLE);
  const showBlur    = !isPaid && hiddenApps.length > 0;

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

      {/* Always-visible items */}
      {visibleApps.map((app, i) => (
        <AppRow key={i} app={app} maxM={maxM} color={person.color} />
      ))}

      {/* Frosted blur section for free users */}
      {showBlur && (
        <View style={s.blurWrap}>
          {/* Faded items rendered behind the overlay */}
          {hiddenApps.map((app, i) => (
            <View key={i} style={{ opacity: 0.12 }}>
              <AppRow app={app} maxM={maxM} color={person.color} />
            </View>
          ))}

          {/* Gradient overlay — transparent → opaque white */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0)' }} />
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.62)' }} />
            <View style={{ flex: 2, backgroundColor: 'rgba(255,255,255,0.94)' }} />
          </View>

          {/* Lock UI pinned to bottom of the blur zone */}
          <View style={s.lockUI}>
            <SmallLockIcon />
            <Text style={s.lockTxt}>Upgrade to see full history</Text>
            <TouchableOpacity style={s.lockBtn} onPress={onUpgrade} activeOpacity={0.85}>
              <Text style={s.lockBtnTxt}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── HOME VIEW ────────────────────────────────────────────────────────────────

const HomeView = ({ onSelect, onSettings, onUpgrade, people, isPaid }) => (
  <SafeAreaView style={s.root}>
    <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
    <ScrollView contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.logo}>breakup.</Text>
        <View style={s.sharedBadge}>
          <Text style={s.sharedBadgeTxt}>🔥 12 day shared streak</Text>
        </View>
        <TouchableOpacity style={s.crownBtn} onPress={onUpgrade} activeOpacity={0.7}>
          <CrownIcon size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={s.gearBtn} onPress={onSettings} activeOpacity={0.7}>
          <GearIcon size={24} />
        </TouchableOpacity>
      </View>
      <View style={s.cardsRow}>
        {people.map(p => (
          <PersonCard key={p.id} person={p} onPress={() => onSelect(p)} isPaid={isPaid} onUpgrade={onUpgrade} />
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// ─── PAYWALL MODAL ────────────────────────────────────────────────────────────

const PAYWALL_FEATURES = [
  { icon: '🔍', title: 'Full browsing history',     sub: 'including every site visited' },
  { icon: '🌙', title: 'Late night alerts',          sub: "when they're secretly scrolling" },
  { icon: '🕵️', title: 'Private browsing history',  sub: 'yes even incognito' },
];

const PaywallModal = ({ visible, onDismiss }) => {
  const slideY    = useRef(new Animated.Value(SHEET_H)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slideY.setValue(SHEET_H);
    bgOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(slideY,    { toValue: 0, useNativeDriver: true, friction: 9, tension: 65 }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideY,    { toValue: SHEET_H, duration: 260, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0,       duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }

  function handleSubscribe() {
    Alert.alert('Coming Soon', 'Subscriptions are coming soon! 🎉');
  }

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <View style={pw.root}>
        {/* Dark backdrop — pointer-transparent so touches fall through to the dismiss zone */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.60)', opacity: bgOpacity }]}
        />
        {/* Tapping above the sheet dismisses it */}
        <TouchableOpacity style={{ flex: 1 }} onPress={dismiss} activeOpacity={1} />
        {/* Sheet */}
        <Animated.View style={[pw.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={pw.pullTab} />
          <TouchableOpacity
            style={pw.closeBtn}
            onPress={dismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={pw.closeTxt}>✕</Text>
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={pw.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={pw.headline}>You're missing{'\n'}the good stuff 👀</Text>
            <Text style={pw.subhead}>Your partner has 14 websites{'\n'}you can't see yet.</Text>
            {PAYWALL_FEATURES.map(({ icon, title, sub }) => (
              <View key={title} style={pw.featureRow}>
                <View style={pw.featureIcon}>
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={pw.featureTitle}>{title}</Text>
                  <Text style={pw.featureSub}>{sub}</Text>
                </View>
              </View>
            ))}
            <Text style={pw.social}>Join 2,400 couples who hide nothing</Text>
            <TouchableOpacity style={pw.cta} onPress={handleSubscribe} activeOpacity={0.85}>
              <Text style={pw.ctaTxt}>See Everything — $3.99/month</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.7} style={pw.trialBtn}>
              <Text style={pw.trialTxt}>Start 7-day free trial</Text>
            </TouchableOpacity>
            <Text style={pw.disclaimer}>Cancel anytime, no questions asked</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const pw = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    height: SHEET_H,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  pullTab: {
    width: 36, height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, zIndex: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E5E5EA',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 12, color: '#8E8E93', fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 },
  headline: {
    fontSize: 28, fontWeight: '900', fontStyle: 'italic',
    color: P.red, fontFamily: SERIF,
    lineHeight: 34, marginBottom: 10,
  },
  subhead: {
    fontSize: 14, color: P.mid, fontWeight: '500',
    lineHeight: 21, marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 14,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: P.redPale,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: P.dark, marginBottom: 2 },
  featureSub:   { fontSize: 12, color: P.mid },
  social: {
    textAlign: 'center', fontSize: 13, color: P.mid,
    fontWeight: '600', marginTop: 8, marginBottom: 20,
  },
  cta: {
    backgroundColor: P.red, borderRadius: 999,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: P.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32, shadowRadius: 10, elevation: 5,
  },
  ctaTxt:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  trialBtn:  { marginTop: 14, alignItems: 'center' },
  trialTxt:  { fontSize: 14, color: P.red, fontWeight: '600', textDecorationLine: 'underline' },
  disclaimer:{ textAlign: 'center', fontSize: 11, color: P.mid, marginTop: 14 },
});

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
                    <View>
                      <Text style={s.detailAppName}>{app.name}</Text>
                      {app.via != null && (
                        <View style={s.viaRow}>
                          <ViaIcon type={app.via} />
                          <Text style={s.viaTxt}>{app.via === 'browser' ? 'Browser' : 'App'}</Text>
                        </View>
                      )}
                    </View>
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
  const [selected, setSelected]       = useState(null);
  const [people, setPeople]           = useState(PEOPLE);
  const [isPaid, setIsPaid]           = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const credentialsRef      = useRef({ my: null, partner: null });
  const myUserIdRef         = useRef(null);
  const partnerUserIdRef    = useRef(null);

  // Show paywall 30 s after mount, at most once per 24 h, never during onboarding.
  useEffect(() => {
    let timer;
    (async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;                                    // not yet logged in
        const last = await AsyncStorage.getItem('paywallLastShown');
        if (last && Date.now() - Number(last) < 24 * 60 * 60 * 1000) return;
        timer = setTimeout(() => setShowPaywall(true), 30_000);
      } catch {}
    })();
    return () => clearTimeout(timer);
  }, []);

  // Read subscription tier from AsyncStorage — no Supabase call.
  useEffect(() => {
    AsyncStorage.getItem('subscriptionTier')
      .then(tier => setIsPaid(!!tier && tier !== 'free'))
      .catch(() => {});
  }, []);

  async function handleDismissPaywall() {
    setShowPaywall(false);
    try { await AsyncStorage.setItem('paywallLastShown', String(Date.now())); } catch {}
  }

  useFocusEffect(
    useCallback(() => {
      // Refresh-only: update logs/screenTime in place using real Supabase UUIDs, never hardcoded strings.
      function applyLogs(myLogs, partnerLogs) {
        const myId = myUserIdRef.current;
        const pid  = partnerUserIdRef.current;
        setPeople(prev => prev.map(p => {
          const isMe      = myId && p.id === myId;
          const isPartner = pid  && p.id === pid;
          if (!isMe && !isPartner) return p;
          const logs           = isMe ? myLogs : partnerLogs;
          const screenTimeMins = logs ? calcScreenTimeToday(logs) : null;
          const update = { ...p, lastSeenAt: logs ? getLastSeenAt(logs) : p.lastSeenAt };
          if (logs !== null) {
            update.apps       = buildApps(logs);
            update.screenTime = screenTimeMins !== null ? formatMins(screenTimeMins) : '0m';
          }
          return update;
        }));
      }

      async function loadRealData() {
        console.log('[HomeScreen] useFocusEffect fired — loading per-user data');

        // Step 1: read only the logged-in user's ID from AsyncStorage.
        let userId;
        try { userId = await AsyncStorage.getItem('userId'); } catch (err) {
          console.log('[HomeScreen] AsyncStorage error:', err.message); return;
        }
        if (!userId) { console.log('[HomeScreen] no userId — using mock'); return; }

        // Step 2: fetch the logged-in user's own row, including partner_id.
        // On any failure keep myRow null and continue — last rendered data stays visible.
        const avatarSelect = 'name, partner_id, nextdns_profile_id, nextdns_api_key, hair_style, hair_color, skin_tone, eye_style, mouth_style, accessory';
        let myRow = null;
        try {
          const { data, error } = await supabase
            .from('users').select(avatarSelect).eq('id', userId).single();
          if (error) console.log('[HomeScreen] my row error:', error.message);
          else myRow = data;
        } catch (err) {
          console.log('[HomeScreen] my row fetch threw:', err.message);
        }

        // Step 3: fetch partner row using partner_id from Supabase — never from AsyncStorage.
        const partnerId = myRow?.partner_id ?? null;
        let partnerRow = null;
        if (partnerId) {
          try {
            const { data, error } = await supabase
              .from('users').select(avatarSelect).eq('id', partnerId).single();
            if (error) console.log('[HomeScreen] partner row error:', error.message);
            else partnerRow = data;
          } catch (err) {
            console.log('[HomeScreen] partner row fetch threw:', err.message);
          }
        }

        credentialsRef.current = {
          my: myRow ? { profileId: myRow.nextdns_profile_id, apiKey: myRow.nextdns_api_key } : null,
          partner: partnerRow ? { profileId: partnerRow.nextdns_profile_id, apiKey: partnerRow.nextdns_api_key } : null,
        };
        myUserIdRef.current      = userId;
        partnerUserIdRef.current = partnerId;

        // Load avatar from AsyncStorage — reflects Avatar Builder edits immediately.
        let hs, hc, st, es, ms, ac;
        try {
          const [[, _hs], [, _hc], [, _st], [, _es], [, _ms], [, _ac]] = await AsyncStorage.multiGet([
            'avatarHairStyle', 'avatarHairColor', 'avatarSkinTone',
            'avatarEyeStyle', 'avatarMouthStyle', 'avatarAccessory',
          ]);
          hs = _hs; hc = _hc; st = _st; es = _es; ms = _ms; ac = _ac;
        } catch (err) {
          console.log('[HomeScreen] avatar AsyncStorage error:', err.message);
        }

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

        console.log('[HomeScreen] ME card     — NextDNS profileId:', myRow?.nextdns_profile_id ?? 'MISSING');
        console.log('[HomeScreen] PARTNER card — NextDNS profileId:', partnerRow?.nextdns_profile_id ?? 'MISSING');
        if (myRow?.nextdns_profile_id != null && myRow?.nextdns_profile_id === partnerRow?.nextdns_profile_id) {
          console.log('[HomeScreen] WARNING: both profile IDs are identical — Supabase fetch is returning the same row for both users!');
        }

        // Step 4: separate NextDNS API calls — fetchNextDNSLogs already returns null on failure.
        const myLogs      = await fetchNextDNSLogs(myRow?.nextdns_profile_id, myRow?.nextdns_api_key);
        const partnerLogs = await fetchNextDNSLogs(partnerRow?.nextdns_profile_id, partnerRow?.nextdns_api_key);
        console.log('[HomeScreen] ME logs:', myLogs?.length ?? 'null', '| PARTNER logs:', partnerLogs?.length ?? 'null');

        const myApps      = myLogs      ? buildApps(myLogs)      : [];
        const partnerApps = partnerLogs ? buildApps(partnerLogs) : [];
        const myScreenTimeMins      = myLogs      ? calcScreenTimeToday(myLogs)      : null;
        const partnerScreenTimeMins = partnerLogs ? calcScreenTimeToday(partnerLogs) : null;

        // Build both cards from scratch. Left = logged-in user (UUID-keyed). Right = partner.
        setPeople([
          {
            id:           userId,
            name:         myRow?.name || 'You',
            color:        P.red,
            pale:         P.redPale,
            lastSeenAt:   getLastSeenAt(myLogs),
            avatarConfig: myAvatar,
            screenTime:   myLogs !== null ? (myScreenTimeMins !== null ? formatMins(myScreenTimeMins) : '0m') : '—',
            streak:       12,
            avgTime:      '3h 45m',
            longestDay:   '5h 30m',
            week:         [252, 210, 290, 180, 320, 180, 145],
            apps:         myApps,
          },
          {
            id:           partnerId || 'partner',
            name:         partnerRow?.name || 'Partner',
            color:        P.blue,
            pale:         P.bluePale,
            lastSeenAt:   getLastSeenAt(partnerLogs),
            avatarConfig: partnerAvatar || { ...AVATAR_DEFAULTS, hairStyle: 'short', hairColor: '#1A4A6A', skinTone: '#D4EEFA' },
            screenTime:   partnerLogs !== null ? (partnerScreenTimeMins !== null ? formatMins(partnerScreenTimeMins) : '0m') : '—',
            streak:       12,
            avgTime:      '3h 20m',
            longestDay:   '4h 55m',
            week:         [227, 195, 240, 260, 185, 220, 310],
            apps:         partnerApps,
          },
        ]);
      }

      loadRealData().catch(err => console.log('[HomeScreen] loadRealData unhandled:', err.message));

      const interval = setInterval(async () => {
        try {
          const { my, partner } = credentialsRef.current;
          if (!my?.profileId) return;
          const [myLogs, partnerLogs] = await Promise.all([
            fetchNextDNSLogs(my.profileId, my.apiKey),
            fetchNextDNSLogs(partner?.profileId, partner?.apiKey),
          ]);
          applyLogs(myLogs, partnerLogs);
        } catch (err) {
          console.log('[HomeScreen] interval refresh error:', err.message);
        }
      }, 60000);

      return () => clearInterval(interval);
    }, [])
  );

  if (selected) return <DetailScreen person={selected} onBack={() => setSelected(null)} />;
  return (
    <>
      <HomeView
        onSelect={setSelected}
        onSettings={() => router.push('/settings')}
        onUpgrade={() => router.push('/upgrade')}
        people={people}
        isPaid={isPaid}
      />
      <PaywallModal visible={showPaywall} onDismiss={handleDismissPaywall} />
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  scrollPad: { paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 18, paddingHorizontal: 20, position: 'relative' },
  crownBtn: { position: 'absolute', top: 12, right: 56, padding: 6 },
  gearBtn:  { position: 'absolute', top: 12, right: 18, padding: 6 },
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
  appLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, flex: 1 },
  appNameCol: { flex: 1 },
  appName: { fontSize: 10.5, fontWeight: '600', color: P.dark },
  viaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  viaTxt: { fontSize: 9, color: '#BBBBCC', fontWeight: '500' },
  appDur: { fontSize: 10, fontWeight: '700' },
  barBg: { height: 3, backgroundColor: '#EEECF8', borderRadius: 2, overflow: 'hidden' },
  barFg: { height: '100%', borderRadius: 2 },

  // Blur / paywall overlay on card feed
  blurWrap: {
    overflow: 'hidden',
    minHeight: 92,
  },
  lockUI: {
    position: 'absolute',
    bottom: 6, left: 0, right: 0,
    alignItems: 'center',
  },
  lockTxt: {
    fontSize: 10.5, fontWeight: '600', color: P.dark,
    marginTop: 5, marginBottom: 7, textAlign: 'center',
  },
  lockBtn: {
    backgroundColor: P.red, borderRadius: 999,
    paddingVertical: 5, paddingHorizontal: 14,
    shadowColor: P.red, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 6, elevation: 3,
  },
  lockBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },

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
