import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const P = { bg: '#F9F7FF', red: '#E85D75', mid: '#8E8E93', white: '#FFFFFF', dark: '#1C1C1E' };
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

function generateCoupleCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);

    const coupleCode = generateCoupleCode();

    const { data, error } = await supabase
      .from('users')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), couple_code: coupleCode })
      .select('id')
      .single();

    if (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    await AsyncStorage.multiSet([
      ['userId', data.id],
      ['userName', name.trim()],
      ['coupleCode', coupleCode],
    ]);

    setLoading(false);
    router.push('/pairing');
  };

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !loading;

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.logo}>breakup.</Text>
          <Text style={s.heading}>Create your account</Text>

          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="Your name"
              placeholderTextColor={P.mid}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!loading}
            />
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor={P.mid}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              editable={!loading}
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={P.mid}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              editable={!loading}
            />

            <TouchableOpacity
              style={[s.btn, !canSubmit && s.btnDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!canSubmit}
            >
              {loading
                ? <ActivityIndicator color={P.white} />
                : <Text style={s.btnTxt}>Continue</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: P.red,
    fontFamily: SERIF,
    marginBottom: 36,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: P.dark,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  form: { width: '100%', gap: 14 },
  input: {
    backgroundColor: P.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: P.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  btn: {
    backgroundColor: P.red,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: P.white, fontSize: 17, fontWeight: '700' },
});
