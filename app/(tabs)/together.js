import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import Svg, { Path } from 'react-native-svg';

const P = {
  bg: '#F9F7FF',
  white: '#FFFFFF',
  red: '#E85D75',
  redPale: '#FFF0F3',
  mid: '#8E8E93',
  dark: '#1C1C1E',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

function BigHeart() {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24">
      <Path
        d="M12 21C12 21 3 15.5 3 9.5C3 7 5 5 7.5 5C9.5 5 11 6.5 12 8C13 6.5 14.5 5 16.5 5C19 5 21 7 21 9.5C21 15.5 12 21 12 21Z"
        fill={P.red}
      />
    </Svg>
  );
}

export default function TogetherScreen() {
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function loadNames() {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        const { data: myRow } = await supabase
          .from('users')
          .select('name, partner_id')
          .eq('id', userId)
          .single();
        if (!myRow) return;
        if (myRow.name) setMyName(myRow.name);
        if (myRow.partner_id) {
          const { data: pRow } = await supabase
            .from('users')
            .select('name')
            .eq('id', myRow.partner_id)
            .single();
          if (pRow?.name) setPartnerName(pRow.name);
        }
      }
      loadNames().catch(() => {});
    }, []),
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {(myName || partnerName) ? (
        <View style={s.namesRow}>
          {myName ? <Text style={s.nameText}>{myName}</Text> : null}
          {myName && partnerName ? <Text style={s.amp}>&</Text> : null}
          {partnerName ? <Text style={s.nameText}>{partnerName}</Text> : null}
        </View>
      ) : null}

      <View style={s.center}>
        <View style={s.card}>
          <View style={s.heartWrap}>
            <BigHeart />
          </View>
          <Text style={s.cardTitle}>Together Score</Text>
          <Text style={s.cardSub}>coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  namesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: P.dark,
    fontFamily: SERIF,
  },
  amp: {
    fontSize: 18,
    color: P.red,
    fontWeight: '700',
    fontFamily: SERIF,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: P.white,
    borderRadius: 28,
    paddingVertical: 44,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  heartWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: P.redPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.dark,
    fontFamily: SERIF,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardSub: {
    fontSize: 15,
    color: P.mid,
    fontWeight: '500',
  },
});
