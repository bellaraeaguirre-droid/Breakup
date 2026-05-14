/**
 * Avatar Builder Screen
 *
 * Before this screen works end-to-end with Supabase sync, run this migration
 * in your Supabase SQL editor:
 *
 *   ALTER TABLE users
 *     ADD COLUMN IF NOT EXISTS hair_style  TEXT DEFAULT 'bun',
 *     ADD COLUMN IF NOT EXISTS hair_color  TEXT DEFAULT '#E85D75',
 *     ADD COLUMN IF NOT EXISTS skin_tone   TEXT DEFAULT '#FFD0DC',
 *     ADD COLUMN IF NOT EXISTS eye_style   TEXT DEFAULT 'normal',
 *     ADD COLUMN IF NOT EXISTS mouth_style TEXT DEFAULT 'smile',
 *     ADD COLUMN IF NOT EXISTS accessory   TEXT DEFAULT 'none';
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import AvatarCustom, { AVATAR_DEFAULTS } from '../components/AvatarCustom';

const W = Dimensions.get('window').width;

const P = {
  bg:      '#F9F7FF',
  white:   '#FFFFFF',
  red:     '#E85D75',
  redPale: '#FFF0F3',
  dark:    '#1C1C1E',
  mid:     '#8E8E93',
  border:  '#EAE8F5',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'hair',    label: 'Hair' },
  { key: 'face',    label: 'Face' },
  { key: 'skin',    label: 'Skin' },
  { key: 'color',   label: 'Color' },
  { key: 'extras',  label: 'Extras' },
];

const HAIR_STYLES = [
  { key: 'bun',          label: 'Bun' },
  { key: 'curly',        label: 'Curly' },
  { key: 'straight_long', label: 'Straight' },
  { key: 'short',        label: 'Short' },
  { key: 'wavy',         label: 'Wavy' },
  { key: 'braids',       label: 'Braids' },
  { key: 'ponytail',     label: 'Pony' },
  { key: 'buzz',         label: 'Buzz' },
];

const EYE_STYLES = [
  { key: 'normal',  label: 'Classic' },
  { key: 'almond',  label: 'Almond' },
  { key: 'wide',    label: 'Wide' },
  { key: 'tired',   label: 'Tired' },
  { key: 'sparkle', label: 'Sparkle' },
  { key: 'cat',     label: 'Cat' },
];

const MOUTH_STYLES = [
  { key: 'smile',       label: 'Smile' },
  { key: 'small_smile', label: 'Soft' },
  { key: 'open_smile',  label: 'Happy' },
  { key: 'straight',    label: 'Chill' },
];

const SKIN_TONES = [
  '#FDDBB4', '#F5C695', '#DFA876',
  '#C68B5A', '#9C5E3C', '#6B3120',
];

const HAIR_COLORS = [
  { hex: '#FF80AB', label: 'Pink' },
  { hex: '#E85D75', label: 'Red' },
  { hex: '#F5D077', label: 'Blonde' },
  { hex: '#8B4513', label: 'Brown' },
  { hex: '#1C1C1E', label: 'Black' },
  { hex: '#5B9BD5', label: 'Blue' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#F97316', label: 'Orange' },
];

const ACCESSORIES = [
  { key: 'none',     label: 'None' },
  { key: 'earrings', label: 'Earrings' },
  { key: 'hat',      label: 'Hat' },
  { key: 'headband', label: 'Headband' },
  { key: 'glasses',  label: 'Glasses' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Width for 4-column avatar option cards
const CARD_W = Math.floor((W - 32 - 3 * 8) / 4);

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function AvatarBuilderScreen() {
  const router = useRouter();
  const [config, setConfig]       = useState({ ...AVATAR_DEFAULTS });
  const [activeTab, setActiveTab] = useState('hair');
  const [saving, setSaving]       = useState(false);

  // Load saved avatar config from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.multiGet([
      'avatarHairStyle', 'avatarHairColor', 'avatarSkinTone',
      'avatarEyeStyle',  'avatarMouthStyle', 'avatarAccessory',
    ]).then(results => {
      const [
        [, hs], [, hc], [, st],
        [, es], [, ms], [, ac],
      ] = results;
      setConfig({
        hairStyle:  hs || AVATAR_DEFAULTS.hairStyle,
        hairColor:  hc || AVATAR_DEFAULTS.hairColor,
        skinTone:   st || AVATAR_DEFAULTS.skinTone,
        eyeStyle:   es || AVATAR_DEFAULTS.eyeStyle,
        mouthStyle: ms || AVATAR_DEFAULTS.mouthStyle,
        accessory:  ac || AVATAR_DEFAULTS.accessory,
      });
    });
  }, []);

  const update = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  const handleDone = async () => {
    setSaving(true);
    await AsyncStorage.multiSet([
      ['avatarHairStyle',  config.hairStyle],
      ['avatarHairColor',  config.hairColor],
      ['avatarSkinTone',   config.skinTone],
      ['avatarEyeStyle',   config.eyeStyle],
      ['avatarMouthStyle', config.mouthStyle],
      ['avatarAccessory',  config.accessory],
    ]);
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      const { error } = await supabase.from('users').update({
        hair_style:  config.hairStyle,
        hair_color:  config.hairColor,
        skin_tone:   config.skinTone,
        eye_style:   config.eyeStyle,
        mouth_style: config.mouthStyle,
        accessory:   config.accessory,
      }).eq('id', userId);
      if (error) console.log('[Avatar] Supabase save error:', error.message);
    }
    setSaving(false);
    router.back();
  };

  // ─── OPTION CARDS ────────────────────────────────────────────────────────────

  const AvatarCard = ({ selectedKey, itemKey, label, configOverride, onPress }) => {
    const selected = selectedKey === itemKey;
    return (
      <TouchableOpacity
        style={[s.optCard, selected && s.optCardActive]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <AvatarCustom config={{ ...config, ...configOverride }} size={58} />
        <Text style={[s.optLabel, selected && s.optLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // ─── TAB CONTENT ─────────────────────────────────────────────────────────────

  const renderHair = () => (
    <View style={s.grid}>
      {HAIR_STYLES.map(item => (
        <AvatarCard
          key={item.key}
          selectedKey={config.hairStyle}
          itemKey={item.key}
          label={item.label}
          configOverride={{ hairStyle: item.key }}
          onPress={() => update('hairStyle', item.key)}
        />
      ))}
    </View>
  );

  const renderFace = () => (
    <View>
      <Text style={s.sectionHdr}>Eyes</Text>
      <View style={s.grid}>
        {EYE_STYLES.map(item => (
          <AvatarCard
            key={item.key}
            selectedKey={config.eyeStyle}
            itemKey={item.key}
            label={item.label}
            configOverride={{ eyeStyle: item.key }}
            onPress={() => update('eyeStyle', item.key)}
          />
        ))}
      </View>

      <Text style={s.sectionHdr}>Mouth</Text>
      <View style={s.grid}>
        {MOUTH_STYLES.map(item => (
          <AvatarCard
            key={item.key}
            selectedKey={config.mouthStyle}
            itemKey={item.key}
            label={item.label}
            configOverride={{ mouthStyle: item.key }}
            onPress={() => update('mouthStyle', item.key)}
          />
        ))}
      </View>

      <View style={s.glassesRow}>
        <Text style={s.sectionHdr}>Glasses</Text>
        <TouchableOpacity
          style={[
            s.glassesToggle,
            config.accessory === 'glasses' && s.glassesToggleOn,
          ]}
          onPress={() => update('accessory', config.accessory === 'glasses' ? 'none' : 'glasses')}
          activeOpacity={0.85}
        >
          <Text style={[
            s.glassesToggleTxt,
            config.accessory === 'glasses' && s.glassesToggleTxtOn,
          ]}>
            {config.accessory === 'glasses' ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSkin = () => (
    <View style={s.toneGrid}>
      {SKIN_TONES.map(tone => {
        const selected = config.skinTone === tone;
        return (
          <TouchableOpacity
            key={tone}
            style={[s.toneOuter, selected && s.toneOuterActive]}
            onPress={() => update('skinTone', tone)}
            activeOpacity={0.85}
          >
            <View style={[s.toneCircle, { backgroundColor: tone }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderColor = () => (
    <View style={s.toneGrid}>
      {HAIR_COLORS.map(({ hex, label }) => {
        const selected = config.hairColor === hex;
        return (
          <TouchableOpacity
            key={hex}
            style={[s.toneOuter, selected && s.toneOuterActive]}
            onPress={() => update('hairColor', hex)}
            activeOpacity={0.85}
          >
            <View style={[s.toneCircle, { backgroundColor: hex }]} />
            <Text style={s.toneLabel}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderExtras = () => (
    <View style={s.grid}>
      {ACCESSORIES.map(item => (
        <AvatarCard
          key={item.key}
          selectedKey={config.accessory}
          itemKey={item.key}
          label={item.label}
          configOverride={{ accessory: item.key }}
          onPress={() => update('accessory', item.key)}
        />
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hair':   return renderHair();
      case 'face':   return renderFace();
      case 'skin':   return renderSkin();
      case 'color':  return renderColor();
      case 'extras': return renderExtras();
    }
  };

  // ─── LAYOUT ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Avatar Builder</Text>
        <TouchableOpacity
          onPress={handleDone}
          style={[s.doneBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={P.white} size="small" />
            : <Text style={s.doneTxt}>Done</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Live preview */}
      <View style={s.preview}>
        <View style={s.previewCircle}>
          <AvatarCustom config={config} size={140} />
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabBarInner}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            <Text style={[s.tabTxt, activeTab === tab.key && s.tabTxtActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Options grid */}
      <ScrollView
        style={s.opts}
        contentContainerStyle={s.optsInner}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
        <View style={{ height: 48 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.white },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    backgroundColor: P.white,
  },
  headerSide: { minWidth: 64 },
  backTxt:  { fontSize: 16, fontWeight: '600', color: P.red },
  title:    { fontSize: 17, fontWeight: '700', color: P.dark, fontFamily: SERIF },
  doneBtn:  {
    backgroundColor: P.red,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 64,
    alignItems: 'center',
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  doneTxt:  { color: P.white, fontWeight: '700', fontSize: 15 },

  // preview
  preview: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: P.bg,
  },
  previewCircle: {
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: P.redPale,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  // tabs
  tabBar:      { maxHeight: 54, backgroundColor: P.white },
  tabBarInner: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: P.bg,
  },
  tabActive:    { backgroundColor: P.red },
  tabTxt:       { fontSize: 13, fontWeight: '600', color: P.mid },
  tabTxtActive: { color: P.white },

  // options
  opts:      { flex: 1, backgroundColor: P.white },
  optsInner: { padding: 16 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optCard: {
    width: CARD_W,
    alignItems: 'center',
    backgroundColor: P.bg,
    borderRadius: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optCardActive: {
    borderColor: P.red,
    backgroundColor: P.redPale,
  },
  optLabel:       { fontSize: 11, fontWeight: '600', color: P.mid, marginTop: 4 },
  optLabelActive: { color: P.red },

  sectionHdr: {
    fontSize: 12,
    fontWeight: '700',
    color: P.mid,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },

  // skin / color swatches
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingVertical: 8,
  },
  toneOuter: {
    alignItems: 'center',
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  toneOuterActive: { borderColor: P.red },
  toneCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  toneLabel: { fontSize: 10, color: P.mid, marginTop: 5, fontWeight: '500' },

  // glasses toggle
  glassesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },
  glassesToggle: {
    backgroundColor: P.bg,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderWidth: 2,
    borderColor: P.border,
  },
  glassesToggleOn:    { backgroundColor: P.redPale, borderColor: P.red },
  glassesToggleTxt:   { fontSize: 14, fontWeight: '700', color: P.mid },
  glassesToggleTxtOn: { color: P.red },
});
