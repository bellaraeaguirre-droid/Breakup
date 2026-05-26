import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 38, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(async () => {
      try {
        // Check Supabase session first, then AsyncStorage as fallback.
        const { data: { session } } = await supabase.auth.getSession();
        const sessionUserId = session?.user?.id ?? null;
        const storedUserId  = await AsyncStorage.getItem('userId');
        const userId        = sessionUserId || storedUserId;

        // Keep AsyncStorage in sync when the session was restored (e.g. after reinstall).
        if (sessionUserId && !storedUserId) {
          await AsyncStorage.setItem('userId', sessionUserId);
        }

        if (!userId) {
          router.replace('/welcome');
          return;
        }

        // Always read onboarding state from Supabase — never from cached AsyncStorage.
        const { data } = await supabase
          .from('users')
          .select('onboarding_complete, partner_id, name')
          .eq('id', userId)
          .single();

        const onboardingDone = data?.onboarding_complete === true;
        const hasPartner     = !!data?.partner_id;

        if (onboardingDone && hasPartner) {
          router.replace('/(tabs)/home');
        } else if (onboardingDone && !hasPartner) {
          router.replace('/pairing');
        } else if (data?.name) {
          // Has a name → completed the name screen; resume from there
          router.replace('/birthday');
        } else {
          // No name yet — start from the beginning of onboarding
          router.replace('/name');
        }
      } catch {
        router.replace('/welcome');
      }
    }, 2000);

    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.root}>
      <Animated.Text style={[s.logo, { opacity, transform: [{ scale }] }]}>
        breakup.
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 72, fontStyle: 'italic', color: '#E85D75', fontFamily: SERIF },
});
