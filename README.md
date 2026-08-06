# meishi nfc tools

Everything the paid tag apps sell, given away. Read a tag, write a tag,
erase it, copy it, lock it. No accounts, no ads, no pro tier; every
feature ships unlocked.

The app wears the meishi.shop cloth: the same five colours, the indigo
band top and bottom, the red rule under every heading, every word
lowercase, dark mode after sundown. Same storefront, different counter.

## What it does

- **read**: hold a tag to the phone. Serial number, tag type,
  technologies, memory, writability, and every record decoded: text,
  links, wi-fi networks, contacts, phone numbers, locations, apps,
  anything else as hex.
- **write**: compose any mix of records and write them in one pass:
  - text, url / link
  - wi-fi network (joins on tap; wpa/wpa2 or open)
  - contact (vcard), email, phone number, sms
  - location (coordinates), street address
  - social profile (instagram, x, tiktok, youtube, facebook, linkedin, github)
  - android app launcher, custom mime data
  A live byte count shows whether it fits the tag.
- **tools**: erase a tag, copy one tag to another, lock a tag read-only
  forever (with a warning; it is permanent).
- **history**: the last hundred reads and writes, kept on the phone and
  nowhere else. Nothing ever leaves the device.

## The stack

Expo SDK 57, React Native, `react-native-nfc-manager`. Plain JavaScript,
no navigation library, no state library; the whole app is a dozen small
files under `src/`.

NFC needs a native module, so the app does not run inside Expo Go. Use a
development build or a device build (below). iPhone 7 and newer, and any
Android phone with NFC, can read and write. Writing works with the
system scan sheet on iOS and by holding the tag on Android.

## Run it on your own phone

```
npm install
npx expo run:ios       # plugged-in iPhone, needs a mac with xcode
npx expo run:android   # plugged-in android phone
```

## Ship it to the app store

The only unavoidable cost is Apple's developer program (US$99/yr).
The build machinery below is free tier.

1. `npm install -g eas-cli` and `eas login` (free Expo account).
2. `eas build --platform ios --profile production`
   EAS asks for your Apple credentials the first time and manages the
   certificates itself. The NFC entitlement is added automatically by
   the `react-native-nfc-manager` config plugin in `app.json`.
3. `eas submit --platform ios`
   Sends the build to App Store Connect. From there it goes to
   TestFlight immediately, and to review when you press submit.
4. Android, same shape: `eas build --platform android --profile
   production`, then `eas submit --platform android` (Play Console
   one-time US$25).

Before building, set your own Apple team's bundle id in `app.json` if
`shop.meishi.nfctools` is taken in your account.

## Where things live

```
App.js                     the bands, the tabs, the mark
src/theme.js               the five colours, both faces
src/ui.js                  h1 with the red rule, buttons, rows, fields
src/nfc/nfc.js             the tag session: read, write, erase, lock
src/nfc/records.js         every record type and its form
src/nfc/parse.js           tag bytes back into words
src/nfc/bytes.js           utf-8 by hand, hex
src/store.js               history, on-device only
src/screens/               read, write, tools, history
```

## Not in this version

Tag password protection (NTAG `PWD_AUTH`) and the tasks/automation
system are the two headline features still on the bench. Both are
possible with the same library; they are roadmap, not paywall.
