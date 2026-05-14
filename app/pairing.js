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

const P = {
  bg: '#F9F7FF', red: '#E85D75', mid: '#8E8E93',
  white: '#FFFFFF', dark: '#1C1C1E', redPale: '#FFF0F3',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    if (partnerCode.length !== 6) {
      Alert.alert('Enter your partner\'s 6-digit code to connect.');
      return;
    }
    if (partnerCode === myCode) {
      Alert.alert('That\'s your own code!', 'Ask your partner for their code.');
      return;
    }

    setLoading(true);

    // Find partner by couple_code
    const { data: partner, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('couple_code', partnerCode)
      .single();

    if (findError || !partner) {
      setLoading(false);
      Alert.alert('Code not found', 'No account matches that code. Double-check with your partner.');
      return;
    }

    // Set partner_id on both users simultaneously
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('users').update({ partner_id: partner.id }).eq('id', userId),
      supabase.from('users').update({ partner_id: userId }).eq('id', partner.id),
    ]);

    if (e1 || e2) {
      setLoading(false);
      Alert.alert('Error', 'Could not pair accounts. Please try again.');
      return;
    }

    await AsyncStorage.setItem('partnerId', partner.id);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.content}>
        <Text style={s.logo}>breakup.</Text>
        <Text style={s.heading}>Connect with your partner</Text>

        <View style={s.codeCard}>
          <Text style={s.codeLabel}>YOUR CODE</Text>
          <Text style={s.codeText}>{myCode || '------'}</Text>
          <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
            <Text style={s.copyBtnTxt}>{copied ? 'Copied!' : 'Copy code'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.orText}>Enter your partner's code below</Text>

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
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 28,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: P.red,
    fontFamily: SERIF,
    marginBottom: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: P.dark,
    marginBottom: 28,
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: P.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 11,
    color: P.mid,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 52,
    fontWeight: '900',
    color: P.dark,
    fontFamily: SERIF,
    letterSpacing: 8,
    marginBottom: 18,
  },
  copyBtn: {
    backgroundColor: P.redPale,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  copyBtnTxt: { color: P.red, fontWeight: '700', fontSize: 14 },
  orText: {
    fontSize: 14,
    color: P.mid,
    marginBottom: 14,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: P.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 6,
    color: P.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
    marginBottom: 20,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: P.red,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
