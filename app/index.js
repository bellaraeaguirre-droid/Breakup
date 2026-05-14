import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const P = { bg: '#F9F7FF', red: '#E85D75', mid: '#8E8E93', white: '#FFFFFF' };
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.multiGet(['userId', 'partnerId']).then(([[, userId], [, partnerId]]) => {
      if (userId && partnerId) {
        router.replace('/home');
      } else if (userId) {
        router.replace('/pairing');
      }
      // no userId → stay on welcome
    });
  }, []);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.content}>
        <Text style={s.logo}>breakup.</Text>
        <Text style={s.tagline}>the app that keeps you together</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
          <Text style={s.btnTxt}>Get Started</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    fontStyle: 'italic',
    color: P.red,
    fontFamily: SERIF,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 16,
    color: P.mid,
    textAlign: 'center',
    marginBottom: 80,
  },
  btn: {
    backgroundColor: P.red,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 56,
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnTxt: {
    color: P.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
