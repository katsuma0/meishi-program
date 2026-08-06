// meishi nfc tools. the storefront's cloth, cut for a different job:
// reading and writing the tags themselves. everything here is free.

import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { initNfc, openNfcSettings } from './src/nfc/nfc';
import HistoryScreen from './src/screens/HistoryScreen';
import ReadScreen from './src/screens/ReadScreen';
import ToolsScreen from './src/screens/ToolsScreen';
import WriteScreen from './src/screens/WriteScreen';
import { useTheme } from './src/theme';

const TABS = [
  { key: 'read', label: 'read' },
  { key: 'write', label: 'write' },
  { key: 'tools', label: 'tools' },
  { key: 'history', label: 'history' },
];

export default function App() {
  const t = useTheme();
  const [tab, setTab] = useState('read');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    initNfc().then(setSupported);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.band }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ backgroundColor: t.band }} />

      {/* the header band: the same slim indigo bar as the storefront,
          the kanji mark at the left, the app's name beside it */}
      <View style={[styles.head, { backgroundColor: t.band }]}>
        <Text style={styles.kanji}>名刺</Text>
        <Text style={styles.wordmark}>nfc tools</Text>
        {!supported && Platform.OS === 'android' && (
          <Pressable onPress={openNfcSettings} style={{ marginLeft: 'auto' }} hitSlop={8}>
            <Text style={[styles.wordmark, { color: t.ply, fontSize: 14 }]}>nfc settings</Text>
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {/* every screen stays mounted so half-written record lists survive a tab switch */}
        <View style={{ flex: 1, display: tab === 'read' ? 'flex' : 'none' }}>
          <ReadScreen supported={supported} />
        </View>
        <View style={{ flex: 1, display: tab === 'write' ? 'flex' : 'none' }}>
          <WriteScreen supported={supported} />
        </View>
        <View style={{ flex: 1, display: tab === 'tools' ? 'flex' : 'none' }}>
          <ToolsScreen supported={supported} />
        </View>
        <View style={{ flex: 1, display: tab === 'history' ? 'flex' : 'none' }}>
          <HistoryScreen active={tab === 'history'} />
        </View>
      </View>

      {/* the bottom band hems the screen the way the indigo hems the site */}
      <View style={[styles.tabs, { backgroundColor: t.band }]}>
        {TABS.map(({ key, label }) => {
          const on = tab === key;
          return (
            <Pressable key={key} onPress={() => setTab(key)} style={styles.tab} hitSlop={4}>
              <Text
                style={[
                  styles.tabText,
                  { color: on ? t.cotton : 'rgba(242, 238, 228, 0.55)' },
                ]}
              >
                {label}
              </Text>
              <View
                style={{
                  width: 24,
                  height: 3,
                  marginTop: 4,
                  backgroundColor: on ? t.accent : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <SafeAreaView style={{ backgroundColor: t.band }} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 10,
    paddingBottom: 12,
  },
  kanji: {
    color: '#f2eee4',
    fontSize: 34,
    lineHeight: 36,
    fontFamily: Platform.OS === 'ios' ? 'Hiragino Mincho ProN' : 'serif',
  },
  wordmark: {
    color: '#f2eee4',
    fontSize: 17,
    fontWeight: '600',
    paddingBottom: 4,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
