# Prisha Tracker — To Do

## Now
- [ ] Decide the open questions in `docs/חישובי-עונות-v1.docx` §10 (Chabad, close sightings, kavuah both, Ohr Zarua on day 31 / haflaga, kavuah detection) and whether the app says "ask your rav"
- [ ] Calendar sync: a night onah is an all-day event on the daytime's civil date; it starts the evening before
- [ ] Test the new calendar, settings and night display on the iPhone simulator

## Security (do first)
- [ ] Revoke the old GitHub personal access token (`ghp_edKn…`) in GitHub → Settings → Developer settings → Personal access tokens
- [ ] Delete `users.json` (export of 43 real accounts with password hashes) or move it somewhere private
- [ ] Move the partner PIN check into a Cloud Function — today the PIN hash is readable by anyone with an unclaimed invite code, and a 4-digit PIN cracks instantly
- [ ] Tighten the couple invite window — any signed-in user who knows a couple ID can read the couple document (member IDs) while an invite is open

## Partners
- [ ] Tell existing `/join` partners to re-enter their code and PIN (they lost access with the new rules)

## Admin panel / Cloud Functions
- [ ] Add missing values to `functions/.env`: `SENDGRID_API_KEY`, `SUPPORT_FROM_EMAIL`, `ADMIN_PIN_HASH` (and remove the duplicate `ADMIN_UID` line)
- [ ] Consider Secret Manager (`defineSecret`) instead of `.env` for the SendGrid key
- [ ] Make sure the project is on the Blaze plan (needed for the scheduled `aggregateStats` function)
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Set the admin claim on your account: `functions/scripts/setAdminClaim.ts`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Test the admin panel end to end (stats, broadcast, banner, support inbox)

## App
- [ ] Yereim minhag: `src/calculations/minhagim/yireim.ts` is empty and not in the registry — implement or drop it from the plan
- [ ] Remove or fill the empty placeholder files (`DayCell`, `VesetBadge`, `Button`, `Card`, `Modal`, `useAuth`, `useHebcal`, `coupleStore`, `calendarUtils`, `dateUtils`, `notificationUtils`)
- [ ] Write the docs in `docs/` (all four files are empty)

## Structure
- [ ] Split `src/firebase/firestore.ts` (1,200 lines) by area: users, couples, invites, partner, periods, account deletion
- [ ] Move Firebase calls out of screens into hooks (8 screens import Firebase directly, against the project rule)
- [ ] Break up the biggest screens, e.g. `settings/couple.tsx` (750 lines)
- [ ] Add an ESLint config and a `lint` script
- [ ] Add tests beyond the calculations: hooks and the Firestore helpers
- [ ] Move the last hard-coded strings into i18n (`join.tsx` logo, Buy Me a Coffee label)

## App (native)
- [ ] Check Android in an emulator (RTL, layout) — only iOS was checked
- [ ] Check the new calendar and date picker on the iPhone simulator
- [ ] Language switching on phones restarts the app once to flip direction; Expo Go can't show this (it ignores runtime RTL), so verify it in a development build
- [ ] Update Expo packages to the versions SDK 54 expects (`npx expo install --check`)

## Later
- [ ] Firebase App Check — guards against bots and cost abuse, not data access (the rules do that). Web code is ready (`EXPO_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY`); can't be enforced until the phones move to the native Firebase SDK. Revisit if usage graphs show abuse

## Setup on this Mac
- [ ] Run `gh auth setup-git` once so `git push` works normally
- [ ] Archive the old `~/FamilyPurityApp/TaharatApp` project (superseded by this one)

## Done
- [x] v1 calculations: onah beinonit from the latest period only, Ohr Zarua / Kreisi uPleisi / Chavot Daat settings, short-month rule, kavuah, Hebrew-only ordering, one period per Hebrew date, duplicate-in-list fix, night shown as the evening it starts, night notifications a day late fixed
- [x] Add-period form resets after saving
- [x] Firestore partner-access rules fixed, tested in the emulator (`npm run test:rules`) and deployed (Oct 16, 2026)
- [x] Web app rebuilt and deployed to https://prisha-tracker.web.app
- [x] Commit `fe256e3` pushed to GitHub
- [x] Couple invite codes fixed: lookup now uses `coupleInvites/{code}` instead of a blocked collection-group query; rules tested and deployed
- [x] Data validation in the rules: periods, settings, couple membership changes and invite docs; batch creation uses `getAfter` (32 rule tests)
- [x] Account deletion fixed: rule for legacy `couples/{id}/invites` so a sole member can delete their couple (deletion flow covered by rule tests)
- [x] Partners whose saved session isn't linked are sent to `/join` with a reconnect message (at startup and when the app resumes)
- [x] RTL and layout pass on web (phone + desktop) and iPhone: proper web RTL, Hebrew calendar and date picker, sections/cards, consistent switches, language saved across restarts, onboarding reload bugs, Expo Go crash (worklets version)
- [x] Hebrew dates in Hebrew letters everywhere (ה׳ חשון תשפ״ז); calendar pages by Hebrew month with both dates per day; add/edit period uses the same calendar as its date picker (deployed, `c4b3bf5`)
- [x] Preview "Edit" returns to the add-period form instead of the calendar (`bd12df6`, local only)
- [x] `CLAUDE.md` handoff notes for new chats
