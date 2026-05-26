import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = { bg: '#F9F7FF', red: '#E85D75', mid: '#8E8E93', dark: '#1C1C1E', white: '#FFFFFF', border: '#E0DFF0' };

export default function NameScreen() {
  const router = useRouter();
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[name] onAuthStateChange:', event, '| uid:', session?.user?.id ?? 'null');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      // Auth session (Google OAuth) takes priority; fall back to stored userId (email signup).
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || await AsyncStorage.getItem('userId');

      if (!userId) {
        Alert.alert('Session expired', 'Please sign in again.');
        router.replace('/welcome');
        return;
      }

      // Use existing couple code from signup; generate one only if it's missing (Google OAuth path).
      const existingCode = await AsyncStorage.getItem('coupleCode');
      const coupleCode   = existingCode || String(Math.floor(100000 + Math.random() * 900000));

      const { error } = await supabase.from('users').upsert({
        id: userId,
        name: trimmed,
        couple_code: coupleCode,
      }, { onConflict: 'id' });
      if (error) throw error;

      await AsyncStorage.multiSet([
        ['userId',     userId],
        ['userName',   trimmed],
        ['coupleCode', coupleCode],
      ]);

      router.push('/birthday');
    } catch (err) {
      console.log('[name] error:', err?.message);
      Alert.alert('Error', 'Could not save your name. Please try again.');
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

      <View style={s.content}>
        <Text style={s.heading}>What should we call you?</Text>

        <TextInput
          style={s.input}
          placeholder="Your name"
          placeholderTextColor={P.mid}
          value={name}
          onChangeText={setName}
          maxLength={40}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          editable={!saving}
        />

        <TouchableOpacity
          style={[s.btn, (!name.trim() || saving) && s.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={!name.trim() || saving}
        >
          {saving
            ? <ActivityIndicator color={P.white} />
            : <Text style={s.btnTxt}>Continue</Text>
          }
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

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 36 },
  heading: { fontSize: 28, fontWeight: '800', color: P.dark, marginBottom: 32 },

  input: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: '500',
    color: P.dark,
    borderWidth: 1.5,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
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
  btnDisabled: { opacity: 0.45 },
  btnTxt: { color: P.white, fontSize: 17, fontWeight: '700' },
});
