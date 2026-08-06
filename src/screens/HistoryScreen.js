import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { clearHistory, loadHistory } from '../store';
import { useTheme } from '../theme';
import { Btn, H1, Lede, P, Screen } from '../ui';

function when(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryScreen({ active }) {
  const t = useTheme();
  const [list, setList] = useState([]);

  // refresh whenever the tab is shown
  const refresh = useCallback(() => {
    loadHistory().then(setList);
  }, []);
  React.useEffect(() => {
    if (active) refresh();
  }, [active, refresh]);

  async function clear() {
    await clearHistory();
    setList([]);
  }

  return (
    <Screen>
      <H1>history</H1>
      <Lede>the last hundred things this phone read or wrote. kept on the phone, nowhere else.</Lede>

      {list.length === 0 ? (
        <P>nothing yet. scan or write a tag and it lands here.</P>
      ) : (
        <>
          <View style={{ borderTopWidth: 2, borderTopColor: t.ink, marginTop: 8 }}>
            {list.map((entry) => (
              <View
                key={entry.id}
                style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.line }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: t.ink, fontWeight: '600', fontSize: 15 }}>{entry.kind}</Text>
                  <Text style={{ color: t.faded, fontSize: 13, fontVariant: ['tabular-nums'] }}>
                    {when(entry.when)}
                  </Text>
                </View>
                <Text style={{ color: t.ink, fontSize: 14, marginTop: 2 }} numberOfLines={3} selectable>
                  {entry.summary}
                </Text>
              </View>
            ))}
          </View>
          <Btn ghost label="clear history" onPress={clear} style={{ marginTop: 20 }} />
        </>
      )}
    </Screen>
  );
}
