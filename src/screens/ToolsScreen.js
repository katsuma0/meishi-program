import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { cancelScan, encodeTagMessage, eraseTag, isCancel, lockTag, readTag, writeMessage } from '../nfc/nfc';
import { addHistory } from '../store';
import { useTheme } from '../theme';
import { Btn, H1, H2, Lede, Note, P, Screen } from '../ui';

export default function ToolsScreen({ supported }) {
  const t = useTheme();
  const [busy, setBusy] = useState(null); // which tool is scanning
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(null); // captured message bytes

  function report(text) {
    setMsg(text);
  }

  async function run(name, fn, okText, historyKind, historySummary) {
    setBusy(name);
    setMsg(null);
    try {
      await fn();
      report(okText);
      if (historyKind) addHistory({ kind: historyKind, summary: historySummary });
    } catch (err) {
      if (!isCancel(err)) report('that did not work. hold the tag still and try again.');
    } finally {
      setBusy(null);
    }
  }

  const erase = () =>
    run('erase', eraseTag, 'erased. the tag is empty again.', 'erase', 'tag erased');

  const copyRead = () =>
    run('copyread', async () => {
      const { tag } = await readTag();
      const bytes = encodeTagMessage(tag);
      if (!bytes) throw new Error('empty');
      setCopied({ bytes, count: tag.ndefMessage.length });
    }, 'captured. now write it to another tag below.');

  const copyWrite = () =>
    run('copywrite', () => writeMessage(copied.bytes), 'copied. the second tag matches the first.', 'copy', `copied ${copied.count} record${copied.count === 1 ? '' : 's'}`);

  const lock = () => {
    Alert.alert(
      'lock this tag?',
      'locking is permanent. a locked tag can be read forever but never written again, by any app.',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'lock it',
          style: 'destructive',
          onPress: () => run('lock', lockTag, 'locked. the tag is read-only for good.', 'lock', 'tag locked'),
        },
      ]
    );
  };

  return (
    <Screen>
      <H1>tools</H1>
      <Lede>the rest of the toolbox. all of it free.</Lede>

      {!supported && (
        <Note>this device has no nfc, or nfc is turned off. the tools are disabled.</Note>
      )}

      {msg && <P style={{ marginTop: 8 }}>{msg}</P>}
      {busy && (
        <View style={{ marginBottom: 8 }}>
          <P>hold a tag to the back of your phone…</P>
          <Btn ghost label="cancel" onPress={cancelScan} />
        </View>
      )}

      <H2>erase</H2>
      <P>writes an empty record over whatever the tag carries. the tag itself survives and can be rewritten.</P>
      <Btn label="erase a tag" onPress={erase} disabled={!supported || !!busy} />

      <H2>copy</H2>
      <P>read one tag, then write the same records to another. good for duplicating a card before handing it out.</P>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Btn label="read the source" onPress={copyRead} disabled={!supported || !!busy} />
        {copied && (
          <Btn ghost label={`write the copy (${copied.count} record${copied.count === 1 ? '' : 's'})`} onPress={copyWrite} disabled={!supported || !!busy} />
        )}
      </View>

      <H2>lock</H2>
      <P>makes a tag read-only forever. do this after writing something that must never change, like a card that is leaving your hands.</P>
      <Note>this cannot be undone. not by this app, not by any app.</Note>
      <Btn ghost label="lock a tag" onPress={lock} disabled={!supported || !!busy} />
    </Screen>
  );
}
