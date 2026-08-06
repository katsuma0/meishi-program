import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { buildMessage, RECORD_TYPES } from '../nfc/records';
import { cancelScan, isCancel, writeMessage } from '../nfc/nfc';
import { addHistory } from '../store';
import { useTheme } from '../theme';
import { Btn, Choice, Field, H1, H2, Lede, Note, P, Screen } from '../ui';

export default function WriteScreen({ supported }) {
  const t = useTheme();
  const [items, setItems] = useState([]);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(null); // record type being filled in
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  function startAdd(type) {
    const init = {};
    for (const f of type.fields) if (f.initial) init[f.key] = f.initial;
    setValues(init);
    setEditing(type);
    setPicking(false);
  }

  function confirmAdd() {
    try {
      const record = editing.build(values);
      setItems([...items, { type: editing, values, record, summary: editing.summary(values) }]);
      setEditing(null);
      setDone(false);
    } catch {
      setError('that record could not be built. check the fields.');
    }
  }

  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
    setDone(false);
  }

  let size = null;
  try {
    if (items.length) size = buildMessage(items).length;
  } catch {}

  async function write() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const bytes = buildMessage(items);
      await writeMessage(bytes);
      setDone(true);
      addHistory({
        kind: 'write',
        summary: items.map((it) => `${it.type.label}: ${it.summary}`.slice(0, 80)).join(' · '),
      });
    } catch (err) {
      if (!isCancel(err))
        setError('the write failed. the tag may be too small, locked, or moved too soon.');
    } finally {
      setBusy(false);
    }
  }

  const filled = editing
    ? editing.fields.every((f) => f.optional || f.choice || (values[f.key] || '').trim())
    : false;

  return (
    <Screen>
      <H1>write a tag</H1>
      <Lede>compose the records, then hold a tag to your phone.</Lede>

      {!supported && (
        <Note>this device has no nfc, or nfc is turned off. writing is disabled.</Note>
      )}

      {items.length > 0 && (
        <View style={{ borderTopWidth: 2, borderTopColor: t.ink, marginTop: 8, marginBottom: 4 }}>
          {items.map((it, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: t.line,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontWeight: '600', fontSize: 15 }}>{it.type.label}</Text>
                <Text style={{ color: t.faded, fontSize: 14 }} numberOfLines={2}>
                  {it.summary}
                </Text>
              </View>
              <Pressable onPress={() => removeItem(i)} hitSlop={8}>
                <Text style={{ color: t.accent, fontSize: 15, fontWeight: '600' }}>remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {size != null && <Note>about {size} bytes. a common ntag215 sticker holds 504.</Note>}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        <Btn ghost label="add a record" onPress={() => setPicking(true)} />
        {items.length > 0 &&
          (busy ? (
            <Btn ghost label="cancel" onPress={cancelScan} />
          ) : (
            <Btn label="write to tag" onPress={write} disabled={!supported} />
          ))}
      </View>

      {busy && <P style={{ marginTop: 16 }}>hold a tag to the back of your phone…</P>}
      {done && !busy && <P style={{ marginTop: 16 }}>written. the tag now carries {items.length === 1 ? 'the record' : `${items.length} records`}.</P>}
      {error && <Note style={{ marginTop: 16, color: t.accent }}>{error}</Note>}

      {/* the record type picker */}
      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, maxWidth: 576, width: '100%', alignSelf: 'center' }}>
            <H1>add a record</H1>
            <View style={{ borderTopWidth: 2, borderTopColor: t.ink }}>
              {RECORD_TYPES.map((rt) => (
                <Pressable
                  key={rt.key}
                  onPress={() => startAdd(rt)}
                  style={({ pressed }) => [
                    { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.line },
                    pressed && { backgroundColor: t.tint },
                  ]}
                >
                  <Text style={{ color: t.ink, fontWeight: '600', fontSize: 16 }}>{rt.label}</Text>
                  <Text style={{ color: t.faded, fontSize: 14 }}>{rt.hint}</Text>
                </Pressable>
              ))}
            </View>
            <Btn ghost label="cancel" onPress={() => setPicking(false)} style={{ marginTop: 20 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* the record form */}
      <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingTop: 60, maxWidth: 576, width: '100%', alignSelf: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            {editing && (
              <>
                <H1>{editing.label}</H1>
                <P>{editing.hint}.</P>
                {editing.fields.map((f) =>
                  f.choice ? (
                    <Choice
                      key={f.key}
                      label={f.label}
                      options={f.choice}
                      value={values[f.key] ?? f.initial}
                      onChange={(v) => setValues({ ...values, [f.key]: v })}
                    />
                  ) : (
                    <Field
                      key={f.key}
                      label={f.optional ? `${f.label} (optional)` : f.label}
                      value={values[f.key] || ''}
                      onChangeText={(v) => setValues({ ...values, [f.key]: v })}
                      placeholder={f.placeholder}
                      multiline={f.multiline}
                      keyboardType={f.keyboardType}
                      autoCapitalize={f.autoCapitalize}
                    />
                  )
                )}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Btn label="add" onPress={confirmAdd} disabled={!filled} />
                  <Btn ghost label="cancel" onPress={() => setEditing(null)} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}
