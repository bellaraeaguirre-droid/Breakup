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
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = { bg: '#F9F7FF', white: '#FFFFFF', red: '#E85D75', redPale: '#FFF0F3', dark: '#1C1C1E', mid: '#8E8E93', border: '#E0DFF0' };

const TABS = [
  { key: 'hair',  label: 'Hair' },
  { key: 'color', label: 'Color' },
  { key: 'skin',  label: 'Skin' },
  { key: 'face',  label: 'Face' },
];

const HAIR_STYLES = [
  { key: 'bun',          label: 'Bun' },
  { key: 'curly',        label: 'Curly' },
  { key: 'straight_long', label: 'Long' },
  { key: 'short',        label: 'Short' },
  { key: 'wavy',         label: 'Wavy' },
  { key: 'braids',       label: 'Braids' },
  { key: 'ponytail',     label: 'Ponytail' },
  { key: 'buzz',         label: 'Buzz' },
];

const HAIR_COLORS = [
  { hex: '#E85D75', label: 'Pink' },
  { hex: '#F5C842', label: 'Yellow' },
  { hex: '#8B4513', label: 'Brown' },
  { hex: '#1C1C1E', label: 'Black' },
  { hex: '#5B9BD5', label: 'Blue' },
  { hex: '#9B59B6', label: 'Purple' },
  { hex: '#FF6B35', label: 'Orange' },
  { hex: '#F0E68C', label: 'Blonde' },
];

const SKIN_TONES = ['#FDDBB4', '#F5C695', '#DFA876', '#C68B5A', '#9C5E3C', '#6B3120'];

const EYE_STYLES = [
  { key: 'normal',  label: 'Classic' },
  { key: 'almond',  label: 'Almond' },
  { key: 'wide',    label: 'Wide' },
  { key: 'sparkle', label: 'Sparkle' },
];

export default function AvatarBuilderScreen() {
  const router = useRouter();
  const [config, setConfig]       = useState({ ...AVATAR_DEFAULTS });
  const [activeTab, setActiveTab] = useState('hair');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([
      'avatarHairStyle', 'avatarHairColor', 'avatarSkinTone',
      'avatarEyeStyle', 'avatarMouthStyle', 'avatarAccessory',
    ]).then(results => {
      const [[, hs], [, hc], [, st], [, es], [, ms], [, ac]] = results;
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

  const update = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const handleContinue = async () => {
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
      await supabase.from('users').update({
        hair_style:  config.hairStyle,
        hair_color:  config.hairColor,
        skin_tone:   config.skinTone,
        eye_style:   config.eyeStyle,
        mouth_style: config.mouthStyle,
        accessory:   config.accessory,
      }).eq('id', userId);
    }
    setSaving(false);
    router.push('/setup');
  };

  // ─── TAB CONTENT ─────────────────────────────────────────────────────────────

  const renderHair = () => (
    <View style={s.chipGrid}>
      {HAIR_STYLES.map(item => {
        const active = config.hairStyle === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[s.chip, active && s.chipActive]}
            onPress={() => update('hairStyle', item.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, active && s.chipTxtActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderColor = () => (
    <View style={s.swatchGrid}>
      {HAIR_COLORS.map(({ hex, label }) => {
        const active = config.hairColor === hex;
        return (
          <TouchableOpacity
            key={hex}
            style={[s.swatchOuter, active && s.swatchOuterActive]}
            onPress={() => update('hairColor', hex)}
            activeOpacity={0.85}
          >
            <View style={[s.swatch, { backgroundColor: hex }]} />
            <Text style={s.swatchLabel}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSkin = () => (
    <View style={s.swatchGrid}>
      {SKIN_TONES.map(tone => {
        const active = config.skinTone === tone;
        return (
          <TouchableOpacity
            key={tone}
            style={[s.swatchOuter, active && s.swatchOuterActive]}
            onPress={() => update('skinTone', tone)}
            activeOpacity={0.85}
          >
            <View style={[s.swatch, { backgroundColor: tone }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFace = () => (
    <View style={s.chipGrid}>
      {EYE_STYLES.map(item => {
        const active = config.eyeStyle === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[s.chip, s.chipWide, active && s.chipActive]}
            onPress={() => update('eyeStyle', item.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, active && s.chipTxtActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'hair':  return renderHair();
      case 'color': return renderColor();
      case 'skin':  return renderSkin();
      case 'face':  return renderFace();
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerLeft} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.headerLogo}>breakup.</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Avatar Builder</Text>
        <View style={{ width: 80 }} />
      </View>

      <Text style={s.subtitle}>Now let's make you look like you</Text>

      {/* Live preview */}
      <View style={s.preview}>
        <View style={s.previewCircle}>
          <AvatarCustom config={config} size={138} />
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            <Text style={[s.tabTxt, activeTab === tab.key && s.tabTxtActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Options */}
      <ScrollView style={s.opts} contentContainerStyle={s.optsInner} showsVerticalScrollIndicator={false}>
        {renderTab()}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Continue */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btn, saving && s.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.btnTxt}>Continue</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 80 },
  backArrow: { fontSize: 22, color: P.dark, lineHeight: 26 },
  headerLogo: { fontSize: 22, fontStyle: 'italic', color: P.red, fontFamily: SERIF },
  headerTitle: { fontSize: 16, fontWeight: '700', color: P.dark },

  subtitle: { fontSize: 14, color: P.mid, textAlign: 'center', paddingBottom: 10 },

  preview: { alignItems: 'center', paddingVertical: 16, backgroundColor: P.bg },
  previewCircle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: P.redPale,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: P.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: P.white,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 999,
    backgroundColor: P.bg, alignItems: 'center',
  },
  tabActive: { backgroundColor: P.red },
  tabTxt: { fontSize: 13, fontWeight: '600', color: P.mid },
  tabTxtActive: { color: P.white },

  opts: { flex: 1, backgroundColor: P.white },
  optsInner: { padding: 18 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: P.bg,
    borderWidth: 1.5,
    borderColor: P.border,
  },
  chipWide: { paddingHorizontal: 22 },
  chipActive: { backgroundColor: P.redPale, borderColor: P.red },
  chipTxt: { fontSize: 14, fontWeight: '600', color: P.mid },
  chipTxtActive: { color: P.red },

  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingVertical: 6 },
  swatchOuter: {
    alignItems: 'center', padding: 3,
    borderRadius: 999, borderWidth: 3, borderColor: 'transparent',
  },
  swatchOuterActive: { borderColor: P.red },
  swatch: {
    width: 52, height: 52, borderRadius: 26,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  swatchLabel: { fontSize: 10, color: P.mid, marginTop: 5, fontWeight: '500' },

  footer: {
    backgroundColor: P.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  btn: {
    backgroundColor: P.red,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.55 },
  btnTxt: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
