import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

const openURL = (url) => Linking.openURL(url).catch(() => {});

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = { bg: '#F9F7FF', red: '#E85D75', redPale: '#FFF0F3', mid: '#8E8E93', dark: '#1C1C1E', white: '#FFFFFF', border: '#E0DFF0' };

function StepCard({ number, title, description, actionLabel, onAction, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.stepCircle}>
          <Text style={s.stepNum}>{number}</Text>
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle}>{title}</Text>
          {description ? <Text style={s.cardDesc}>{description}</Text> : null}
        </View>
      </View>
      {actionLabel && (
        <TouchableOpacity style={s.actionBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={s.actionTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {children}
    </View>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const [profileId, setProfileId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = profileId.trim().length > 0 && apiKey.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await supabase.from('users').update({
          nextdns_profile_id: profileId.trim(),
          nextdns_api_key: apiKey.trim(),
        }).eq('id', userId);
      }
      router.replace('/pairing');
    } catch {
      router.replace('/pairing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerLeft} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.headerLogo}>breakup.</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Connect NextDNS</Text>
        <Text style={s.sub}>This powers the live browsing activity for both of you</Text>

        <StepCard
          number="1"
          title="Create a free NextDNS account"
          actionLabel="Open NextDNS"
          onAction={() => openURL('https://nextdns.io')}
        />

        <StepCard
          number="2"
          title="Install the NextDNS profile"
          description="Download the profile when prompted, then go to Settings → General → VPN and Device Management to install it"
        />

        <StepCard
          number="3"
          title="Enter your Profile ID"
          description="Your Profile ID is the short code at the top, it looks like e4932e"
          actionLabel="Open Setup Page"
          onAction={() => openURL('https://nextdns.io/setup')}
        >
          <TextInput
            style={s.input}
            placeholder="e.g. e4932e"
            placeholderTextColor={P.mid}
            value={profileId}
            onChangeText={setProfileId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </StepCard>

        <StepCard
          number="4"
          title="Enter your API Key"
          description="Scroll down to find your API Key"
          actionLabel="Open Account Page"
          onAction={() => openURL('https://nextdns.io/account')}
        >
          <TextInput
            style={s.input}
            placeholder="Your API Key"
            placeholderTextColor={P.mid}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </StepCard>

        <TouchableOpacity
          style={[s.btn, !canSave && s.btnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave || saving}
        >
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.btnTxt}>Save and Continue</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={s.skipBtn}
          onPress={() => router.replace('/pairing')}
          activeOpacity={0.7}
        >
          <Text style={s.skipTxt}>Skip for now</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow: { fontSize: 22, color: P.dark, lineHeight: 26 },
  headerLogo: { fontSize: 22, fontStyle: 'italic', color: P.red, fontFamily: SERIF },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  heading: { fontSize: 26, fontWeight: '800', color: P.dark, marginBottom: 8 },
  sub: { fontSize: 15, color: P.mid, marginBottom: 24, lineHeight: 22 },

  card: {
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: P.border,
  },
  cardTop: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: P.red, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  stepNum: { color: P.white, fontWeight: '800', fontSize: 14 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: P.dark, marginBottom: 4, lineHeight: 22 },
  cardDesc: { fontSize: 13, color: P.mid, lineHeight: 20 },

  actionBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: P.redPale,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  actionTxt: { color: P.red, fontWeight: '700', fontSize: 14 },

  input: {
    marginTop: 12,
    backgroundColor: P.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: P.dark,
    borderWidth: 1.5,
    borderColor: P.border,
  },

  btn: {
    marginTop: 8,
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
  btnDisabled: { opacity: 0.45 },
  btnTxt: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipTxt: { fontSize: 15, color: P.mid },
});
