// history, kept on the phone and nowhere else. the last hundred things
// the app read or wrote, so a good tag is never lost.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'meishi-nfc-history';

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addHistory(entry) {
  const list = [
    {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      when: Date.now(),
      ...entry,
    },
    ...(await loadHistory()),
  ].slice(0, 100);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  return list;
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
