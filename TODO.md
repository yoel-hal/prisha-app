# Prisha Tracker — To Do

## Security (do first)
- [ ] Revoke the old GitHub personal access token (`ghp_edKn…`) in GitHub → Settings → Developer settings → Personal access tokens
- [ ] Delete `users.json` (export of 43 real accounts with password hashes) or move it somewhere private
- [ ] Move the partner PIN check into a Cloud Function — today the PIN hash is readable by anyone with an unclaimed invite code, and a 4-digit PIN cracks instantly
- [ ] Tighten the couple invite window — any signed-in user who knows a couple ID can read the couple document (member IDs) while an invite is open
- [ ] Add Firebase App Check — anonymous sign-in is open, so anyone can create accounts and hit Firestore/Functions
- [ ] Validate data in the rules: period/settings fields and types, couple members can't be rewritten freely, an invite joiner can only add themselves

## Partners
- [ ] Tell existing `/join` partners to re-enter their code and PIN (they lost access with the new rules)
- [ ] Detect that case in the app (partner session saved but not linked) and send them back to `/join` instead of showing an empty screen

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

## Setup on this Mac
- [ ] Run `gh auth setup-git` once so `git push` works normally
- [ ] Archive the old `~/FamilyPurityApp/TaharatApp` project (superseded by this one)

## Done
- [x] Firestore partner-access rules fixed, tested in the emulator (`npm run test:rules`) and deployed (Oct 16, 2026)
- [x] Web app rebuilt and deployed to https://prisha-tracker.web.app
- [x] Commit `fe256e3` pushed to GitHub
- [x] Couple invite codes fixed: lookup now uses `coupleInvites/{code}` instead of a blocked collection-group query; rules tested and deployed
