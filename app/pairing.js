import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = { bg: '#F9F7FF', red: '#E85D75', redPale: '#FFF0F3', mid: '#8E8E93', dark: '#1C1C1E', white: '#FFFFFF', border: '#E0DFF0' };

export default function PairingScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [myCode, setMyCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(['userId', 'coupleCode']).then(([[, uid], [, code]]) => {
      setUserId(uid);
      setMyCode(code || '');
    });
  }, []);

  const handleCopy = async () => {
    if (!myCode) return;
    await Clipboard.setStringAsync(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleConnect = async () => {
    if (partnerCode.length !== 6) return;
    if (partnerCode === myCode) {
      Alert.alert("That's your own code!", 'Ask your partner for their code.');
      return;
    }
    setLoading(true);
    const { data: partner, error } = await supabase
      .from('users')
      .select('id')
      .eq('couple_code', partnerCode)
      .single();

    if (error || !partner) {
      setLoading(false);
      Alert.alert('Code not found', 'No account matches that code. Double-check with your partner.');
      return;
    }

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('users').update({ partner_id: partner.id }).eq('id', userId),
      supabase.from('users').update({ partner_id: userId }).eq('id', partner.id),
    ]);

    if (e1 || e2) {
      setLoading(false);
      Alert.alert('Error', 'Could not pair accounts. Please try again.');
      return;
    }

    router.replace('/tutorial');
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerLeft} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.headerLogo}>breakup.</Text>
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <Text style={s.heading}>Pair with your partner</Text>

        {/* Your code */}
        <View style={s.codeBox}>
          <Text style={s.codeLabel}>YOUR COUPLE CODE</Text>
          <View style={s.codeRow}>
            <Text style={s.codeText}>{myCode || '------'}</Text>
            <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
              <Text style={s.copyTxt}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or enter theirs</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Partner code input */}
        <TextInput
          style={s.codeInput}
          placeholder="000000"
          placeholderTextColor={P.mid}
          value={partnerCode}
          onChangeText={t => setPartnerCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          returnKeyType="done"
          onSubmitEditing={handleConnect}
          editable={!loading}
        />

        <TouchableOpacity
          style={[s.btn, (partnerCode.length !== 6 || loading) && s.btnDisabled]}
          onPress={handleConnect}
          activeOpacity={0.85}
          disabled={partnerCode.length !== 6 || loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.btnTxt}>Connect</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={s.skipBtn}
          onPress={() => router.replace('/tutorial')}
          activeOpacity={0.7}
        >
          <Text style={s.skipTxt}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow: { fontSize: 22, color: P.dark, lineHeight: 26 },
  headerLogo: { fontSize: 22, fontStyle: 'italic', color: P.red, fontFamily: SERIF },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  heading: { fontSize: 26, fontWeight: '800', color: P.dark, marginBottom: 28 },

  codeBox: {
    backgroundColor: P.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: P.red,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 22,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  codeLabel: { fontSize: 11, fontWeight: '700', color: P.mid, letterSpacing: 1.5, marginBottom: 12 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeText: { fontSize: 44, fontWeight: '900', color: P.dark, fontFamily: SERIF, letterSpacing: 6 },
  copyBtn: {
    backgroundColor: P.redPale,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  copyTxt: { color: P.red, fontWeight: '700', fontSize: 14 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: P.border },
  dividerText: { fontSize: 14, color: P.mid, fontWeight: '500' },

  codeInput: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 8,
    color: P.dark,
    borderWidth: 1.5,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
    textAlign: 'center',
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
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.45 },
  btnTxt: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipTxt: { fontSize: 15, color: P.mid },
});
