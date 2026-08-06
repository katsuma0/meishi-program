// every record type nfc tools sells, given away here.
// each entry declares its form fields, how to build the ndef record,
// and the one-line summary shown in the write list.

import { Ndef } from 'react-native-nfc-manager';
import { utf8Encode } from './bytes';

function normalizeUrl(url) {
  const u = (url || '').trim();
  if (!u) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
  return 'https://' + u;
}

function enc(s) {
  return encodeURIComponent(s || '');
}

// wi-fi simple config: the credential tlv block, the same bytes the
// official app writes, carried as application/vnd.wfa.wsc
function be16(n) {
  return [(n >> 8) & 0xff, n & 0xff];
}

function tlv(type, valueBytes) {
  return [...be16(type), ...be16(valueBytes.length), ...valueBytes];
}

function wifiPayload({ ssid, password, auth }) {
  const open = auth === 'open';
  const cred = [
    ...tlv(0x1026, [0x01]), // network index
    ...tlv(0x1045, utf8Encode(ssid || '')), // ssid
    ...tlv(0x1003, be16(open ? 0x0001 : 0x0020)), // auth: open or wpa2 personal
    ...tlv(0x100f, be16(open ? 0x0001 : 0x0008)), // encryption: none or aes
    ...tlv(0x1027, utf8Encode(open ? '' : password || '')), // network key
    ...tlv(0x1020, [0xff, 0xff, 0xff, 0xff, 0xff, 0xff]), // any mac
  ];
  return tlv(0x100e, cred);
}

function vcardText(v) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const first = (v.first || '').trim();
  const last = (v.last || '').trim();
  lines.push(`N:${last};${first};;;`);
  lines.push(`FN:${[first, last].filter(Boolean).join(' ')}`);
  if (v.company) lines.push(`ORG:${v.company}`);
  if (v.title) lines.push(`TITLE:${v.title}`);
  if (v.phone) lines.push(`TEL;TYPE=CELL:${v.phone}`);
  if (v.email) lines.push(`EMAIL:${v.email}`);
  if (v.website) lines.push(`URL:${normalizeUrl(v.website)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

const SOCIAL = [
  { label: 'instagram', value: 'https://instagram.com/' },
  { label: 'x', value: 'https://x.com/' },
  { label: 'tiktok', value: 'https://tiktok.com/@' },
  { label: 'youtube', value: 'https://youtube.com/@' },
  { label: 'facebook', value: 'https://facebook.com/' },
  { label: 'linkedin', value: 'https://linkedin.com/in/' },
  { label: 'github', value: 'https://github.com/' },
];

export const RECORD_TYPES = [
  {
    key: 'text',
    label: 'text',
    hint: 'a plain note, any language',
    fields: [{ key: 'text', label: 'content', placeholder: 'hello', multiline: true }],
    build: (v) => Ndef.textRecord(v.text || '', 'en'),
    summary: (v) => v.text || '',
  },
  {
    key: 'url',
    label: 'url / link',
    hint: 'opens in the browser on tap',
    fields: [{ key: 'url', label: 'address', placeholder: 'https://meishi.shop', keyboardType: 'url' }],
    build: (v) => Ndef.uriRecord(normalizeUrl(v.url)),
    summary: (v) => normalizeUrl(v.url),
  },
  {
    key: 'wifi',
    label: 'wi-fi network',
    hint: 'joins the network on tap',
    fields: [
      { key: 'ssid', label: 'network name (ssid)', placeholder: 'shopwifi' },
      { key: 'password', label: 'password', placeholder: '' },
      {
        key: 'auth',
        label: 'security',
        choice: [
          { label: 'wpa / wpa2', value: 'wpa2' },
          { label: 'open', value: 'open' },
        ],
        initial: 'wpa2',
      },
    ],
    build: (v) => Ndef.record(Ndef.TNF_MIME_MEDIA, 'application/vnd.wfa.wsc', [], wifiPayload(v)),
    summary: (v) => v.ssid || '',
  },
  {
    key: 'contact',
    label: 'contact (vcard)',
    hint: 'a business card in the tag',
    fields: [
      { key: 'first', label: 'first name', placeholder: 'katsuma', autoCapitalize: 'words' },
      { key: 'last', label: 'last name', placeholder: 'onishi', autoCapitalize: 'words' },
      { key: 'phone', label: 'phone', placeholder: '+1 647 000 0000', keyboardType: 'phone-pad' },
      { key: 'email', label: 'email', placeholder: 'you@example.com', keyboardType: 'email-address' },
      { key: 'company', label: 'company', placeholder: '', optional: true },
      { key: 'title', label: 'job title', placeholder: '', optional: true },
      { key: 'website', label: 'website', placeholder: '', optional: true, keyboardType: 'url' },
    ],
    build: (v) => Ndef.record(Ndef.TNF_MIME_MEDIA, 'text/vcard', [], utf8Encode(vcardText(v))),
    summary: (v) => [v.first, v.last].filter(Boolean).join(' '),
  },
  {
    key: 'email',
    label: 'email',
    hint: 'opens a draft on tap',
    fields: [
      { key: 'to', label: 'to', placeholder: 'you@example.com', keyboardType: 'email-address' },
      { key: 'subject', label: 'subject', placeholder: '', optional: true },
      { key: 'body', label: 'message', placeholder: '', optional: true, multiline: true },
    ],
    build: (v) => {
      const q = [];
      if (v.subject) q.push('subject=' + enc(v.subject));
      if (v.body) q.push('body=' + enc(v.body));
      return Ndef.uriRecord('mailto:' + (v.to || '') + (q.length ? '?' + q.join('&') : ''));
    },
    summary: (v) => v.to || '',
  },
  {
    key: 'phone',
    label: 'phone number',
    hint: 'dials on tap',
    fields: [{ key: 'number', label: 'number', placeholder: '+1 647 000 0000', keyboardType: 'phone-pad' }],
    build: (v) => Ndef.uriRecord('tel:' + (v.number || '').replace(/[^\d+]/g, '')),
    summary: (v) => v.number || '',
  },
  {
    key: 'sms',
    label: 'sms',
    hint: 'opens a text message on tap',
    fields: [
      { key: 'number', label: 'number', placeholder: '+1 647 000 0000', keyboardType: 'phone-pad' },
      { key: 'body', label: 'message', placeholder: '', optional: true, multiline: true },
    ],
    build: (v) =>
      Ndef.uriRecord(
        'sms:' + (v.number || '').replace(/[^\d+]/g, '') + (v.body ? '?body=' + enc(v.body) : '')
      ),
    summary: (v) => v.number || '',
  },
  {
    key: 'location',
    label: 'location',
    hint: 'opens the map on tap',
    fields: [
      { key: 'lat', label: 'latitude', placeholder: '43.8561', keyboardType: 'numbers-and-punctuation' },
      { key: 'lng', label: 'longitude', placeholder: '-79.3370', keyboardType: 'numbers-and-punctuation' },
    ],
    build: (v) => Ndef.uriRecord(`geo:${(v.lat || '').trim()},${(v.lng || '').trim()}`),
    summary: (v) => `${v.lat}, ${v.lng}`,
  },
  {
    key: 'address',
    label: 'street address',
    hint: 'searched on the map on tap',
    fields: [{ key: 'address', label: 'address', placeholder: 'markham, ontario', multiline: true, autoCapitalize: 'words' }],
    build: (v) => Ndef.uriRecord('geo:0,0?q=' + enc((v.address || '').trim())),
    summary: (v) => v.address || '',
  },
  {
    key: 'social',
    label: 'social profile',
    hint: 'opens the profile on tap',
    fields: [
      { key: 'network', label: 'network', choice: SOCIAL, initial: SOCIAL[0].value },
      { key: 'handle', label: 'handle', placeholder: 'meishi' },
    ],
    build: (v) => Ndef.uriRecord((v.network || SOCIAL[0].value) + (v.handle || '').replace(/^@/, '')),
    summary: (v) => '@' + (v.handle || '').replace(/^@/, ''),
  },
  {
    key: 'app',
    label: 'android app',
    hint: 'launches the app on android phones',
    fields: [{ key: 'package', label: 'package name', placeholder: 'com.example.app' }],
    build: (v) => Ndef.androidApplicationRecord((v.package || '').trim()),
    summary: (v) => v.package || '',
  },
  {
    key: 'custom',
    label: 'custom data',
    hint: 'any mime type, any payload',
    fields: [
      { key: 'mime', label: 'mime type', placeholder: 'application/json' },
      { key: 'content', label: 'content', placeholder: '', multiline: true },
    ],
    build: (v) =>
      Ndef.record(Ndef.TNF_MIME_MEDIA, (v.mime || 'text/plain').trim(), [], utf8Encode(v.content || '')),
    summary: (v) => v.mime || '',
  },
];

export function buildMessage(items) {
  return Ndef.encodeMessage(items.map((it) => it.record));
}
