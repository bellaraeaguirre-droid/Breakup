import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect, G } from 'react-native-svg';

export const AVATAR_DEFAULTS = {
  hairStyle:  'bun',
  hairColor:  '#E85D75',
  skinTone:   '#FFD0DC',
  eyeStyle:   'normal',
  mouthStyle: 'smile',
  accessory:  'none',
};

// ─── HAIR ────────────────────────────────────────────────────────────────────
// ViewBox: 100×124. Head circle: center (50,60) radius 28.
// Hair is drawn after the head so it overlaps the top.
// Eyes/mouth are drawn after hair so they stay visible.

function HairLayer({ style, color }) {
  // Ellipse cap covers top of head — Ellipse cx=50 cy=46 rx=28 ry=16
  // spans y=30–62, which is the upper portion of the head.
  const cap = <Ellipse cx="50" cy="46" rx="28" ry="16" fill={color} />;

  switch (style) {
    case 'bun':
      return (
        <G>
          {cap}
          <Rect x="42" y="38" width="16" height="10" fill={color} />
          <Circle cx="50" cy="27" r="14" fill={color} />
        </G>
      );
    case 'curly':
      return (
        <G>
          {cap}
          <Circle cx="22" cy="50" r="11" fill={color} />
          <Circle cx="78" cy="50" r="11" fill={color} />
          <Circle cx="27" cy="38" r="11" fill={color} />
          <Circle cx="73" cy="38" r="11" fill={color} />
          <Circle cx="50" cy="30" r="11" fill={color} />
        </G>
      );
    case 'straight_long':
      return (
        <G>
          {cap}
          <Rect x="18" y="57" width="13" height="64" rx="6" fill={color} />
          <Rect x="69" y="57" width="13" height="64" rx="6" fill={color} />
        </G>
      );
    case 'short':
      return (
        <G>
          <Ellipse cx="50" cy="47" rx="28" ry="13" fill={color} />
          <Rect x="20" y="57" width="11" height="18" rx="5" fill={color} />
          <Rect x="69" y="57" width="11" height="18" rx="5" fill={color} />
        </G>
      );
    case 'wavy':
      return (
        <G>
          {cap}
          <Path d="M 18,58 Q 11,68 18,78 Q 11,88 18,98 L 28,98 Q 21,88 28,78 Q 21,68 28,58 Z" fill={color} />
          <Path d="M 82,58 Q 89,68 82,78 Q 89,88 82,98 L 72,98 Q 79,88 72,78 Q 79,68 72,58 Z" fill={color} />
        </G>
      );
    case 'braids':
      return (
        <G>
          {cap}
          <Rect x="22" y="63" width="10" height="52" rx="5" fill={color} />
          <Rect x="68" y="63" width="10" height="52" rx="5" fill={color} />
          <Circle cx="27" cy="118" r="6" fill={color} />
          <Circle cx="73" cy="118" r="6" fill={color} />
        </G>
      );
    case 'ponytail':
      return (
        <G>
          {cap}
          <Rect x="20" y="57" width="8" height="16" rx="4" fill={color} />
          <Path d="M 78,54 Q 100,44 98,66 Q 96,80 80,78 L 82,60 Z" fill={color} />
        </G>
      );
    case 'buzz':
      return (
        <G>
          <Ellipse cx="50" cy="50" rx="28" ry="9" fill={color} />
          <Rect x="22" y="57" width="5" height="7" rx="2" fill={color} />
          <Rect x="73" y="57" width="5" height="7" rx="2" fill={color} />
        </G>
      );
    default:
      return null;
  }
}

// ─── EYES ─────────────────────────────────────────────────────────────────────

function EyeLayer({ style }) {
  switch (style) {
    case 'normal':
      return (
        <G>
          <Circle cx="40" cy="57" r="5"   fill="#1C1C1E" />
          <Circle cx="60" cy="57" r="5"   fill="#1C1C1E" />
          <Circle cx="42" cy="55" r="1.8" fill="white" />
          <Circle cx="62" cy="55" r="1.8" fill="white" />
        </G>
      );
    case 'almond':
      return (
        <G>
          <Ellipse cx="40" cy="57" rx="6" ry="4" fill="#1C1C1E" />
          <Ellipse cx="60" cy="57" rx="6" ry="4" fill="#1C1C1E" />
          <Circle cx="42" cy="55.5" r="1.5" fill="white" />
          <Circle cx="62" cy="55.5" r="1.5" fill="white" />
        </G>
      );
    case 'wide':
      return (
        <G>
          <Circle cx="40" cy="57" r="7"   fill="#1C1C1E" />
          <Circle cx="60" cy="57" r="7"   fill="#1C1C1E" />
          <Circle cx="43" cy="54" r="2.2" fill="white" />
          <Circle cx="63" cy="54" r="2.2" fill="white" />
        </G>
      );
    case 'tired':
      return (
        <G>
          <Ellipse cx="40" cy="58" rx="5" ry="3.5" fill="#1C1C1E" />
          <Ellipse cx="60" cy="58" rx="5" ry="3.5" fill="#1C1C1E" />
          <Path d="M 35,55 Q 40,52 45,55" stroke="#1C1C1E" strokeWidth="1.5" fill="none" />
          <Path d="M 55,55 Q 60,52 65,55" stroke="#1C1C1E" strokeWidth="1.5" fill="none" />
        </G>
      );
    case 'sparkle':
      return (
        <G>
          <Path d="M40,51 L41.5,56 L47,57 L41.5,58 L40,63 L38.5,58 L33,57 L38.5,56 Z" fill="#1C1C1E" />
          <Path d="M60,51 L61.5,56 L67,57 L61.5,58 L60,63 L58.5,58 L53,57 L58.5,56 Z" fill="#1C1C1E" />
          <Circle cx="42" cy="55" r="1.5" fill="white" />
          <Circle cx="62" cy="55" r="1.5" fill="white" />
        </G>
      );
    case 'cat':
      return (
        <G>
          <Path d="M 33,59 Q 40,51 47,59 Q 40,63 33,59 Z" fill="#1C1C1E" />
          <Path d="M 53,59 Q 60,51 67,59 Q 60,63 53,59 Z" fill="#1C1C1E" />
          <Circle cx="41" cy="57" r="1.5" fill="white" />
          <Circle cx="61" cy="57" r="1.5" fill="white" />
        </G>
      );
    default:
      return null;
  }
}

// ─── MOUTH ────────────────────────────────────────────────────────────────────

function MouthLayer({ style }) {
  switch (style) {
    case 'smile':
      return (
        <Path d="M 42,70 Q 50,78 58,70"
          stroke="#1C1C1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      );
    case 'small_smile':
      return (
        <Path d="M 45,70 Q 50,75 55,70"
          stroke="#1C1C1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      );
    case 'open_smile':
      return (
        <G>
          <Path d="M 42,69 Q 50,79 58,69 Z" fill="white" />
          <Path d="M 42,69 Q 50,79 58,69"
            stroke="#1C1C1E" strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M 42,69 L 58,69" stroke="#1C1C1E" strokeWidth="1.5" fill="none" />
        </G>
      );
    case 'straight':
      return (
        <Path d="M 43,71 L 57,71"
          stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" />
      );
    default:
      return null;
  }
}

// ─── ACCESSORIES ─────────────────────────────────────────────────────────────

function AccessoryLayer({ type }) {
  switch (type) {
    case 'glasses':
      return (
        <G>
          <Circle cx="40" cy="57" r="9" fill="none" stroke="#555" strokeWidth="1.5" />
          <Circle cx="60" cy="57" r="9" fill="none" stroke="#555" strokeWidth="1.5" />
          <Path d="M 49,57 L 51,57" stroke="#555" strokeWidth="1.5" />
          <Path d="M 31,57 L 22,55" stroke="#555" strokeWidth="1.5" />
          <Path d="M 69,57 L 78,55" stroke="#555" strokeWidth="1.5" />
        </G>
      );
    case 'earrings':
      return (
        <G>
          <Circle cx="21" cy="67" r="4.5" fill="#FFD700" />
          <Circle cx="79" cy="67" r="4.5" fill="#FFD700" />
          <Circle cx="21" cy="67" r="2.5" fill="#FFA500" />
          <Circle cx="79" cy="67" r="2.5" fill="#FFA500" />
        </G>
      );
    case 'hat':
      return (
        <G>
          {/* Crown fills top of head */}
          <Ellipse cx="50" cy="46" rx="28" ry="16" fill="#2C2C2E" />
          {/* Brim */}
          <Rect x="10" y="55" width="80" height="8" rx="4" fill="#2C2C2E" />
          {/* Band stripe */}
          <Rect x="22" y="55" width="56" height="5" fill="#E85D75" />
        </G>
      );
    case 'headband':
      return (
        <Ellipse cx="50" cy="44" rx="28" ry="7" fill="#E85D75" />
      );
    default:
      return null;
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AvatarCustom({ config = {}, size = 80 }) {
  const {
    hairStyle  = AVATAR_DEFAULTS.hairStyle,
    hairColor  = AVATAR_DEFAULTS.hairColor,
    skinTone   = AVATAR_DEFAULTS.skinTone,
    eyeStyle   = AVATAR_DEFAULTS.eyeStyle,
    mouthStyle = AVATAR_DEFAULTS.mouthStyle,
    accessory  = AVATAR_DEFAULTS.accessory,
  } = config;

  // Keep the same 100×124 aspect ratio as the original hardcoded avatars
  return (
    <Svg width={size} height={Math.round(size * 1.24)} viewBox="0 0 100 124" fill="none">
      {/* Body / shirt */}
      <Ellipse cx="50" cy="110" rx="36" ry="20" fill="#E5E5EA" />
      {/* Neck */}
      <Rect x="42" y="86" width="16" height="12" rx="5" fill={skinTone} />
      {/* Head */}
      <Circle cx="50" cy="60" r="28" fill={skinTone} />
      {/* Cheek blush */}
      <Circle cx="29" cy="67" r="7" fill="#FFB8C8" opacity="0.4" />
      <Circle cx="71" cy="67" r="7" fill="#FFB8C8" opacity="0.4" />
      {/* Hair — drawn on top of head */}
      <HairLayer style={hairStyle} color={hairColor} />
      {/* Face — drawn on top of hair */}
      <EyeLayer   style={eyeStyle} />
      <MouthLayer style={mouthStyle} />
      {/* Accessories — drawn last */}
      <AccessoryLayer type={accessory} />
    </Svg>
  );
}
