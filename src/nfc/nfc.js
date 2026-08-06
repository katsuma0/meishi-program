// one thin wrapper around the tag session. every operation asks for the
// ndef technology, does its work, and always releases the session.

import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

// a single empty record: what "erase" means in ndef
const EMPTY_MESSAGE = [0xd0, 0x00, 0x00];

let started = false;

export async function initNfc() {
  try {
    const supported = await NfcManager.isSupported();
    if (supported && !started) {
      await NfcManager.start();
      started = true;
    }
    return supported;
  } catch {
    return false;
  }
}

export function isCancel(err) {
  const s = String(err?.message || err || '').toLowerCase();
  return s.includes('cancel') || s.includes('user');
}

export function cancelScan() {
  NfcManager.cancelTechnologyRequest().catch(() => {});
}

export async function openNfcSettings() {
  if (Platform.OS === 'android') {
    try {
      await NfcManager.goToNfcSetting();
    } catch {}
  }
}

async function withTag(alertMessage, fn) {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage });
    const result = await fn();
    if (Platform.OS === 'ios') {
      try {
        await NfcManager.setAlertMessageIOS('done.');
      } catch {}
    }
    return result;
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export function readTag() {
  return withTag('hold a tag to your phone', async () => {
    const tag = await NfcManager.getTag();
    let status = null;
    try {
      status = await NfcManager.ndefHandler.getNdefStatus();
    } catch {}
    return { tag, status };
  });
}

export function writeMessage(bytes) {
  return withTag('hold the tag to write', async () => {
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  });
}

export function eraseTag() {
  return writeMessage(EMPTY_MESSAGE);
}

export function lockTag() {
  return withTag('hold the tag to lock it', async () => {
    await NfcManager.ndefHandler.makeReadOnly();
  });
}

// re-encode a read tag's records so they can be written to another tag
export function encodeTagMessage(tag) {
  if (!Array.isArray(tag?.ndefMessage) || !tag.ndefMessage.length) return null;
  const records = tag.ndefMessage.map((r) =>
    Ndef.record(r.tnf, r.type || [], r.id || [], r.payload || [])
  );
  return Ndef.encodeMessage(records);
}
