// the storefront's furniture, rebuilt as native pieces: the h1 with its
// red rule, the indigo button, the ghost button, the print-shop table row.
// every visible word renders lowercase; that is the house quirk.

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from './theme';

export function Screen({ children }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={styles.wrap}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

// h1: heavy, tight, with the 40x3 selvedge rule beneath
export function H1({ children }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.h1, { color: t.ink }]}>{children}</Text>
      <View style={{ width: 40, height: 3, backgroundColor: t.accent, marginTop: 8 }} />
    </View>
  );
}

export function H2({ children, style }) {
  const t = useTheme();
  return <Text style={[styles.h2, { color: t.ink }, style]}>{children}</Text>;
}

export function P({ children, style }) {
  const t = useTheme();
  return <Text style={[styles.p, { color: t.ink }, style]}>{children}</Text>;
}

export function Lede({ children }) {
  const t = useTheme();
  return <Text style={[styles.p, styles.lede, { color: t.ink }]}>{children}</Text>;
}

export function Note({ children, style }) {
  const t = useTheme();
  return <Text style={[styles.note, { color: t.faded }, style]}>{children}</Text>;
}

// buttons say what happens, and look like something worth pressing.
// the filled one wears the band; the ghost one is a 2px rule around air.
export function Btn({ label, onPress, ghost, disabled, style }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        ghost
          ? { borderWidth: 2, borderColor: t.ink, backgroundColor: 'transparent' }
          : { backgroundColor: t.band },
        styles.btn,
        pressed && { transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: ghost ? t.ink : t.cotton }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.fieldLabel, { color: t.ink }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.faded}
        multiline={!!multiline}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
        style={[
          styles.input,
          {
            color: t.ink,
            borderColor: t.line,
            backgroundColor: t.tint,
            minHeight: multiline ? 88 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );
}

// a row of choices, worn like the ghost button until picked,
// then it wears the band
export function Choice({ label, options, value, onChange }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.fieldLabel, { color: t.ink }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                on
                  ? { backgroundColor: t.band, borderColor: t.band }
                  : { borderColor: t.line },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={[styles.chipText, { color: on ? t.cotton : t.ink }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// a table row, set like a price list from a print shop:
// label left, value right, a hairline underneath
export function Row({ label, value, last }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: t.line, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={[styles.rowLabel, { color: t.ink }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: t.ink }]} selectable>
        {value}
      </Text>
    </View>
  );
}

// the table's top rule, 2px of ink, like border-top on the site's tables
export function TableTop() {
  const t = useTheme();
  return <View style={{ height: 2, backgroundColor: t.ink, marginTop: 4 }} />;
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 56,
    maxWidth: 576,
    width: '100%',
    alignSelf: 'center',
  },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  h2: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 28,
    marginBottom: 10,
  },
  p: {
    fontSize: 16,
    lineHeight: 25.6,
    marginBottom: 16,
  },
  lede: {
    fontSize: 18,
    lineHeight: 28,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  chip: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 9,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 15,
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
