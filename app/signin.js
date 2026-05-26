import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = {
  bg: '#F9F7FF', red: '#E85D75', redPale: '#FFF0F3',
  mid: '#8E8E93', dark: '#1C1C1E', white: '#FFFFFF', border: '#E0DFF0',
};

export default function SigninScreen() {
  const router = useRouter();
  const passwordRef = useRef(null);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      const userId = data.user?.id;
      if (!userId) {
        setError('Sign in succeeded but no user ID was returned. Please try again.');
        return;
      }

      await AsyncStorage.setItem('userId', userId);

      // Fetch the user's row to decide where to resume in onboarding.
      const { data: userRow } = await supabase
        .from('users')
        .select('onboarding_complete, partner_id, couple_code, name')
        .eq('id', userId)
        .single();

      if (userRow?.couple_code) await AsyncStorage.setItem('coupleCode', userRow.couple_code);
      if (userRow?.name)        await AsyncStorage.setItem('userName',   userRow.name);

      if (userRow?.onboarding_complete) {
        router.replace('/(tabs)/home');
      } else if (userRow?.partner_id) {
        // Has partner but not fully done — resume at tutorial
        router.replace('/tutorial');
      } else if (userRow?.name) {
        // Has name → got past name screen; resume at pairing
        router.replace('/pairing');
      } else {
        // No name yet → start from name screen
        router.replace('/name');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerLeft} activeOpacity={0.7}>
            <Text style={s.backArrow}>←</Text>
            <Text style={s.headerLogo}>breakup.</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.sub}>Sign in to see what your partner is up to.</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor={P.mid}
            value={email}
            onChangeText={v => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!loading}
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            ref={passwordRef}
            style={s.input}
            placeholder="Your password"
            placeholderTextColor={P.mid}
            value={password}
            onChangeText={v => { setPassword(v); setError(''); }}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            editable={!loading}
          />

          {error ? <Text style={s.errorTxt}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, (!canSubmit || loading) && s.btnDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color={P.white} />
              : <Text style={s.btnTxt}>Sign In</Text>
            }
          </TouchableOpacity>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/signup')} activeOpacity={0.7}>
              <Text style={s.switchLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow: { fontSize: 22, color: P.dark, lineHeight: 26 },
  headerLogo: { fontSize: 22, fontStyle: 'italic', color: P.red, fontFamily: SERIF },

  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: P.dark, marginBottom: 8 },
  sub:     { fontSize: 15, color: P.mid, marginBottom: 28, lineHeight: 22 },

  label: {
    fontSize: 12, fontWeight: '700', color: P.mid,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: P.dark,
    borderWidth: 1.5,
    borderColor: P.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  errorTxt: { color: P.red, fontSize: 14, fontWeight: '600', marginBottom: 16, lineHeight: 20 },

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
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.45 },
  btnTxt: { color: P.white, fontSize: 17, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchTxt:  { fontSize: 14, color: P.mid },
  switchLink: { fontSize: 14, color: P.red, fontWeight: '700' },
});
