import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

const P = {
  bg:       '#F9F7FF',
  white:    '#FFFFFF',
  red:      '#E85D75',
  redPale:  '#FFF0F3',
  dark:     '#1C1C1E',
  mid:      '#8E8E93',
  light:    '#E5E5EA',
  line:     '#F0EFF5',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

// ─── ICONS ────────────────────────────────────────────────────────────────────

function CrownIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 19h20M3 19l2-9 4.5 5L12 5l2.5 10L19 10l2 9"
        stroke="#FFB800" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ dimmed }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 8l3.5 3.5L13 5"
        stroke={dimmed ? P.mid : P.red}
        strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Partner overview cards',
  'Today\'s app activity',
  '7-day history',
];

const TRANSPARENT_FEATURES = [
  'Full browsing history',
  'Late night alerts',
  'New app detection',
  '30-day history',
  'Weekly Wrapped',
  'Couples leaderboard',
  '7-day free trial',
];

const PREMIUM_EXTRAS = [
  'Private browsing history',
  'Unlimited history',
  'AI weekly roast',
  'Honesty score',
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function FeatureRow({ text, dimmed = false }) {
  return (
    <View style={s.featureRow}>
      <CheckIcon dimmed={dimmed} />
      <Text style={[s.featureTxt, dimmed && s.featureTxtDim]}>{text}</Text>
    </View>
  );
}

function SubscribeBtn({ label, onPress }) {
  return (
    <TouchableOpacity style={s.subscribeBtn} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.subscribeTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const router = useRouter();

  function coming(tier) {
    Alert.alert('Coming Soon', `${tier} subscriptions are coming soon!`);
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>

        <View style={s.heroWrap}>
          <View style={s.crownCircle}>
            <CrownIcon />
          </View>
          <Text style={s.heroTitle}>breakup<Text style={{ color: P.red }}>+</Text></Text>
          <Text style={s.heroSub}>Full transparency for both of you</Text>
        </View>

        {/* ── Free tier ── */}
        <View style={[s.card, s.freeCard]}>
          <View style={s.cardHead}>
            <Text style={[s.tierName, s.tierNameDim]}>Free</Text>
            <View style={s.currentBadge}>
              <Text style={s.currentBadgeTxt}>Current plan</Text>
            </View>
          </View>
          <Text style={s.freePriceRow}>$0 <Text style={s.pricePer}>/ month</Text></Text>
          <View style={s.divider} />
          {FREE_FEATURES.map(f => <FeatureRow key={f} text={f} dimmed />)}
        </View>

        {/* ── Transparent tier ── */}
        <View style={[s.card, s.popularCard]}>
          <View style={s.popularBadge}>
            <Text style={s.popularBadgeTxt}>⭐  Most Popular</Text>
          </View>
          <View style={s.cardHead}>
            <Text style={s.tierName}>Transparent</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceAmt}>$3.99</Text>
            <Text style={s.pricePer}> / month</Text>
          </View>
          <View style={s.divider} />
          {TRANSPARENT_FEATURES.map(f => <FeatureRow key={f} text={f} />)}
          <SubscribeBtn label="Start 7-Day Free Trial" onPress={() => coming('Transparent')} />
        </View>

        {/* ── Nothing to Hide tier ── */}
        <View style={[s.card, s.premiumCard]}>
          <View style={s.cardHead}>
            <Text style={s.tierName}>Nothing to Hide</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceAmt}>$6.99</Text>
            <Text style={s.pricePer}> / month</Text>
          </View>
          <View style={s.divider} />
          <Text style={s.everythingLabel}>Everything in Transparent, plus:</Text>
          {PREMIUM_EXTRAS.map(f => <FeatureRow key={f} text={f} />)}
          <SubscribeBtn label="Subscribe" onPress={() => coming('Nothing to Hide')} />
        </View>

        <Text style={s.legal}>Cancel anytime · Billed monthly · Prices in USD</Text>
        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: P.bg },
  scroll: { paddingHorizontal: 18 },

  backBtn: { paddingTop: 8, paddingBottom: 4, alignSelf: 'flex-start' },
  backTxt: { fontSize: 17, fontWeight: '600', color: P.red },

  heroWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 28 },
  crownCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF8E6',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#FFB800', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  heroTitle: {
    fontSize: 38, fontWeight: '900', fontStyle: 'italic',
    color: P.dark, fontFamily: SERIF, marginBottom: 5,
  },
  heroSub: { fontSize: 14, color: P.mid, fontWeight: '500' },

  // ── Cards ──
  card: {
    backgroundColor: P.white,
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  freeCard: { opacity: 0.72 },
  popularCard: {
    borderWidth: 2,
    borderColor: P.red,
    shadowColor: P.red,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  premiumCard: {
    borderWidth: 1.5,
    borderColor: '#D5CCFF',
    shadowColor: '#7B5EA7',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },

  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: P.red,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 5,
    marginBottom: 12,
  },
  popularBadgeTxt: { color: P.white, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },

  cardHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  tierName: { fontSize: 21, fontWeight: '800', color: P.dark, fontFamily: SERIF },
  tierNameDim: { color: P.mid },

  currentBadge: {
    backgroundColor: P.light, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  currentBadgeTxt: { fontSize: 12, fontWeight: '600', color: P.mid },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  priceAmt: { fontSize: 30, fontWeight: '900', color: P.dark, fontFamily: SERIF },
  freePriceRow: { fontSize: 22, fontWeight: '700', color: P.mid, marginBottom: 16 },
  pricePer: { fontSize: 14, fontWeight: '500', color: P.mid },

  divider: { height: 1, backgroundColor: P.line, marginBottom: 14 },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  featureTxt: { fontSize: 14, fontWeight: '500', color: P.dark, flex: 1 },
  featureTxtDim: { color: P.mid },

  everythingLabel: {
    fontSize: 13, color: P.mid, fontWeight: '500',
    fontStyle: 'italic', marginBottom: 10,
  },

  subscribeBtn: {
    marginTop: 18, backgroundColor: P.red,
    borderRadius: 999, paddingVertical: 15,
    alignItems: 'center',
    shadowColor: P.red, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  subscribeTxt: { color: P.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  legal: { textAlign: 'center', fontSize: 11, color: P.mid, marginTop: 4 },
});
