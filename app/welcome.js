// Requires: npx expo install expo-web-browser
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Svg, { Circle, Path, Ellipse, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

let WebBrowser;
try { WebBrowser = require('expo-web-browser'); WebBrowser.maybeCompleteAuthSession(); } catch {}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const P = { bg: '#F9F7FF', red: '#E85D75', redPale: '#FFF0F3', mid: '#8E8E93', dark: '#1C1C1E', white: '#FFFFFF' };

function CoupleIllustration() {
  return (
    <Svg width={220} height={128} viewBox="0 0 220 128">
      {/* Left avatar background */}
      <Circle cx="60" cy="64" r="50" fill="#FFF0F3" />
      {/* Left body */}
      <Ellipse cx="60" cy="100" rx="24" ry="16" fill="#F2C4CE" />
      {/* Left head */}
      <Circle cx="60" cy="56" r="22" fill="#FFD0DC" />
      {/* Left hair (pink bun) */}
      <Ellipse cx="60" cy="40" rx="22" ry="12" fill="#E85D75" />
      <Circle cx="60" cy="24" r="13" fill="#E85D75" />
      {/* Left eyes */}
      <Circle cx="53" cy="53" r="3.2" fill="#1C1C1E" />
      <Circle cx="67" cy="53" r="3.2" fill="#1C1C1E" />
      <Circle cx="54" cy="51.5" r="1.2" fill="white" />
      <Circle cx="68" cy="51.5" r="1.2" fill="white" />
      {/* Left smile */}
      <Path d="M 53,62 Q 60,69 67,62" stroke="#1C1C1E" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Heart */}
      <Path
        d="M 110,60 C 110,49 96,43 96,54 C 96,63 110,73 110,73 C 110,73 124,63 124,54 C 124,43 110,49 110,60 Z"
        fill="#E85D75"
      />

      {/* Right avatar background */}
      <Circle cx="160" cy="64" r="50" fill="#EEF2FF" />
      {/* Right body */}
      <Ellipse cx="160" cy="100" rx="24" ry="16" fill="#C9D4F0" />
      {/* Right head */}
      <Circle cx="160" cy="56" r="22" fill="#FDDBB4" />
      {/* Right hair (brown short) */}
      <Ellipse cx="160" cy="40" rx="22" ry="11" fill="#8B4513" />
      <Rect x="138" y="49" width="9" height="15" rx="4.5" fill="#8B4513" />
      <Rect x="173" y="49" width="9" height="15" rx="4.5" fill="#8B4513" />
      {/* Right eyes */}
      <Circle cx="153" cy="53" r="3.2" fill="#1C1C1E" />
      <Circle cx="167" cy="53" r="3.2" fill="#1C1C1E" />
      <Circle cx="154" cy="51.5" r="1.2" fill="white" />
      <Circle cx="168" cy="51.5" r="1.2" fill="white" />
      {/* Right smile */}
      <Path d="M 153,62 Q 160,69 167,62" stroke="#1C1C1E" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!WebBrowser) {
      Alert.alert('Not available', 'Run: npx expo install expo-web-browser');
      return;
    }
    setGoogleLoading(true);
    try {
      const redirectTo = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error || new Error('No URL');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;

      const params = new URLSearchParams(
        result.url.includes('#')
          ? result.url.split('#')[1]
          : result.url.split('?')[1] || ''
      );
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError || !session) throw sessionError || new Error('No session');

        const userId = session.user.id;
        const { data: existing } = await supabase
          .from('users')
          .select('id, partner_id')
          .eq('id', userId)
          .single();

        await AsyncStorage.setItem('userId', userId);

        if (existing) {
          if (existing.partner_id) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/pairing');
          }
        } else {
          router.push('/name');
        }
      }
    } catch (err) {
      Alert.alert('Sign-in failed', err?.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.content}>
        <Text style={s.logo}>breakup.</Text>
        <Text style={s.tagline}>the app that keeps you together</Text>

        <View style={s.illustration}>
          <CoupleIllustration />
        </View>

        <View style={s.buttons}>
          <TouchableOpacity
            style={s.googleBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={P.white} />
            ) : (
              <>
                <Text style={s.googleIcon}>G</Text>
                <Text style={s.googleTxt}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.emailBtn}
            onPress={() => router.push('/signup')}
            activeOpacity={0.85}
          >
            <Text style={s.emailTxt}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.terms}>
          By continuing you agree to our Terms and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 48 },
  logo: {
    fontSize: 56,
    fontStyle: 'italic',
    color: P.red,
    fontFamily: SERIF,
    marginBottom: 8,
  },
  tagline: { fontSize: 15, fontStyle: 'italic', color: P.mid, marginBottom: 36 },
  illustration: { marginBottom: 44 },
  buttons: { width: '100%', gap: 14 },
  googleBtn: {
    backgroundColor: P.red,
    borderRadius: 18,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  googleIcon: { color: P.white, fontSize: 16, fontWeight: '800' },
  googleTxt: { color: P.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  emailBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: P.red,
    backgroundColor: P.redPale,
  },
  emailTxt: { color: P.red, fontSize: 16, fontWeight: '600' },
  terms: {
    fontSize: 12,
    color: P.mid,
    textAlign: 'center',
    marginTop: 'auto',
    paddingBottom: 12,
    paddingTop: 24,
  },
});
