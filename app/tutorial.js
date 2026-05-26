import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { width: W } = Dimensions.get('window');
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const CARDS = [
  {
    bg: '#E85D75',
    emoji: '👀',
    title: 'See everything',
    desc: 'See what your partner browses in real time. Full transparency, always.',
    darkText: false,
  },
  {
    bg: '#1C1C1E',
    emoji: '🔒',
    title: 'No secrets',
    desc: 'No hidden tabs. No secret apps. What they browse online, you see too.',
    darkText: false,
  },
  {
    bg: '#F5C842',
    emoji: '🔥',
    title: 'Stay honest',
    desc: 'Honesty is the foundation. This app helps you keep it, every day.',
    darkText: true,
  },
  {
    bg: '#F28FAD',
    emoji: '💕',
    title: 'Just between you two',
    desc: 'Your activity is private from everyone except your partner. Only you two.',
    darkText: false,
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const handleScroll = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / W);
    setIndex(page);
  };

  const goNext = () => {
    if (index < CARDS.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * W, animated: true });
    }
  };

  const skip = () => {
    scrollRef.current?.scrollTo({ x: (CARDS.length - 1) * W, animated: true });
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await supabase.from('users').update({ onboarding_complete: true }).eq('id', userId);
      }
      await AsyncStorage.setItem('onboarding_complete', 'true');
      router.replace('/(tabs)/home');
    } catch {
      router.replace('/(tabs)/home');
    }
  };

  const card = CARDS[index];
  const textColor = card.darkText ? '#1C1C1E' : '#FFFFFF';
  const isLast = index === CARDS.length - 1;

  return (
    <View style={[s.root, { backgroundColor: card.bg }]}>
      {/* Scrollable cards area */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={s.scroll}
      >
        {CARDS.map((c, i) => (
          <View key={i} style={[s.card, { width: W, backgroundColor: c.bg, paddingTop: insets.top + 20 }]}>
            <Text style={s.emoji}>{c.emoji}</Text>
            <Text style={[s.title, { color: c.darkText ? '#1C1C1E' : '#FFFFFF', fontFamily: SERIF }]}>
              {c.title}
            </Text>
            <Text style={[s.desc, { color: c.darkText ? '#1C1C1E' : '#FFFFFF', opacity: 0.88 }]}>
              {c.desc}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls: skip | dots | next */}
      <View style={[s.controls, { backgroundColor: card.bg, paddingBottom: insets.bottom + 20 }]}>
        {/* Skip */}
        <TouchableOpacity style={s.sideBtn} onPress={skip} activeOpacity={0.7} disabled={isLast}>
          {!isLast && <Text style={[s.skipTxt, { color: textColor, opacity: 0.7 }]}>Skip</Text>}
        </TouchableOpacity>

        {/* Dots */}
        <View style={s.dots}>
          {CARDS.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                { backgroundColor: textColor, opacity: i === index ? 1 : 0.35 },
                i === index && s.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next / Let's go */}
        <TouchableOpacity
          style={s.sideBtn}
          onPress={isLast ? handleFinish : goNext}
          activeOpacity={0.85}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : isLast ? (
            <Text style={[s.nextTxt, { color: textColor }]}>Go 🎉</Text>
          ) : (
            <Text style={[s.nextTxt, { color: textColor }]}>Next →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  card: {
    flex: 1,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  emoji: { fontSize: 86, marginBottom: 28 },
  title: { fontSize: 40, fontWeight: '700', fontStyle: 'italic', textAlign: 'center', marginBottom: 20, lineHeight: 48 },
  desc: { fontSize: 17, textAlign: 'center', lineHeight: 26 },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  sideBtn: { minWidth: 64, alignItems: 'center' },
  skipTxt: { fontSize: 16, fontWeight: '600' },
  nextTxt: { fontSize: 16, fontWeight: '700' },

  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
});
