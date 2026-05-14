import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import AvatarCustom, { AVATAR_DEFAULTS } from '../components/AvatarCustom';

const P = {
  bg: '#F9F7FF',
  white: '#FFFFFF',
  red: '#E85D75',
  redPale: '#FFF0F3',
  dark: '#1C1C1E',
  mid: '#8E8E93',
  green: '#4CAF82',
  greenPale: '#E8F7EF',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export default function SettingsScreen() {
  const router = useRouter();

  const [profileId, setProfileId] = useState('');
  const [apiKey, setApiKey]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { count } | { error }
  const [userId, setUserId]           = useState('');
  const [userName, setUserName]       = useState('');
  const [userEmail, setUserEmail]     = useState('');
  const [avatarConfig, setAvatarConfig] = useState({ ...AVATAR_DEFAULTS });

  useEffect(() => {
    AsyncStorage.multiGet(['userId', 'nextdnsProfileId', 'nextdnsApiKey', 'userName', 'userEmail'])
      .then(([[, uid], [, pid], [, ak], [, name], [, email]]) => {
        if (uid)   setUserId(uid);
        if (pid)   setProfileId(pid);
        if (ak)    setApiKey(ak);
        if (name)  setUserName(name);
        if (email) setUserEmail(email);
      });
  }, []);

  // Reload avatar whenever screen comes into focus (e.g. returning from Avatar Builder)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.multiGet([
        'avatarHairStyle', 'avatarHairColor', 'avatarSkinTone',
        'avatarEyeStyle',  'avatarMouthStyle', 'avatarAccessory',
      ]).then(([[, hs], [, hc], [, st], [, es], [, ms], [, ac]]) => {
        setAvatarConfig({
          hairStyle:  hs || AVATAR_DEFAULTS.hairStyle,
          hairColor:  hc || AVATAR_DEFAULTS.hairColor,
          skinTone:   st || AVATAR_DEFAULTS.skinTone,
          eyeStyle:   es || AVATAR_DEFAULTS.eyeStyle,
          mouthStyle: ms || AVATAR_DEFAULTS.mouthStyle,
          accessory:  ac || AVATAR_DEFAULTS.accessory,
        });
      });
    }, [])
  );

  const handleSave = async () => {
    setSaving(true);
    const pid = profileId.trim();
    const ak  = apiKey.trim();

    // Persist locally for quick access and offline use
    await AsyncStorage.multiSet([
      ['nextdnsProfileId', pid],
      ['nextdnsApiKey',    ak],
    ]);

    // Persist to Supabase so the home screen (and partner's device) can read them
    if (userId) {
      const { error } = await supabase
        .from('users')
        .update({ nextdns_profile_id: pid, nextdns_api_key: ak })
        .eq('id', userId);
      if (error) console.log('[Settings] Supabase save error:', error.message);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSync = async () => {
    // Read fresh from storage so secureTextEntry state quirks can't affect the values
    const [[, storedProfileId], [, storedApiKey]] = await AsyncStorage.multiGet([
      'nextdnsProfileId',
      'nextdnsApiKey',
    ]);

    console.log('[NextDNS] profileId:', storedProfileId);
    console.log('[NextDNS] apiKey:', storedApiKey);

    if (!storedProfileId || !storedApiKey) {
      setSyncResult({ error: 'Save your NextDNS credentials first.' });
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(
        `https://api.nextdns.io/profiles/${storedProfileId}/logs`,
        { headers: { 'X-Api-Key': storedApiKey } },
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      const count = Array.isArray(json.data) ? json.data.length : 0;
      setSyncResult({ count });
    } catch (err) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.logo}>breakup.</Text>

        {/* ── Avatar ── */}
        <TouchableOpacity
          style={s.avatarCard}
          onPress={() => router.push('/avatar')}
          activeOpacity={0.88}
        >
          <View style={s.avatarPreviewCircle}>
            <AvatarCustom config={avatarConfig} size={80} />
          </View>
          <View style={s.avatarCardText}>
            <Text style={s.avatarCardTitle}>My Avatar</Text>
            <Text style={s.avatarCardSub}>Tap to customize</Text>
          </View>
          <Text style={s.avatarChevron}>›</Text>
        </TouchableOpacity>

        {/* ── Real Activity Data ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Real Activity Data</Text>

          <Text style={s.label}>NextDNS Profile ID</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. abc123"
            placeholderTextColor={P.mid}
            value={profileId}
            onChangeText={setProfileId}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={s.label}>NextDNS API Key</Text>
          <TextInput
            style={s.input}
            placeholder="Your API key"
            placeholderTextColor={P.mid}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btnSecondary, (saving || saved) && { opacity: 0.7 }]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={P.red} size="small" />
                : <Text style={s.btnSecondaryTxt}>{saved ? 'Saved ✓' : 'Save'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btnPrimary, syncing && { opacity: 0.7 }]}
              onPress={handleSync}
              activeOpacity={0.85}
              disabled={syncing}
            >
              {syncing
                ? <ActivityIndicator color={P.white} size="small" />
                : <Text style={s.btnPrimaryTxt}>Sync Now</Text>
              }
            </TouchableOpacity>
          </View>

          {syncResult && (
            <View style={[s.syncBanner, syncResult.error ? s.syncBannerErr : s.syncBannerOk]}>
              <Text style={[s.syncBannerTxt, syncResult.error ? s.syncTxtErr : s.syncTxtOk]}>
                {syncResult.error
                  ? `Error: ${syncResult.error}`
                  : `Fetched ${syncResult.count} entr${syncResult.count === 1 ? 'y' : 'ies'} successfully`
                }
              </Text>
            </View>
          )}
        </View>

        {/* ── Account ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account</Text>

          <View style={s.accountInfo}>
            <Text style={s.accountName}>{userName || '—'}</Text>
            {userEmail ? <Text style={s.accountEmail}>{userEmail}</Text> : null}
          </View>

          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
            <Text style={s.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: P.bg },
  scroll: { paddingBottom: 40 },

  back:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backTxt: { fontSize: 17, fontWeight: '600', color: P.red },

  logo: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: P.red,
    fontFamily: SERIF,
    textAlign: 'center',
    marginVertical: 24,
  },

  avatarCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarPreviewCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: P.redPale,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCardText: { flex: 1, marginLeft: 16 },
  avatarCardTitle: { fontSize: 16, fontWeight: '700', color: P.dark, marginBottom: 3 },
  avatarCardSub:   { fontSize: 13, color: P.mid },
  avatarChevron:   { fontSize: 24, color: P.mid, marginRight: 4 },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.dark,
    marginBottom: 18,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: P.mid,
    letterSpacing: 0.5,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: P.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: P.dark,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EAE8F5',
  },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btnSecondary: {
    flex: 1,
    backgroundColor: P.redPale,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnSecondaryTxt: { color: P.red, fontWeight: '700', fontSize: 15 },
  btnPrimary: {
    flex: 1,
    backgroundColor: P.red,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryTxt: { color: P.white, fontWeight: '700', fontSize: 15 },

  syncBanner: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  syncBannerOk:  { backgroundColor: P.greenPale },
  syncBannerErr: { backgroundColor: P.redPale },
  syncBannerTxt: { fontSize: 14, fontWeight: '600' },
  syncTxtOk:     { color: P.green },
  syncTxtErr:    { color: P.red },

  accountInfo: { marginBottom: 18 },
  accountName:  { fontSize: 18, fontWeight: '700', color: P.dark, marginBottom: 4 },
  accountEmail: { fontSize: 14, color: P.mid },

  signOutBtn: {
    backgroundColor: P.redPale,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutTxt: { color: P.red, fontWeight: '700', fontSize: 16 },
});
