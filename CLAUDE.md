# Prisha Tracker — notes for Claude

Read this first, then `TODO.md` (open work, grouped by area, with a Done log).
Project rules (TypeScript only, i18n for all strings, calculations stay pure, etc.) are in `.cursorrules`.

## What it is
Expo (SDK 54) + Expo Router app for tracking ימי פרישה / vesatot. iOS, Android and web from one codebase.
Firebase project `prisha-tracker`: Auth, Firestore, Hosting (https://prisha-tracker.web.app), Cloud Functions (admin features, not deployed yet).
Hebrew is the default language and fully RTL; English is LTR.
The owner is Yoel; the app has real users (around 43 accounts), so treat production data and rules with care.

## Commands
- Type check: `npx tsc --noEmit`
- Calculation tests: `npm test` (jest, `src/calculations/__tests__`)
- Security rules tests (Firestore emulator): `npm run test:rules` (`rules-tests/`). Run after any `firestore.rules` change.
- Local dev against emulators (never touches real data):
  - `npm run emulators` (Auth + Firestore emulators; start empty every time)
  - `npm run web:local -- --port 8090` and open http://localhost:8090
  - Beta gate code = `EXPO_PUBLIC_TESTER_CODE` in `.env`
  - Make a test account in the register screen; the usual one is `owner@test.local` / `localtest123`
- iPhone simulator: `npx expo start --ios --localhost --port 8095`
  (add `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1` for local data). Port 8090 on the LAN IP is taken by another program, so use `--localhost`.
- Web deploy: `npx expo export -p web && node scripts/copy-fonts.js && firebase deploy --only hosting`
- Rules deploy: `firebase deploy --only firestore:rules` (run `npm run test:rules` first)
- Push: git has no saved login on this Mac; use `git -c credential.helper= -c credential.helper='!gh auth git-credential' push origin main` (or run `gh auth setup-git` once).
- Don't run Metro with `CI=1` when you want edits picked up: CI mode disables file watching.

## How things work (non-obvious)
- RTL
  - Native: `I18nManager.forceRTL` + `app.json` `expo-localization` `supportsRTL`. Direction only applies after restart, so `src/i18n/index.ts` restarts the app once (`reloadAppAsync`, loop-guarded) when it doesn't match the language. Expo Go ignores runtime RTL (only `extra.forcesRTL` works there); test the real behavior in a dev build (`npx expo run:ios`).
  - Web: React Native Web ignores `I18nManager`. `src/components/common/WebDirectionRoot.tsx` sets `dir` on the app root (mirrors rows and resolves start/end styles); `public/index.html` starts as `he`/`rtl`; body gets `dir`/`lang`. Don't set attributes on `<html>` at runtime: NativeWind watches it and throws.
  - Use start/end styles, never left/right. Don't add manual `row-reverse` for RTL.
  - Text alignment: `textStartStyle()` for Text (in native RTL, RN swaps left/right on Text); `inputStartStyle()` / `useAlignStart()` for TextInputs. RN Web ignores the TextInput `textAlign` prop, so also pass it in `style`.
- Language: saved on the device (`app_language` in AsyncStorage) and restored at startup by `restoreSavedLanguage()` in `app/_layout.tsx`.
- Dates
  - Hebrew dates are always written in Hebrew letters (ה׳ חשון תשפ״ז), in both languages: `src/utils/hebrewDateFormat.ts`.
  - `src/components/calendar/HebrewMonthCalendar.tsx` is the month grid: pages by Hebrew month, both dates per day, Shabbat shaded, today outlined. Used by the main calendar (`CalendarView`) and as the date picker when adding/editing a period (`PeriodDatePicker`).
  - Don't use `HDate.add(n, 'M')` for month paging: it lands on the wrong month around Tishrei. Step by days (see `shiftMonth`).
- Vesatot calculations (`src/calculations`): the rules and the open questions are in `docs/חישובי-עונות-v1.docx` (the owner's spec); tests ב/ח/ה/ר/נ/ת in `__tests__` and `src/utils/__tests__` carry the same IDs. Calculations use the Hebrew date and onah only (`hebrewCalendar.ts`); the civil date is display-only. Show onot with `formatOnahDate` / `useOnahDateFormat` (a night starts the evening before). Old saved chumrot are migrated in `normalizeChumrot` (`chumrot.ts`).
- Onah times: sunset/sunrise come from `src/utils/zmanim.ts` (our own NOAA formula; `@hebcal/core` zmanim pull in `@hebcal/noaa`, whose top-level `await` the native app can't load). The place is per device in `zmanimLocationStore` (AsyncStorage only, never Firestore): a city from `src/constants/cities.ts` or the rounded device location. Calendar events and reminders use one run of consecutive onot (`vesetRuns`).
- Settings confirm saves one way: `useSettingsSaved()` (green toast; Save-button screens go back on the phone).
- Partner access: a partner (anonymous auth) is linked to the owner's invite by `partnerUid`; rules only grant couple data to that uid. `getPartnerAccessStatus()` sends unlinked sessions back to `/join`.
- Couple invites: looked up via `coupleInvites/{code}` (direct get), not a collection-group query.
- Switches: use `AppSwitch`, not `Switch`, so colors match everywhere.
- `react-native-worklets` is pinned to 0.5.1 (SDK 54). A newer version crashes Expo Go.

## Where things stand (update this when you finish a chunk of work)
- Last deployed web + pushed: the v1 calculations commit (see `git log`): rules per `docs/חישובי-עונות-v1.docx`, new chumrot settings with migration, one period per Hebrew date, unambiguous night display, night notifications fixed.
- Open: the questions in §10 of the v1 doc use interim behavior; calendar-sync events for a night onah are still all-day on the daytime's civil date (a day late for the evening).
- Not yet checked: Android; the new calendar on the iPhone simulator.
- Next steps: see `TODO.md`. The owner decides what to push and deploy; ask before pushing.
