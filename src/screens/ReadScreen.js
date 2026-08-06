import React, { useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { decodeRecord, describeTag } from '../nfc/parse';
import { cancelScan, isCancel, readTag } from '../nfc/nfc';
import { addHistory } from '../store';
import { useTheme } from '../theme';
import { Btn, H1, H2, Lede, Note, P, Row, Screen, TableTop } from '../ui';

export default function ReadScreen({ supported }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function scan() {
    setBusy(true);
    setError(null);
    try {
      const { tag, status } = await readTag();
      const info = describeTag(tag, status);
      const records = (tag?.ndefMessage || []).map(decodeRecord);
      setResult({ info, records });
      addHistory({
        kind: 'read',
        summary: records.length
          ? records.map((r) => `${r.label}: ${r.value}`.slice(0, 80)).join(' · ')
          : 'empty tag',
        records,
      });
    } catch (err) {
      if (!isCancel(err)) setError('could not read the tag. hold it still and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>read a tag</H1>
      <Lede>hold a tag to your phone and everything on it appears here.</Lede>
      <P>nothing is sent anywhere. the tag is read on the phone and stays on the phone.</P>

      {!supported && (
        <Note>this device has no nfc, or nfc is turned off. reading is disabled.</Note>
      )}

      {busy ? (
        <View style={{ marginTop: 16, alignItems: 'flex-start', gap: 12 }}>
          {Platform.OS === 'android' && (
            <>
              <ActivityIndicator color={t.accent} />
              <P>hold a tag to the back of your phone…</P>
            </>
          )}
          <Btn ghost label="cancel" onPress={cancelScan} />
        </View>
      ) : (
        <Btn label={result ? 'scan again' : 'scan a tag'} onPress={scan} disabled={!supported} style={{ marginTop: 8 }} />
      )}

      {error && <Note style={{ marginTop: 16, color: t.accent }}>{error}</Note>}

      {result && !busy && (
        <>
          <H2>the tag</H2>
          <TableTop />
          {result.info.map((row, i) => (
            <Row key={row.label} label={row.label} value={row.value} last={i === result.info.length - 1} />
          ))}

          <H2>what it carries</H2>
          {result.records.length === 0 ? (
            <P>the tag is empty.</P>
          ) : (
            <>
              <TableTop />
              {result.records.map((r, i) => (
                <Row key={i} label={r.label} value={r.value} last={i === result.records.length - 1} />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
