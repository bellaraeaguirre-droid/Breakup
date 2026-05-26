import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = { bg: '#F9F7FF', red: '#E85D75', mid: '#8E8E93', dark: '#1C1C1E', white: '#FFFFFF' };

const TODAY = new Date();
const DEFAULT_DATE = new Date(TODAY.getFullYear() - 20, TODAY.getMonth(), TODAY.getDate());

function getAge(date) {
  let age = TODAY.getFullYear() - date.getFullYear();
  const m = TODAY.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && TODAY.getDate() < date.getDate())) age--;
  return age;
}

export default function BirthdayScreen() {
  const router = useRouter();
  const [date,   setDate]   = useState(DEFAULT_DATE);
  const [saving, setSaving] = useState(false);

  const age      = getAge(date);
  const tooYoung = age < 17;

  const handleContinue = async () => {
    if (tooYoung) return;
    setSaving(true);
    try {
      const iso    = date.toISOString().split('T')[0];
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const { error } = await supabase
          .from('users')
          .update({ date_of_birth: iso })
          .eq('id', userId);
        if (error) console.log('[birthday] Supabase error:', error.message);
      }
    } catch (err) {
      console.log('[birthday] error:', err?.message);
    } finally {
      setSaving(false);
      router.push('/avatar');
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
        <Text style={s.heading}>How old are you?</Text>
        <Text style={s.sub}>We need this for legal reasons, we promise that's it</Text>

        <View style={s.pickerContainer}>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            maximumDate={TODAY}
            onChange={(_, selected) => { if (selected) setDate(selected); }}
            style={s.picker}
            textColor={P.dark}
          />
        </View>

        {tooYoung && (
          <Text style={s.errorText}>breakup. is for users 17 and older</Text>
        )}

        <TouchableOpacity
          style={[s.btn, (tooYoung || saving) && s.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={tooYoung || saving}
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
  heading: { fontSize: 28, fontWeight: '800', color: P.dark, marginBottom: 10 },
  sub:     { fontSize: 15, color: P.mid, marginBottom: 28, lineHeight: 22 },

  pickerContainer: {
    backgroundColor: P.bg,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  picker: { width: '100%', height: 200, backgroundColor: P.bg },

  errorText: { color: P.red, fontSize: 14, fontWeight: '600', marginBottom: 16, textAlign: 'center' },

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
