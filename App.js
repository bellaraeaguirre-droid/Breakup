import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse, Rect, Polygon } from 'react-native-svg';

const P = {
  bg: "#F9F7FF",
  white: "#FFFFFF",
  red: "#E85D75",
  blue: "#5B9BD5",
  redPale: "#FFF0F3",
  bluePale: "#EEF5FF",
  dark: "#1C1C1E",
  mid: "#8E8E93",
  green: "#4CAF82",
};

export default function App() {
  const [selected, setSelected] = useState(null);

  const people = [
    {
      id: "me",
      name: "You",
      color: P.red,
      pale: P.redPale,
      screenTime: "4h 12m",
      streak: 12,
      Char: () => (
        <Svg width={90} height={110} viewBox="0 0 100 110" fill="none">
          <Ellipse cx="50" cy="88" rx="28" ry="18" fill="#FFB8C6"/>
          <Circle cx="50" cy="52" r="32" fill="#FFB8C6"/>
          <Ellipse cx="50" cy="24" rx="26" ry="12" fill="#E85D75"/>
          <Circle cx="40" cy="50" r="5" fill="#1C1C1E"/>
          <Circle cx="60" cy="50" r="5" fill="#1C1C1E"/>
          <Path d="M40 62 Q50 70 60 62" stroke="#1C1C1E" strokeWidth="3" fill="none"/>
        </Svg>
      ),
      activity: [
        { name: "Instagram", domain: "instagram.com", duration: "47m" },
        { name: "YouTube", domain: "youtube.com", duration: "38m" },
        { name: "TikTok", domain: "tiktok.com", duration: "29m" },
      ]
    },
    {
      id: "dylan",
      name: "Dylan",
      color: P.blue,
      pale: P.bluePale,
      screenTime: "3h 47m",
      streak: 12,
      Char: () => (
        <Svg width={90} height={110} viewBox="0 0 100 110" fill="none">
          <Ellipse cx="50" cy="90" rx="28" ry="17" fill="#A8D8EA"/>
          <Circle cx="50" cy="52" r="32" fill="#A8D8EA"/>
          <Ellipse cx="50" cy="23" rx="24" ry="11" fill="#1A5A7A"/>
          <Circle cx="40" cy="50" r="4" fill="#1C1C1E"/>
          <Circle cx="60" cy="50" r="4" fill="#1C1C1E"/>
          <Path d="M40 64 Q50 71 60 64" stroke="#1C1C1E" strokeWidth="3" fill="none"/>
        </Svg>
      ),
      activity: [
        { name: "Discord", domain: "discord.com", duration: "55m" },
        { name: "YouTube", domain: "youtube.com", duration: "42m" },
        { name: "Reddit", domain: "reddit.com", duration: "21m" },
      ]
    }
  ];

  const Icon = ({ domain, size = 36 }) => {
    const icons = {
      "instagram.com": <Svg width={size} height={size} viewBox="0 0 36 36" fill="none"><Rect width="36" height="36" rx="10" fill="#FFF0F5"/><Rect x="8" y="8" width="20" height="20" rx="6" stroke="#E8849A" strokeWidth="2.2"/><Circle cx="18" cy="18" r="5" stroke="#E8849A" strokeWidth="2.2"/><Circle cx="24.5" cy="11.5" r="1.3" fill="#E8849A"/></Svg>,
      "youtube.com": <Svg width={size} height={size} viewBox="0 0 36 36" fill="none"><Rect width="36" height="36" rx="10" fill="#FFF5F5"/><Rect x="5" y="11" width="26" height="16" rx="5" stroke="#FF8080" strokeWidth="2.2"/><Polygon points="15,14 15,24 24,19" fill="#FF8080"/></Svg>,
      "discord.com": <Svg width={size} height={size} viewBox="0 0 36 36" fill="none"><Rect width="36" height="36" rx="10" fill="#EEF0FF"/><Path d="M11 26 C11 26 9 10 14 9 C16 8.5 18 9 20 10 C22 9 24 8.5 26 9 C31 10 29 26 29 26 C29 26 26 28 22 28 L20 25 L16 25 L14 28 C10 28 11 26 11 26Z" stroke="#7B84E0" strokeWidth="2.2" fill="none"/><Circle cx="15" cy="17" r="2.2" fill="#7B84E0"/><Circle cx="21" cy="17" r="2.2" fill="#7B84E0"/></Svg>,
      "reddit.com": <Svg width={size} height={size} viewBox="0 0 36 36" fill="none"><Rect width="36" height="36" rx="10" fill="#FFF3EE"/><Circle cx="18" cy="20" r="8" stroke="#FF8C69" strokeWidth="2.2"/><Circle cx="14.5" cy="19" r="1.6" fill="#FF8C69"/><Circle cx="21.5" cy="19" r="1.6" fill="#FF8C69"/></Svg>,
    };
    return icons[domain] || <View style={{width: size, height: size, backgroundColor: '#ddd', borderRadius: 10}} />;
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => setSelected(null)} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.detail}>
          <selected.Char />
          <Text style={styles.detailName}>{selected.name}</Text>
          <Text style={styles.detailTime}>{selected.screenTime} today</Text>
          <Text style={{marginTop: 40, fontSize: 18, textAlign: 'center', color: '#666'}}>
            Full activity list coming next...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>breakup.</Text>
        <Text style={styles.tagline}>the app that keeps you together.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {people.map(p => (
          <TouchableOpacity key={p.id} style={styles.card} onPress={() => setSelected(p)}>
            <View style={[styles.charContainer, { backgroundColor: p.pale }]}>
              <p.Char />
            </View>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.time}>{p.screenTime}</Text>
            
            <View style={styles.streak}>
              <Text style={styles.streakText}>🔥 {p.streak} day streak</Text>
            </View>

            {/* Mini activity preview */}
            <View style={{ marginTop: 12 }}>
              {p.activity.map((item, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon domain={item.domain} size={20} />
                      <Text style={{ fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: P.mid }}>{item.duration}</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${70 + i * 10}%`, backgroundColor: p.color, borderRadius: 2 }} />
                  </View>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  logo: { fontSize: 48, fontWeight: '900', fontStyle: 'italic', color: P.red },
  tagline: { fontSize: 15, color: '#666', marginTop: 4 },
  scrollContent: { padding: 16, gap: 16 },
  card: {
    backgroundColor: P.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  charContainer: { alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 12 },
  name: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  time: { fontSize: 36, fontWeight: 'bold', color: P.red, textAlign: 'center', marginVertical: 8 },
  streak: { backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, alignSelf: 'center' },
  streakText: { color: '#D97706', fontWeight: '700' },
  back: { padding: 20 },
  backText: { fontSize: 20, color: P.red },
  detail: { flex: 1, alignItems: 'center', paddingTop: 60 },
  detailName: { fontSize: 32, fontWeight: '700', marginTop: 16 },
  detailTime: { fontSize: 24, color: '#666', marginTop: 8 },
});
