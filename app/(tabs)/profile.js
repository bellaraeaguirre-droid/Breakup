import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarCustom, { AVATAR_DEFAULTS } from '../../components/AvatarCustom';

const P = {
  bg: '#F9F7FF',
  white: '#FFFFFF',
  red: '#E85D75',
  redPale: '#FFF0F3',
  mid: '#8E8E93',
  dark: '#1C1C1E',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatarConfig, setAvatarConfig] = useState({ ...AVATAR_DEFAULTS });

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [[, storedName], [, hs], [, hc], [, st], [, es], [, ms], [, ac]] =
          await AsyncStorage.multiGet([
            'userName',
            'avatarHairStyle', 'avatarHairColor', 'avatarSkinTone',
            'avatarEyeStyle', 'avatarMouthStyle', 'avatarAccessory',
          ]);
        if (storedName) setName(storedName);
        setAvatarConfig({
          hairStyle:  hs || AVATAR_DEFAULTS.hairStyle,
          hairColor:  hc || '#E85D75',
          skinTone:   st || '#FFD0DC',
          eyeStyle:   es || AVATAR_DEFAULTS.eyeStyle,
          mouthStyle: ms || AVATAR_DEFAULTS.mouthStyle,
          accessory:  ac || AVATAR_DEFAULTS.accessory,
        });
      }
      load().catch(() => {});
    }, []),
  );

  async function handleSignOut() {
    await AsyncStorage.clear();
    router.replace('/');
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.content}>
        <View style={s.avatarRing}>
          <AvatarCustom config={avatarConfig} size={120} />
        </View>
        {name ? <Text style={s.name}>{name}</Text> : null}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={s.signOutTxt}>Sign Out</Text>
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
  avatarRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: P.redPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: P.dark,
    fontFamily: SERIF,
    marginBottom: 44,
    letterSpacing: -0.5,
  },
  signOutBtn: {
    backgroundColor: P.red,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 52,
    shadowColor: P.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  signOutTxt: {
    color: P.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
