# Development log

This file records completed development work. Keep the newest entry at the top
and follow `templates/development-log-entry.md`.

## 2026-10-13 - Configure LAN API access for Expo Go

### Summary

- Replaced the local FE localhost API URL with the PC Wi-Fi address
  `http://10.87.28.73:3000/api`; localhost on a phone addresses the phone itself.
- Set BE `HOST=0.0.0.0` and added the LAN Expo web origin to the CORS allowlist.

### Files changed

- FE `.env.local` and BE `.env` (ignored local configuration).
- `docs/DEVELOPMENT_LOG.md`.

### Verification

- LAN `/api/health`: HTTP 200, `status: ok`, with matching LAN Expo CORS origin.
- FE typecheck and lint: Passed.
- Expo Doctor: 20/21 passed; existing installed Expo 57.0.25 versus expected
  ~57.0.28 mismatch remains.
- Running Expo bundle still has the old URL; Expo restart required.

### Remaining work

- Restart Expo and scan its QR again. Confirm phone access to the LAN health URL;
  phone connectivity/firewall cannot be verified from this PC.
- Update the local URL if the PC Wi-Fi IP changes.

## 2026-10-13 - Restore local Expo web API connectivity

### Summary

- Confirmed the API was healthy, but Expo web defaulted to `/api` on port 8081
  without a local environment file; that URL returned Expo HTML instead of API JSON.
- Set the local FE API URL to `http://localhost:3000/api` and allowed Expo localhost
  origins in the BE environment. Restarted Expo to load the environment.

### Files changed

- FE `.env.local` and BE `.env` (local ignored configuration).
- `docs/DEVELOPMENT_LOG.md`.

### Verification

- API health: HTTP 200 with `status: ok` and matching Expo CORS origin.
- Login OPTIONS: HTTP 204 with matching CORS origin; empty login POST: HTTP 400
  with API validation JSON and matching CORS origin.
- FE `npm.cmd run typecheck` and `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: 20/21 passed; installed Expo 57.0.25 differs from
  the declared/expected ~57.0.28. Dependencies left unchanged in this configuration fix.

### Remaining work

- Browser reload required. Physical devices need a LAN API URL and a BE LAN bind.
- Existing Expo patch mismatch remains.

## 2026-10-13 - Add remote demo photos, ten members and populated activity groups

### Summary

- Curated/verified external photos for all 20 activities; replaced API activity local
  fallback images with remote URLs. Added stock avatars/covers to all demo profiles.
- Added ten complete fictional users (14 total) with names, birth dates, locations,
  bios, interests, languages, occupations and voluntary preferences.
- Enriched existing demo records: 59 approved memberships and 20 pending requests;
  each group has 3–5 people including host. Reruns preserve decisions/removals.
- Added profile cover rendering, real member avatars and public-profile modal.
  Public profile excludes private fields. Restricted CSP now allows chosen image hosts.

### Files changed

- BE `src/database/{demo-media,demo-data,seed-demo}.js`, `src/app.js`, profile/activity routes.
- BE profile, join-request and demo tests; demo/profile docs.
- FE `src/services/{activityApi,profileService}.ts`, `ProfileViews.tsx`, `MembershipViews.tsx`.
- FE `src/components/MemberProfileModal.tsx`, README and decision/development logs.

### Verification

- BE `npm test`: Passed 57/57, including media/roster consistency, no duplicate
  membership, preference compatibility, public-profile privacy and seed rerun after leave.
- FE typecheck/lint/integration: Passed; Expo Doctor passed 21/21.
- Expo web export: Passed; diff checks passed in both repositories.
- HTTP image checks: Selected Unsplash URLs and all 14 distinct avatar URLs return
  200/image MIME. Contact sheet visually reviewed; badminton, picnic and TP.HCM
  photos corrected to match the respective topics.
- Actual DB verification: 14 complete profiles, 20 remote activity images,
  59 approved memberships, 20 pending, consistent counts and group sizes 3/4/5.
- Browser: member1 login, profile cover/avatar loaded remotely; joined group showed
  real member avatars; clicking Hoàng Nam opened real profile with loaded remote cover/avatar.

### Remaining work

- External providers/network can affect image availability; no offline local image fallback.
- Physical-device QA not run. Broader prototype features remain as previously recorded.

## 2026-10-13 - Complete signup, scheduling, activity creation and profiles; seed TP.HCM demo

### Summary

- Relaxed all password creation/reset/change checks to 6–128 characters; verification
  issues a session and FE enters the app immediately. Removed the third OTP box highlight.
- Added shared calendar and time selectors, retaining morning/afternoon/evening and
  offering 15-minute slots plus manual exact time. Match submits precise date/time filters.
- Added minimum/maximum group size and collapsed advanced requirements for gender,
  language, religion, alcohol and dress code; persisted and validated across FE/BE.
- Added per-step creation validation, free activity handling, synchronized category
  contracts and requirement summaries. BE checks profile requirements on join.
- Replaced own-profile mock screens with real profile fetching, saving and avatar
  upload; added completion state and an optional reminder when entering the app.
- Seeded 20 fictional upcoming TP.HCM activities and four demo accounts into the
  configured database. Reruns are insert-only and preserve existing records.

### Files changed

- `App.tsx`, auth/verification, MainApp, Filter/Create/ActivityDetail and profile screens.
- `src/components/{DateTimeField,ActivityChoices,CreateGroupFields}.tsx`, home/match UI.
- `src/services/{api,activityApi,activityService,filterService,profileService}.ts`, `ProfileContext.tsx`.
- `tests/backend.integration.cjs`, README, development/decision logs.
- BE: auth/profile/activity routes and validation, activity repository, preference helpers,
  demo seeder, package script, API docs/Postman and auth/profile/demo test suites.

### Verification

- FE `npm run typecheck`, `npm run lint`: Passed.
- `npx expo-doctor`: Passed 21/21 checks.
- BE `npm test`: Passed 57/57 tests, including six-character passwords, auto-login,
  completion, voluntary preferences, precise Vietnam date/time filters and idempotent seeding.
- FE `npm run test:integration`: Passed actual service-to-Express/MongoDB flow,
  including short-password signup, automatic verification login, profile save and restricted joins.
- Expo web export: Passed.
- Playwright: real demo login showed completion reminder; saving profile persisted
  complete state. Chose calendar date/time, created a 3–8-member activity with gender,
  language and dress code (201); removed test activity afterward (204).
  Date 14/10/2026 and 09:00–09:15 Match filter returned the expected one demo activity (200).
- Actual `npm run db:seed-demo`: Created 20 activities. Browser test reset the demo
  participant's basic fields afterward so the completion reminder remains demoable.
- `git diff --check`: Passed both repositories.

### Remaining work

- Physical-device QA and live Cloudinary upload QA not run; avatar provider behavior
  covered by BE tests. One cover image supported. Payment transactions, chat/messages,
  general notifications, ratings and activity progress UI remain outside this task.
- Persistent FE sessions, GPS-based distance filtering and Google/Apple UI remain unimplemented.
- Existing upstream dependency audit advisories remain as recorded in the preceding entry.

## 2026-10-13 - Connect activity requests and group membership to BE

### Summary

- Replaced mock login with email authentication/verification and password recovery.
  Added Bearer API client, timeout, 401 handling and Expo environment configuration.
- Connected Home/Match, creation, pending/joined/hosted lists, host decisions,
  members, cancellation, leaving and removal with error states and refresh.
- Updated BE CORS for Expo and validated/persisted creation funding and deadlines.
  Cleaned duplicate MongoDB configuration locally, preserving the effective URI.
- Updated Expo to 57.0.28 and applied compatible npm audit fixes.

### Files changed

- `.env.example`, `package.json`, `package-lock.json`, `App.tsx`, `README.md`.
- `src/services/{api,activityApi,activityService,useRemote}.ts`.
- `src/components/RemoteState.tsx`, `src/data/activities.ts`.
- Auth/VerifyEmail, MainApp, Home/Match, Create/ActivityDetail, membership/list/group screens.
- `tests/backend.integration.cjs`, `docs/DECISIONS.md`.
- BE: config/env, activity validation/routes/repository, README and funding/CORS tests.

### Verification

- `npm run typecheck`, `npm run lint`: Passed.
- `npx expo-doctor`: Passed 21/21 checks.
- BE `npm test`: Passed 53/53 tests.
- `npm run test:integration`: Passed; actual FE service code exercised against
  Express/MongoDB for every requested endpoint, paging, identity and session expiry.
- `npx expo export --platform web --output-dir dist`: Passed with same-origin `/api`.
- Playwright browser: exported app rendered; invalid login called real BE and
  displayed the 401 error without entering the application.
- `git diff --check`: Passed for both repositories.
- `npm audit fix`: Applied compatible fix; audit still reports 22 transitive
  advisories (7 moderate, 15 high). Suggested forced fixes downgrade Expo/RN.

### Remaining work

- Profile/chat/messages/notifications, progress/expenses/ratings remain prototype;
  Google/Apple UI, persistent login and financial transactions remain unimplemented.
- Cover only supports one image; no physical-device validation. Browser smoke
  tested login failure; authenticated membership flow verified through service integration.
- Resolve remaining upstream dependency advisories without downgrading SDK 57.

## 2026-09-29 - Allow unrestricted Create Activity mockup navigation

### Summary

- Removed all field validation that blocked advancing or publishing in the
  Create Activity flow so every UI step can be reviewed with empty mock data.
- Kept only operational image-picker feedback such as permission denial and the
  six-image limit.

### Files changed

- `src/screens/CreateActivityScreen.tsx`
- `docs/DECISIONS.md`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.

### Remaining work

- Restore production form and financial validation before connecting the flow
  to a real creation API.

## 2026-09-29 - Expand Match confirmation, filters, and activity creation

### Summary

- Replaced the dedicated post-Match success route with an in-place bottom
  confirmation; interested swipes now send the request and advance the deck.
- Rebuilt Match filters with shared expanded categories, province/city and
  district selection, draggable distance and cost controls, availability, and
  minimum group-capacity filtering. Applied every new field to discovery data.
- Expanded Create Activity to five steps with up to six square-cropped photos,
  preset or custom categories, detailed scheduling and location fields, group
  setup, and a review step with direct financial editing.
- Added the Activity Fund configuration requested by the product brief: full
  prepayment or deposit, mode-specific values and deadlines, host treasury,
  approval threshold/rule, expected-fund summary, validation, and local draft
  persistence while the backend API is unavailable.
- Removed the obsolete Match success screen and documented the resulting
  product and data-model decisions.

### Files changed

- `src/data/activityOptions.ts`
- `src/screens/CreateActivityScreen.tsx`
- `src/screens/FilterScreen.tsx`
- `src/screens/MainApp.tsx`
- `src/screens/MatchScreen.tsx`
- `src/screens/MatchSuccessScreen.tsx` (removed)
- `src/services/activityService.ts`
- `docs/DECISIONS.md`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-create-filter-export`:
  Passed; generated the Android bundle successfully and the temporary output
  was removed afterward.

### Remaining work

- Connect activity creation, join requests, uploaded photos, and financial
  configuration to backend persistence when the corresponding APIs exist.
- Implement the later Fund lifecycle (contributions, payments, approvals,
  disbursement, reconciliation, refunds, settlement, disputes, and history).
- Validate slider feel, image cropping, and long location/category layouts on
  representative physical Android and iOS devices.

## 2026-09-29 - Improve Match swipe reliability on mobile

### Summary

- Moved the horizontal pan responder above the card's vertical `ScrollView` so
  horizontal intent is captured before native scrolling can claim the gesture.
- Reduced the initial direction-lock distance and allowed slightly diagonal
  swipes while preserving normal vertical detail scrolling.
- Added velocity-aware flick detection, a responsive completion threshold, and
  an animation guard to make short fast swipes reliable without double actions.

### Files changed

- `src/screens/MatchScreen.tsx`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-match-swipe-smooth-export`:
  Passed; generated the Android bundle successfully.

### Remaining work

- Confirm the gesture feel on representative physical Android and iOS devices.

## 2026-09-29 - Replace the find-companion onboarding visual

### Summary

- Replaced the programmatically composed first onboarding illustration with
  the supplied `timnguoidonghanh.png` artwork.
- Removed the obsolete avatar bubbles, connection lines, and center-logo styles
  from that slide.
- Used contained image sizing so the complete artwork remains visible on narrow
  mobile screens without cropping its outer people and activity icons.

### Files changed

- `src/screens/OnboardingScreen.tsx`
- `src/assets/timnguoidonghanh.png`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo export --platform android --output-dir .tmp-onboarding-image-export`:
  Passed; the generated verification output was removed afterward.

### Remaining work

- None.

## 2026-09-29 - Refine Match Hub into a compact social-app entry point

### Summary

- Replaced the oversized organic hero and floating activity photos with a
  compact discovery orb, two restrained radar ripples, and small native-driven
  floating bubbles.
- Removed the redundant "Bắt đầu Match" button and made the complete enlarged
  discovery orb the tap target for opening the existing Match screen.
- Consolidated pending and hosted activity actions into one neutral white
  management card with consistent icon, badge, and row treatments.
- Reworked the profile entry into a mini public-profile preview showing the
  user's avatar, verification, rating, and activity count.
- Reduced typography weight, decoration, color variety, vertical gaps, and
  overall screen height while preserving every existing route and action.
- Kept activity imagery exclusive to the full Match discovery screen.

### Files changed

- `src/screens/MatchHubScreen.tsx`
- `src/theme.ts`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-match-hub-refine`:
  Passed; the generated verification output was removed afterward.

### Remaining work

- Replace the displayed request counts and profile summary with API-derived
  values when those services are available.

## 2026-09-29 - Redesign the Match management hub

### Summary

- Kept the existing full-screen Match swipe, gesture, filter, and activity
  detail experience unchanged.
- Replaced the old "Hoạt động của bạn" layout with a compact Match hub built
  around a visual discovery hero, two management shortcuts, and a public
  profile-preview entry.
- Added zero-count handling for pending and hosted-request badges.
- Added an own-profile public preview mode with a viewer-context notice,
  profile statistics, interests, cover-cropped activity photos, a community
  review, and a persistent edit-profile action.
- Reused the current profile model and edit flow instead of introducing a
  duplicate screen or mock backend endpoint.

### Files changed

- `src/screens/MatchHubScreen.tsx`
- `src/screens/MemberProfileScreen.tsx`
- `src/screens/MainApp.tsx`
- `src/data/people.ts`
- `src/theme.ts`
- `docs/DEVELOPMENT_LOG.md`
- `docs/DECISIONS.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-match-hub-export`:
  Passed; the generated verification output was removed afterward.

### Remaining work

- Replace the hub counters, current-user preview data, gallery, and community
  review mock data when their APIs are available.

## 2026-09-29 - Rebuild Home as an activity-management dashboard

### Summary

- Removed Match promotion, recommendations, nearby discovery, and category
  discovery from Home so new-activity discovery remains exclusive to Match.
- Added an overview state centered on the next activity, plan/group quick
  actions, and conditional actionable items such as join requests, polls, and
  expenses.
- Added a calendar state with a weekly date strip and compact lists for the
  selected day, upcoming activities, and previously joined activities.
- Added an empty state with no recommended activities, a single Match CTA, and
  three short GoMate benefits.
- Extracted reusable Home header, next-activity card, action section, calendar,
  schedule item, and empty-state components.

### Files changed

- `src/components/home/HomeComponents.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/MainApp.tsx`
- `src/i18n/LanguageContext.tsx`
- `docs/DEVELOPMENT_LOG.md`
- `docs/DECISIONS.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-home-export`: Passed;
  the generated verification output was removed afterward.

### Remaining work

- Home currently uses mock schedule/action data. API-derived participation,
  hosting, polls, expenses, countdowns, and empty-state selection remain to be
  connected when those services are available.

## 2026-09-29 - Redesign the complete Match experience

### Summary

- Replaced the dark, full-image Match deck with a light, single-activity flow:
  cover image, connected white summary card, inline scrollable details, and only
  Skip/Interested as primary decisions.
- Rebuilt filtering around distance, category, detailed availability, and cost,
  including the multi-day availability picker and custom time range UI.
- Added reusable Match header/card/actions, filter content, more menu, report,
  safety, undo, availability, and category-preference sheets.
- Added one-use undo behavior, session-only hiding, GoMate-specific reporting
  and safety content, and UI states for loading, no results, unavailable
  activities, location permission, and network errors.
- Restored horizontal card gestures: swipe left skips and swipe right sends the
  join request, while vertical gestures continue scrolling inline details.
- Moved Undo and the report/more menu into the image's upper-left controls and
  fixed activity thumbnails to fill four equal-width cover slots.
- Added centralized Match colors and Vietnamese/English copy for the new flow.

### Files changed

- `src/components/match/MatchPrimitives.tsx`
- `src/components/match/MatchSheets.tsx`
- `src/screens/MatchScreen.tsx`
- `src/screens/FilterScreen.tsx`
- `src/screens/MainApp.tsx`
- `src/i18n/LanguageContext.tsx`
- `src/theme.ts`
- `docs/DEVELOPMENT_LOG.md`
- `docs/DECISIONS.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-match-export`: Passed;
  the generated verification output was removed afterward.
- Follow-up Android export to `.tmp-match-swipe-export`: Passed; generated
  output was removed afterward.

### Remaining work

- Hide/category preferences, reports, location permission, and error retries are
  local UI behavior until their backend and platform services are connected.

## 2026-09-29 - Build the GoMate settings and notification suite

### Summary

- Rebuilt Settings in the supplied minimal mobile style and adapted all labels,
  quantities, and examples to GoMate.
- Added navigable Account, Privacy & Safety, Notification Preferences,
  Appearance, Language, Change Password, GoMate Plus, Help Center, Blocked
  Accounts, and About screens.
- Restyled the main notification inbox with GoMate-specific join requests,
  messages, host updates, reminders, read state, and chronological sections.
- Added Vietnamese/English translations for the new settings experience.

### Files changed

- `src/screens/SettingsScreen.tsx`
- `src/screens/NotificationsScreen.tsx`
- `src/i18n/LanguageContext.tsx`
- `docs/DEVELOPMENT_LOG.md`
- `docs/DECISIONS.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-settings-export`:
  Passed; the generated verification output was removed afterward.

### Remaining work

- Settings controls currently update local UI state only; persistence,
  account-security actions, billing, search, and external legal links require
  their corresponding backend or platform integrations.

## 2026-09-29 - Rebuild the authentication screens from the reference

### Summary

- Rebuilt the authentication journey to match the supplied mobile reference:
  Log In, Sign Up, Verify Email, Forgot Password, Reset Password, and Password
  Reset Success.
- Added the reference-style minimal header, pill actions, social sign-in rows,
  five-cell verification code input, password requirements, and success state.
- Kept the existing Get Started screen as the entry point and added complete
  Vietnamese/English copy for the new states.

### Files changed

- `src/screens/AuthScreen.tsx`
- `src/screens/VerifyEmailScreen.tsx`
- `src/i18n/LanguageContext.tsx`
- `docs/DEVELOPMENT_LOG.md`
- `docs/DECISIONS.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed with no warnings.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir .tmp-auth-export`: Passed;
  the generated verification output was removed afterward.

### Remaining work

- Visual browser capture was unavailable because no in-app browser session was
  exposed in the current environment. Authentication and password recovery are
  still UI-only until the backend endpoints are connected.

## 2026-09-29 - Complete the Figma onboarding sequence

### Summary

- Added the full relevant onboarding path: app-icon Splash, Find your mate,
  Share your world, Build your community, Get Started/Auth, Create Profile,
  Interests, Notifications, Location, and You are all set.
- Replaced the temporary code-drawn brand mark with the real `logo-app.png`,
  `logo-nobackground.png`, and `logofont.png` assets throughout onboarding,
  authentication, and the app header.
- Reused `onboarding-landscape.png` for the Share your world illustration and
  kept the intro/permission layouts aligned with the supplied Figma section.
- Kept Suggested Communities and Suggested People out of the flow because
  those social-network features are outside GoMate's product scope.
- Added Vietnamese/English onboarding copy and mock permission transitions with
  explicit TODOs for future native permission-service integration.

### Files changed

- `App.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/OnboardingPermissionsScreen.tsx`
- `src/components/BrandLogo.tsx`
- `src/i18n/LanguageContext.tsx`
- `docs/DECISIONS.md`

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: Passed all 21 checks.
- `npx.cmd expo export --platform android --output-dir dist`: Passed.
- Mobile-size browser renders reviewed for Splash, all three intro pages,
  Get Started, Notifications, Location, and You are all set.

### Remaining work

- Connect the permission CTAs to native notification and location services once
  those integrations are introduced.

## 2026-09-29 - Replace the legacy UI with the Figma visual language

### Summary

- Rebuilt the entry experience around the Figma `05 · Get Started` and
  `06 · Create Profile` patterns instead of restyling the previous auth cards.
- Replaced the primary Home and Match layouts with a flat, image-led hierarchy,
  one full-screen activity card, focused actions, and Figma-like spacing,
  typography, controls, headers, and bottom navigation.
- Kept the GoMate activity lifecycle and existing state callbacks while
  rebuilding Create as a staged flow and retaining dedicated detail, group,
  activity, summary, rating, messages, notifications, and profile screens.
- Centralized brand and semantic colors in `src/theme.ts`, removed the unused
  legacy onboarding header, and removed the old blue gradient from Filter.
- Added Vietnamese/English strings for the new Figma-derived entry and Home UI.

### Files changed

- `src/theme.ts`, `src/i18n/LanguageContext.tsx`
- `src/components/BrandLogo.tsx`, `src/components/FormField.tsx`
- `src/components/GradientButton.tsx`, `src/components/AppHeader.tsx`
- `src/components/BottomNav.tsx`, `src/components/ActivityCard.tsx`
- `src/screens/AuthScreen.tsx`, `src/screens/ProfileScreen.tsx`
- `src/screens/HomeScreen.tsx`, `src/screens/MatchScreen.tsx`
- `src/screens/FilterScreen.tsx`, `src/screens/CreateActivityScreen.tsx`
- Supporting activity, member, messaging, notification, and profile screens

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: Passed all 21 checks.
- `npx.cmd expo export --platform android --output-dir dist`: Passed.
- Mobile-size browser renders reviewed for Get Started, Login, Home, Match,
  Filter, Create Activity, and Profile.

### Remaining work

- Re-run a direct Figma node inspection if the Starter-plan MCP quota resets;
  this pass used the node context already retrieved plus the supplied reference
  screenshot after the quota was exhausted.
- Replace mock service/state transitions with backend contracts when available.

## 2026-09-29 - Refactor GoMate around the activity lifecycle

### Summary

- Reframed the existing prototype around Activity → Match → Join Request →
  Group → In Progress → Summary → Rating instead of social-network concepts.
- Added centralized violet/match/success design tokens and migrated primary
  buttons, navigation, Match actions, and core surfaces away from the old blue
  gradient treatment.
- Added email verification, activity detail, four-step activity creation,
  group Chat/Plan/Expenses/Members, activity lifecycle, rating, and settings.
- Expanded Home, profile, notifications, applicant trust metrics, and activity
  fixture data while preserving the existing Expo architecture and API boundary.

### Files changed

- `App.tsx`, `src/theme.ts`, `src/screens/MainApp.tsx`
- `src/screens/VerifyEmailScreen.tsx`, `src/screens/ActivityDetailScreen.tsx`
- `src/screens/GroupScreen.tsx`, `src/screens/ActivityProgressScreen.tsx`
- `src/screens/ActivitySummaryScreen.tsx`, `src/screens/RatingScreen.tsx`
- `src/screens/SettingsScreen.tsx`, `src/screens/CreateActivityScreen.tsx`
- Core Home, Match, messaging, profile, host-management screens and components
- `src/data/activities.ts`, `src/data/people.ts`
- `src/services/activityService.ts`, `README.md`, `docs/DECISIONS.md`

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: Passed all 21 checks.
- `npx.cmd expo export --platform android --output-dir dist`: Passed.
- Expo web dev bundle: Started successfully with no application runtime error.
- Visual browser QA was not available because no in-app browser session was
  exposed in the environment.

### Remaining work

- Replace the mock activity service and local route/state transitions with real
  backend contracts when they become available.
- Persist authentication, group data, expenses, lifecycle updates, and ratings.

## 2026-09-28 - Add Vietnamese and English language switching

### Summary

- Added an app-level Vietnamese/English language provider and shared localized
  text rendering so one selection updates the complete app flow.
- Added compact VI/EN controls to authentication, profile onboarding, and the
  main Profile tab, and localized form placeholders and sample activity data.
- Kept filter and form state independent from translated display labels so
  switching languages does not reset a user's current work.

### Files changed

- `App.tsx`
- `src/i18n/LanguageContext.tsx`
- `src/components/LanguageSwitcher.tsx`, `src/components/LocalizedText.tsx`
- Shared text components and all screens under `src/components/` and
  `src/screens/`
- `docs/DECISIONS.md`

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: Passed all 21 checks.
- `npx.cmd expo export --platform android --output-dir dist`: Passed.

### Remaining work

- The selected language is kept for the current app session; persistence across
  a full app restart can be added when application settings storage is introduced.

## 2026-09-28 - Make activity discovery edge-to-edge

### Summary

- Removed the rounded activity-card container from full-screen discovery.
- Made the activity image and detail content fill the complete viewport below
  the back/filter header while preserving vertical scrolling and horizontal
  swipe gestures.
- Moved the activity counter and skip/join actions into floating overlays so the
  activity remains the only primary content on screen.

### Files changed

- `src/components/ActivityCard.tsx`
- `src/screens/MatchScreen.tsx`

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo export --platform android --output-dir dist`: Passed.

### Remaining work

- None for the requested UI change.

## 2026-09-28 - Turn Match into an activity management hub

### Summary

- Replaced the Match tab's direct swipe deck with a hub for discovering
  activities, reviewing liked/pending requests, and managing hosted activities.
- Moved activity discovery into a full-screen flow that hides bottom navigation,
  keeps back/filter actions in the upper-left area, supports horizontal
  decisions, and preserves vertical detail scrolling.
- Added pending-request history, hosted-activity member approval/rejection, and
  individual member/host profile screens.
- Made host and participant rows actionable from activity details and preserved
  the correct return path through nested full-screen flows.

### Files changed

- `src/data/people.ts`
- `src/screens/MatchHubScreen.tsx`
- `src/screens/PendingActivitiesScreen.tsx`
- `src/screens/ManageActivitiesScreen.tsx`
- `src/screens/MemberProfileScreen.tsx`
- `src/screens/HostMembersScreen.tsx`
- `src/screens/MatchScreen.tsx`
- `src/screens/MainApp.tsx`
- `README.md`, `docs/DECISIONS.md`

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: Passed all 21 checks.
- `npx.cmd expo export --platform android --output-dir dist`: Passed.

### Remaining work

- Persist join requests, host approvals, activity ownership, and profile data
  through the backend when its APIs are available.

## 2026-09-28 - Complete the main app and expand Match details

### Summary

- Reworked Home into a clean dashboard with no activity feed; all activity
  discovery now happens exclusively in Match.
- Expanded Match cards into vertically scrollable activity detail views while
  preserving horizontal skip/join gestures, replaced the heart action with a
  verification-style check, and added host/member access.
- Rebuilt the filter around activity-specific criteria with an active-filter
  summary, clearer categories, level, group size, budget, availability, and a
  proper no-results state.
- Added Create Activity, Messages, Chat, Profile, Edit Profile, Notifications,
  My Activities, Host & Members, and Join Confirmation screens and connected
  all flows through a five-tab application shell.
- Connected the Create Activity photo action to the device media library with a
  responsive selected-image preview.
- Used only the four activity images supplied in `src/assets/Activity-image/`.

### Files changed

- `src/components/ActivityCard.tsx`, `src/components/AppHeader.tsx`
- `src/components/BottomNav.tsx`, `src/components/ScreenHeader.tsx`
- `src/screens/HomeScreen.tsx`, `src/screens/MatchScreen.tsx`
- `src/screens/FilterScreen.tsx`, `src/screens/MainApp.tsx`
- `src/screens/CreateActivityScreen.tsx`, `src/screens/MessagesScreen.tsx`
- `src/screens/ChatScreen.tsx`, `src/screens/UserProfileScreen.tsx`
- `src/screens/EditProfileScreen.tsx`, `src/screens/NotificationsScreen.tsx`
- `src/screens/MyActivitiesScreen.tsx`, `src/screens/HostMembersScreen.tsx`
- `src/screens/MatchSuccessScreen.tsx`, `README.md`

### Verification

- `npm.cmd run typecheck`: Passed.
- `npm.cmd run lint`: Passed.
- `npx.cmd expo-doctor`: Passed all 21 checks.
- `npx.cmd expo export --platform android --output-dir dist`: Android bundle
  passed and included all four supplied activity images.

### Remaining work

- Replace fixture content and local navigation state with backend APIs and
  persistent authentication, activity, match, and messaging data.

## 2026-09-28 - Build Home, Match, Filter, and production-style auth

### Summary

- Added a polished Home discovery feed with greeting, search, category chips,
  filter access, and responsive activity cards.
- Added a Match experience that renders one activity post at a time with native
  swipe gestures, animated like/skip feedback, action buttons, and a filter
  shortcut.
- Added a full-screen activity filter with distance, age, time, category, and
  budget controls; applied distance/category filters affect Home and Match.
- Redesigned Login/Register to match the main product, routing Login directly to
  Home and new registrations through Complete Profile.
- Added a two-tab Home/Match bottom navigation and integrated the four activity
  images supplied in `src/assets/Activity-image/`.

### Files changed

- `App.tsx`, `README.md`
- `src/data/activities.ts`
- `src/components/ActivityCard.tsx`
- `src/components/AppHeader.tsx`
- `src/components/BottomNav.tsx`
- `src/screens/AuthScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/MatchScreen.tsx`
- `src/screens/FilterScreen.tsx`
- `src/screens/MainApp.tsx`
- `src/assets/Activity-image/*`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir dist`: Android bundle passed
  with all four activity assets.

### Remaining work

- Replace local activity fixtures and filter state with backend data when the
  activity API is available.

## 2026-09-28 - Simplify profile onboarding flow

### Summary

- Removed the standalone Select Interests screen and routed authentication
  directly to Complete Profile.
- Removed the Personal & Trip Photos section, multi-photo gallery, camera flow,
  and unused camera permission.
- Kept avatar selection and interest chips inside Basic Information so both can
  be updated from the profile.
- Updated onboarding progress from three steps to two and removed the unused
  interest screen/card components.

### Files changed

- `App.tsx`
- `src/components/OnboardingHeader.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/InterestsScreen.tsx` (removed)
- `src/components/InterestCard.tsx` (removed)
- `app.json`, `README.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed all checks.
- `npx expo export --platform android --output-dir dist`: Android bundle passed.

### Remaining work

- Persist the basic profile and interest selections when the backend API is
  available.

## 2026-09-28 - Modernize interests and profile onboarding

### Summary

- Replaced image-based interest tiles with a responsive two- or three-column
  icon card grid, gradient selected states, selection count, and a fixed Next
  action.
- Redesigned Complete Profile as two clean cards for basic information and
  personal/trip photos.
- Added quick age controls, area and interest chips, a compact bio, editable
  avatar, multi-image library selection, camera capture, photo removal, and a
  six-photo limit.
- Configured purpose-specific photo/camera permission copy and disabled the
  unused Android microphone permission.
- Removed the unused interest image sprite and added the SDK-compatible
  `expo-image-picker` dependency.

### Files changed

- `src/components/InterestCard.tsx`
- `src/screens/InterestsScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/assets/interests-sprite.png` (removed)
- `app.json`, `package.json`, `package-lock.json`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir dist`: Android bundle passed.

### Remaining work

- Persist profile fields and selected media to the backend when its API is
  available.

## 2026-09-28 - Build GoMate mobile onboarding flow

### Summary

- Migrated the root project from the Vite starter to Expo SDK 57 with strict
  TypeScript.
- Built responsive Login/Register, Select Interests, and Complete Profile
  screens with reusable inputs, gradients, buttons, branding, and progress UI.
- Added tab switching, password visibility, editable fields, multi-select
  interests, an image-picker placeholder, and navigation between screens.
- Generated and integrated a landscape illustration, nine-interest sprite, and
  sample profile portrait matching the visual references.
- Removed unused Vite scaffold files so Expo no longer misidentifies the old
  `src/app` directory as an Expo Router root.

### Files changed

- `App.tsx`, `index.ts`, `app.json`, `tsconfig.json`, `eslint.config.js`
- `package.json`, `package-lock.json`, `.gitignore`, `README.md`, `AGENTS.md`
- `src/components/*.tsx`, `src/screens/*.tsx`, `src/theme.ts`
- `src/assets/onboarding-landscape.png`
- `src/assets/interests-sprite.png`
- `src/assets/profile-avatar.png`
- Removed the unused Vite entry points, styles, layouts, services, and public
  starter assets.

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed all 21 checks.
- `npx expo export --platform android --output-dir dist`: Android bundle passed.
- `npm audit --omit=dev`: Reported 10 moderate transitive issues in the Expo
  toolchain; npm's suggested fix is an incompatible Expo downgrade.

### Remaining work

- Replace the image-picker placeholder with a real media-library flow when
  profile persistence is implemented.
- Recheck the Expo toolchain audit advisories when a compatible SDK update is
  available; no forced dependency downgrade was applied.

## 2026-09-28 - Add project documentation workflow

### Summary

- Added repository-wide agent instructions requiring documentation after every
  coding task.
- Added a shared development log, decision log, and reusable entry template.
- Extended the mobile-app instructions so its tasks follow the same log.

### Files changed

- `AGENTS.md`
- `GoMate-FE/AGENTS.md`
- `docs/README.md`
- `docs/DEVELOPMENT_LOG.md`
- `docs/DECISIONS.md`
- `docs/templates/development-log-entry.md`

### Verification

- Reviewed the documentation structure and relative paths.
- No application tests were run because this task changes documentation only.

### Remaining work

- None.

