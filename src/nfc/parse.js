// turning tag bytes back into words. every record a tag can carry is
// decoded to something readable; anything unknown falls back to hex.

import { toByteArray, toHex, utf8Decode } from './bytes';

// nfc forum uri prefix table, rtd uri
const URI_PREFIX = [
  '', 'http://www.', 'https://www.', 'http://', 'https://', 'tel:', 'mailto:',
  'ftp://anonymous:anonymous@', 'ftp://ftp.', 'ftps://', 'sftp://', 'smb://',
  'nfs://', 'ftp://', 'dav://', 'news:', 'telnet://', 'imap:', 'rtsp://',
  'urn:', 'pop:', 'sip:', 'sips:', 'tftp:', 'btspp://', 'btl2cap://',
  'btgoep://', 'tcpobex://', 'irdaobex://', 'file://', 'urn:epc:id:',
  'urn:epc:tag:', 'urn:epc:pat:', 'urn:epc:raw:', 'urn:epc:', 'urn:nfc:',
];

function decodeText(payload) {
  if (!payload.length) return '';
  const status = payload[0];
  const langLen = status & 0x3f;
  return utf8Decode(payload.slice(1 + langLen));
}

function decodeUri(payload) {
  if (!payload.length) return '';
  const prefix = URI_PREFIX[payload[0]] || '';
  return prefix + utf8Decode(payload.slice(1));
}

// pull the ssid out of a wi-fi simple config credential block
function decodeWifi(payload) {
  let i = 0;
  let ssid = '';
  const walk = (bytes) => {
    let j = 0;
    while (j + 4 <= bytes.length) {
      const type = (bytes[j] << 8) | bytes[j + 1];
      const len = (bytes[j + 2] << 8) | bytes[j + 3];
      const val = bytes.slice(j + 4, j + 4 + len);
      if (type === 0x100e) walk(val);
      if (type === 0x1045) ssid = utf8Decode(val);
      j += 4 + len;
    }
  };
  walk(payload.slice(i));
  return ssid ? `network "${ssid}"` : 'wi-fi credential';
}

export function decodeRecord(record) {
  const tnf = record.tnf;
  const type = utf8Decode(toByteArray(record.type));
  const payload = toByteArray(record.payload);

  if (tnf === 0 || (payload.length === 0 && !type)) {
    return { label: 'empty', value: 'no data' };
  }

  if (tnf === 1) {
    if (type === 'T') return { label: 'text', value: decodeText(payload) };
    if (type === 'U') return { label: uriLabel(decodeUri(payload)), value: decodeUri(payload) };
    if (type === 'Sp') return { label: 'smart poster', value: `${payload.length} bytes` };
    return { label: `well-known / ${type}`, value: toHex(payload) };
  }

  if (tnf === 2) {
    if (type === 'application/vnd.wfa.wsc') return { label: 'wi-fi', value: decodeWifi(payload) };
    if (type === 'text/vcard' || type === 'text/x-vcard')
      return { label: 'contact', value: utf8Decode(payload) };
    if (type.startsWith('text/') || type.includes('json') || type.includes('xml'))
      return { label: type, value: utf8Decode(payload) };
    return { label: type, value: `${payload.length} bytes: ${toHex(payload.slice(0, 24))}${payload.length > 24 ? '…' : ''}` };
  }

  if (tnf === 3) {
    return { label: 'absolute uri', value: utf8Decode(payload) || type };
  }

  if (tnf === 4) {
    if (type === 'android.com:pkg')
      return { label: 'android app', value: utf8Decode(payload) };
    return { label: type || 'external', value: utf8Decode(payload) || toHex(payload) };
  }

  return { label: `tnf ${tnf}`, value: toHex(payload) };
}

function uriLabel(uri) {
  if (uri.startsWith('tel:')) return 'phone';
  if (uri.startsWith('mailto:')) return 'email';
  if (uri.startsWith('sms:')) return 'sms';
  if (uri.startsWith('geo:')) return 'location';
  return 'url';
}

export function describeTag(tag, status) {
  const info = [];
  if (tag?.id) info.push({ label: 'serial number', value: typeof tag.id === 'string' ? tag.id : toHex(tag.id) });
  const type = tag?.type || tag?.ndefType;
  if (type) info.push({ label: 'tag type', value: String(type).toLowerCase() });
  if (Array.isArray(tag?.techTypes) && tag.techTypes.length) {
    info.push({
      label: 'technologies',
      value: tag.techTypes.map((s) => s.split('.').pop().toLowerCase()).join(', '),
    });
  }
  const capacity = tag?.maxSize ?? status?.capacity;
  if (capacity) info.push({ label: 'memory', value: `${capacity} bytes` });
  const used = Array.isArray(tag?.ndefMessage)
    ? tag.ndefMessage.reduce((n, r) => n + toByteArray(r.payload).length + toByteArray(r.type).length + 4, 0)
    : null;
  if (used != null && capacity) info.push({ label: 'used', value: `about ${used} bytes` });
  const writable = tag?.isWritable ?? (status ? status.status === 2 || status.status === 'ReadWrite' : undefined);
  if (writable !== undefined) info.push({ label: 'writable', value: writable ? 'yes' : 'no' });
  const records = Array.isArray(tag?.ndefMessage) ? tag.ndefMessage.length : 0;
  info.push({ label: 'records', value: String(records) });
  return info;
}
