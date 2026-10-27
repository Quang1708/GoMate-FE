# Development log

This file records completed development work. Keep the newest entry at the top
and follow `templates/development-log-entry.md`.

## 2026-10-26 - Allow the Expo web fallback port through backend CORS

### Summary

- Add explicit localhost/127.0.0.1 origins for port 8082 to backend defaults, the example environment and local CORS configuration. Preserve the existing allowlist; untrusted origins remain blocked.
- Restart the local backend so the browser on 8082 uses the updated configuration.

### Files changed

- BE: src/config/env.js, .env.example, local .env (untracked), tests/app.test.js, README.md.
- FE/BE development logs.

### Verification

- BE node --test tests/app.test.js: Passed, 5 tests, including 8082 CORS/preflight and rejection of an untrusted origin.
- Running BE GET /api/auth/google/config with Origin http://localhost:8082: HTTP 200 and matching Access-Control-Allow-Origin.
- Running BE OPTIONS /api/auth/login: HTTP 204 and matching allowed origin.
- FE checks not repeated: no FE implementation or dependencies changed.

### Remaining work

- None for the reported CORS failure; reload the browser page.

## 2026-10-26 - Enforce the cross-account activity and friendship journey

### Summary

- Refresh Match on entry/every 10 seconds without resetting swiped cards; remove mock fallback and implicit profile-region restriction. Keep self-hosted posts out of discovery and omit empty search queries.
- Replace immediate host-added friends with notified invitations requiring recipient acceptance. Pending invitations consume no seats or chat access; show decisions in Friends/Notifications and invitation status to the host.
- Require the configured minimum of confirmed accounts (including host, excluding anonymous companions), at least one approved public joiner, and a confirmed schedule before starting. Reserve enough account capacity and one outside-member place; API version checks prevent concurrent overbooking/stale transitions.
- Require complete attendance marking before manual finish; add friend actions to Summary/Rating. Never-started overdue activities expire without becoming completed/rateable.
- Restore the missing portal category-options endpoint encountered by the full backend suite and isolate activity write quotas by authenticated account.

### Files changed

- Added `src/components/ActivityInvitations.tsx`; updated activity creation/group/invite/lifecycle/management/plan controls, Summary/Rating/Friends/Notifications/Match/MainApp/Search, `activityApi.ts`, `activityService.ts`, `useRemote.ts` and activity types.
- Updated `tests/activity-lifecycle.web.cjs`, `tests/trip-social.web.cjs`, `tests/activity-input.test.cjs`.
- Companion BE changes: activity readiness helper, invitation persistence/endpoints, discovery/validation/scheduler rules, portal options, `tests/user-journey.test.js`, existing contract tests and `docs/activity-participation.md`.
- Updated `docs/DECISIONS.md` and both repositories' development logs.

### Verification

- BE `node --test`: Passed, 110 tests. Covers five identities, self exclusion, cross-account search, private consent, forbidden impersonation, no access before acceptance, minimum/outside-member gates, stale schedules, simultaneous acceptance/start, attendance, rating eligibility, friendship approval and expiry.
- `npm run test:trip:web`: Passed against temporary real BE/MongoDB. Includes activity creation in one browser while another already browses Match, invitation acceptance, draft restore, chat and reserved-seat conversion after consent.
- `npm run test:lifecycle:web`: Passed with independent host/invitee/public-joiner browser sessions. Includes disabled host actions, Match commitment/application, approval, group chat, schedule edits/confirmation, attendance, completion, rating, a targeted post-trip friend request/acceptance and expired UI.
- `npm run typecheck`, `npm run lint`, `node --test tests/activity-input.test.cjs` (2 tests), web export with `EXPO_PUBLIC_API_BASE_URL=/api`: Passed. Lint has no warnings.
- `npx expo-doctor`: 17/18 passed; existing patch mismatches remain for expo 57.0.30, expo-location 57.0.21 and expo-sharing 57.0.23.
- Reviewed FE/BE diffs and `git diff --check`; no generated exports or unrelated local changes included. Tests use cached MongoDB 8.2.6, isolated from application data.

### Remaining work

- Native-device verification and existing Expo patch alignment remain outstanding. Deploy/restart the matching FE and BE together; existing host-added memberships are preserved, and legacy groups may need capacity/companions adjusted to meet the new start rules.

## 2026-10-26 - Participation commitments, verification, friends and group plans

### Summary

- Require a participation commitment before sending a join request from Match or activity details. Add Friends to Profile and update chat action icons.
- Support six-digit verification paste/autofill, incomplete-code prevention and narrow-screen scrolling. Save the pending multi-select choice on Done; offer activity ages from 12 and validate age ranges.
- Keep capacity above existing members, companions and selected friends; allow multi-digit entry without premature clamping.
- Remove personal cost UI/budget filters and public trip plans. Create/edit plans through group chat; preserve legacy data and business pricing. Hide the bottom gallery for single photos and remove Match search.
- Open Google Maps car, motorcycle or walking directions from the embedded map.

### Files changed

- Added `src/components/JoinConfirmation.tsx`, `tests/activity-input.test.cjs`.
- Updated `CreateActivityScreen`, `ActivityDetailScreen`, `ActivitySearchScreen`, `ActivitySummaryScreen`, `FilterScreen`, `MainApp`, `MessagesScreen`, `ProfileViews`, `VerifyEmailScreen`.
- Updated activity/group/preview cards, number/selection/age controls, `PlanOverview`, `RouteMap`, chat actions, `activityService.ts`, `mapsService.ts`.
- Updated `tests/trip-social.web.cjs` and `docs/DECISIONS.md`.

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed, no warnings.
- `node --test tests/activity-input.test.cjs`: Passed (2 tests: Google direction modes/coordinates and activity age/capacity validation).
- `EXPO_PUBLIC_API_BASE_URL=/api npx expo export --platform web`: Passed. Cleared Metro cache when switching from the configured local API URL for integration checks.
- `npm run test:trip:web`: Passed with cached MongoDB 8.2.6. Covers six-digit paste, incomplete-code guard, 320px verification layout, profile Friends navigation, friendship acceptance, draft preference restoration, single-photo gallery suppression, commitment cancellation/acceptance, group chat/files, host-only plan editing and Excel download; no browser runtime errors.
- `npx expo-doctor`: 17/18 passed; existing patch mismatches: expo 57.0.30 (expected ~57.0.31), expo-location 57.0.21 (~57.0.22), expo-sharing 57.0.23 (~57.0.24). Retried with network access after initial sandbox network failure.

### Remaining work

- Physical-device keyboard/autofill and Google Maps app handoff remain unverified. Existing Expo patch alignment remains a dependency follow-up.

## 2026-10-26 - Portal languages and app feedback, uploads and session isolation

### Summary

- Use the GoMate icon for the web favicon in exports and the running development page.
- Add a persistent English/Vietnamese portal selector across login, business verification, campaigns, location management, staff management and Admin review. Switching language preserves form state.
- Add the missing Google icon to native and fallback web sign-in buttons.
- Route screen/component action errors through a shared app-owned dialog while keeping inline feedback. Simplify introduction/name validation without relaxing server limits.
- Raise onboarding/avatar image selection to 10 MiB and align both multipart and base64 avatar APIs. Keep the user's existing Nickname placeholder edit.
- Remount account-owned app state on identity changes, synchronize browser storage events, and reject late responses from older sessions so Match preferences/favorites cannot leak across accounts.
- Backend now automatically completes overdue activities and sends deduplicated in-app reminders/completion notices; see the backend scheduler and lifecycle documentation.

### Files changed

- `App.tsx`, `app.json`, `src/services/api.ts`, `src/services/feedback.ts`, `src/services/activityService.ts`
- `src/components/AppFeedback.tsx`, `src/components/GoogleLoginButton*.tsx`, `src/components/WebWorkspace.web.tsx`
- Screen/component action-feedback state, including `src/screens/ProfileViews.tsx`, `ProfileScreen.tsx`, `AuthScreen.tsx`, `MainApp.tsx`, `CreateActivityScreen.tsx` and `ChatScreen.tsx`
- `src/i18n/LanguageContext.tsx`, `src/i18n/portalTranslations.ts`, `src/gomate-portal/usePortalText.ts` and portal views
- `tests/ui-experience.web.cjs`, `docs/DECISIONS.md`, `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed without warnings.
- `node tests/ui-experience.web.cjs`: Passed against localhost:8081 with API fixtures; checks portal language persistence/form preservation, favicon, account switching with a delayed old response, activity validation popup and Google icon/feedback.
- `npx expo export --platform web --output-dir dist`: Passed.
- `npx expo export --platform android --output-dir dist-native`: Passed.
- Backend focused checks: 20/20 passed for profile/avatar limits, Match isolation, lifecycle and scheduler. Expanded backend suite: 103/104 passed; the existing business-events test expects `/api/portal/options`, absent from backend HEAD.
- `npx expo-doctor`: 20/21 passed; existing patch mismatches remain for expo, expo-location and expo-sharing.

### Remaining work

- Physical-device interaction and external Google OAuth were not exercised. Browser regression uses isolated API fixtures.
- Existing backend `/api/portal/options` test mismatch and Expo patch updates remain separate follow-up work.

## 2026-10-26 - Merge tan-business into fe-ui2

### Summary

- Fast-forward `fe-ui2` from `4562592` to `a1ab937` using `origin/tan-business`; no conflicts.
- Integrate the business portal verification, staff review, location library, campaign dashboard, and multi-group composer work.

### Files changed

- `src/gomate-portal/{ActiveCampaignDashboard,AdminBusinessReview,BusinessStaffManagement,BusinessVerificationForm,ConnectedPortal,LocationLibrary,MultiGroupPostComposer}.jsx`
- `src/gomate-portal/connected-portal.css`
- `tests/business-demo.web.cjs`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `git diff --check`: Passed.
- `git merge-base --is-ancestor origin/tan-business HEAD`: Passed.
- `npx expo-doctor`: 20/21 checks passed; dependency check reports patch mismatches for expo (57.0.30 versus ~57.0.31), expo-location (57.0.21 versus ~57.0.22), and expo-sharing (57.0.23 versus ~57.0.24).

### Remaining work

- Review the Expo patch updates separately; dependencies were not changed as part of this branch merge.

## 2026-10-23 - Expand Admin business verification and staff review

### Summary

- Add an Admin business application table and detail modal for company identity, tax ID, address, representative contacts, license document download, review notes, and decisions.
- Add a Business Staff approvals table with group assignments, pending/approved/rejected filters, and mock approve/reject actions.
- Keep the existing Staff reviewer view and API-backed business application decisions.

### Files changed

- `src/gomate-portal/AdminBusinessReview.jsx`
- `src/gomate-portal/ConnectedPortal.jsx`
- `src/gomate-portal/connected-portal.css`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `git diff --check`: Passed.

### Remaining work

- The current application API does not persist tax ID, address, or representative fields, so the Admin view displays those details when supplied and indicates when they are absent. Business Staff approval requests and decisions are mock state until a backend endpoint is available.

## 2026-10-23 - Add active campaign and group dashboard

### Summary

- Add an Active Campaign / Group Dashboard for Business operations with group selection, deposit progress, paid/pending member tracking, total collected deposits, and schedule readiness.
- Add an interactive Lịch trình timeline builder with add/edit/delete, reorder controls, notes, and quick-select Location Library pins.
- Add Special Offer notification composition, preview, recipient count, send feedback, and recent notification history.

### Files changed

- `src/gomate-portal/ActiveCampaignDashboard.jsx`
- `src/gomate-portal/ConnectedPortal.jsx`
- `src/gomate-portal/connected-portal.css`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `git diff --check`: Passed.
- `npx expo-doctor`: Existing baseline remains 20/21 checks; `expo`, `expo-location`, and `expo-sharing` have patch versions older than the SDK expectation.

### Remaining work

- Deposit records, itinerary edits, and notifications are mock Business/Business Staff state; the current portal API has no group-management, payment, or notification endpoint.

## 2026-10-22 - Add Business Staff and multi-group post tools

### Summary

- Add Business Staff account request UI with contact details, group assignments, edit/delete actions, and the explicit Pending Admin (Minh) Approval status.
- Replace the Business create-post screen with one promotional post and multiple separately configured group drafts, including Location Library selection and per-person deposit amounts.
- Keep generated group and staff account records in mock frontend state; submit the main post through the existing portal API.

### Files changed

- `src/gomate-portal/BusinessStaffManagement.jsx`
- `src/gomate-portal/MultiGroupPostComposer.jsx`
- `src/gomate-portal/ConnectedPortal.jsx`
- `src/gomate-portal/connected-portal.css`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: 20/21 checks passed; the existing `expo`, `expo-location`, and `expo-sharing` patch versions do not match the expected SDK patches.
- `git diff --check`: Passed.

### Remaining work

- Business Staff accounts, generated groups, and deposit configuration are not persisted by the current portal API; only the promotional post is submitted to the supported endpoint.

## 2026-10-22 - Expand business verification and add location library

### Summary

- Expand the business verification form with tax ID, detailed address, license upload, and representative contact details while keeping the existing application API payload compatible.
- Add a Business-only Location Library with mock address search/pinning, branch add/edit/delete, and saved-location reuse in event creation.

### Files changed

- `src/gomate-portal/ConnectedPortal.jsx`
- `src/gomate-portal/BusinessVerificationForm.jsx`
- `src/gomate-portal/LocationLibrary.jsx`
- `src/gomate-portal/connected-portal.css`
- `tests/business-demo.web.cjs`
- `docs/DEVELOPMENT_LOG.md`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npm run test:business:web`: Could not start; the sibling `GoMate-BE` checkout is missing `src/database/workshop-demo.js`.
- `npx expo-doctor`: 20/21 checks passed. The existing Expo SDK patch versions for `expo`, `expo-location`, and `expo-sharing` do not match the currently expected patches.
- `git diff --check`: Passed after the final UI and test edits.

### Remaining work

- Verification details beyond company/category/website/license and all branch locations are mock frontend state; the current portal API does not persist those added fields or locations. `useMapAPI` is a local mock and does not call a live map provider.

## 2026-10-19 - Merge partner web UI, improve group tools and ship a real business demo

### Summary

- Commit prior lifecycle work, then merge `origin/htan-ui-web` into `fe-ui2` without conflicts. Reuse its portal design foundations in a live `/portal` workspace; isolate web DOM/CSS from native bundles and keep the original mock module as a visual preview.
- Move the shared-content library to the top-right chat header and add working menu actions for plans, members, host management, refresh and link sharing. Preserve composer contents and host-only phase timelines.
- Replace plain attendance controls with progress/counts, filters, avatars/status chips and explicit selected states. Redesign Plans with appointment, price/roster, itinerary and document cards, retaining versioned editing/downloads.
- Add verified business offer identity/green card borders, discount percentages and terms. Connect staff-reviewed events to app discovery/membership/chat. Use official schedules and disable anonymous companions/host-added friends for business groups on both client/API.
- Add independent-session `/demo` login and setup guide, idempotent local demo seed, activity keyword search and shareable links. Seed only demo-owned accounts/data; use normal backend authorization.

### Files changed

- `App.tsx`, `package.json`, `README.md`, `src/gomate-portal/*`, `src/components/{ChatHeaderActions,AttendanceRoster,PlanOverview,BusinessIdentity,WebWorkspace*}.tsx`.
- Chat/group/attendance/plan/detail/search/Match screens and components, activity DTO mapping/model, `tests/{business-demo,activity-lifecycle,trip-social}.web.cjs`.
- `docs/{DEMO_GUIDE,ACTIVITY_CHAT_AND_MANAGEMENT,DECISIONS,DEVELOPMENT_LOG}.md`; companion BE changes are on its `fe-ui2` branch.

### Verification

- Full BE suite: 103/103 passed, including verification/publication, consumer spoof prevention, guest/friend restrictions, ordinary join approval/chat and attendance/rating. Fixed local dependency installation (missing Leaflet); no source workaround for the previous map timeout.
- `npm run test:web`, `test:lifecycle:web`, `test:trip:web`, `test:community:web`, `test:maps:web`, `test:business:web`, `test:integration`: Passed. Nine native-session/API-URL/profile-date checks passed. Browser suites reported no runtime errors.
- `npm run typecheck`, `npm run lint`: Passed; `npx expo-doctor`: 21/21. Expo web and Android exports passed.
- Business browser integration covered new application → staff approval → event/offer creation → publication → searchable verified card → join approval → cross-session chat; checked 360/390/768/1440 px layouts and header library/menu.
- Inspected attendance, business plan, Chat and mobile/desktop portal screenshots. Actual installed Chrome and Edge independently logged into host/member accounts and found demo activities against the local running API. Repeated local seed preserved the same future sample activity IDs. `git diff --check`: Passed.

### Remaining work

- Physical iOS/Android keyboard/share-sheet verification. Prices/offers remain informational; there is no payment flow. Legacy text-only business announcements remain portal-only until recreated with event details.

## 2026-10-19 - Keep the timeline inside host Management

### Summary

- Move the activity timeline into host Management only. Chat now shows a compact informational notice for both host and members, with no timeline or lifecycle action buttons. Remove timelines from progress and summary as well.
- Keep progress and summary/review access in Plans so participants can still follow and rate the activity. Preserve schedule confirmation, start, attendance and completion in host controls.

### Files changed

- `src/screens/{GroupScreen,ActivityProgressScreen,ActivitySummaryScreen}.tsx`, `src/components/{ActivityManagementPanel,ActivityPlanPanel}.tsx`, `src/i18n/LanguageContext.tsx`.
- `tests/activity-lifecycle.web.cjs`, `docs/ACTIVITY_CHAT_AND_MANAGEMENT.md`, `docs/DECISIONS.md`.

### Verification

- `npm run typecheck`, `npm run lint`: Passed. `npx expo-doctor`: 21/21 passed. Expo web export: Passed.
- `npm run test:lifecycle:web`: Passed: timeline visible only in host Management across all phases; informational Chat notices for both roles; no timeline in Plans, Members, attendance or summary; rating remains accessible through Plans. Checked chat/composer at 360/390/768/1440 px and inspected Chat/Management screenshots.
- `npm run test:trip:web`: Passed, including schedule confirmation, chat/media/composer, shared plans/Excel and drafts. Both suites reported no browser runtime errors. `git diff --check`: Passed.

### Remaining work

- Physical iOS/Android device verification.

## 2026-10-19 - Visible activity timeline and next host actions

### Summary

- Keep a four-stage, API-backed timeline above the group tabs. Offer schedule confirmation/start directly from chat and put the next host action at the top of Management. Link Plans to these controls and refresh group state after saving a plan.
- Direct running hosts to attendance and a visible finish action, warn about unmarked members at confirmation, and retain the timeline in progress/summary. Preserve existing server rules and distinguish schedules that were never confirmed. Include English UI translations.

### Files changed

- `src/components/{ActivityLifecyclePanel,ActivityManagementPanel,ActivityPlanPanel}.tsx`.
- `src/screens/{GroupScreen,ActivityProgressScreen,ActivitySummaryScreen}.tsx`, `src/i18n/LanguageContext.tsx`.
- `tests/activity-lifecycle.web.cjs`, `tests/trip-social.web.cjs`, `package.json`, `docs/ACTIVITY_CHAT_AND_MANAGEMENT.md`, `docs/DECISIONS.md`.

### Verification

- `npm run typecheck`, `npm run lint`: Passed. `npx expo-doctor`: 21/21 checks passed. Expo web export: Passed.
- `npm run test:lifecycle:web`: Passed with temporary MongoDB and host/member/joiner browser sessions: two initial account members, approval/chat, plan save, schedule confirm/cancel/reload/reset, start/cancel, attendance warning/persistence, completion and real rating. Checked 360/390/768/1440 px layouts and composer visibility; no browser runtime errors.
- `npm run test:trip:web`: Passed after updating the schedule assertion to the new timeline; includes plan/Excel, shared chat/media, attachments and draft regressions. `npm run test:community:web`: Passed, including persisted ratings and host reviews.
- Reviewed mobile screenshots for chat timeline, host management, attendance and summary. `git diff --check`: Passed. Local frontend and API health returned HTTP 200.

### Remaining work

- Physical iOS/Android device verification. The full web smoke suite has a previously observed unrelated map iframe timeout; targeted lifecycle and related browser suites passed.

## 2026-10-16 - Account drafts, companion typing, inline chat tools and member portraits

### Summary

- Fix companion input sizing and apply per-person edits against current state. Add explicit create-draft saving/resume at the same editor step, with photos/Excel, account isolation, retry/conflict feedback, confirmed discard and publication cleanup.
- Keep the chat composer visible above an inline attachment panel that replaces the keyboard; default to a single compact input row, put the plus on the right and remove attachment-panel headers/limit copy. Preserve typed text and file/location flows.
- Replace the fixed participant portrait stack with current profile avatars and neutral silhouettes for missing/failed images/reserved seats. Add five full demo friends to the requested account through the backend script.

### Files changed

- `src/screens/{CreateActivityScreen,ChatScreen}.tsx`, `src/components/{CompanionCards,CreateGroupFields,ChatContent,ProfileAvatar}.tsx`, `src/components/home/HomeComponents.tsx`.
- `src/services/{activityDraftService,api,activityApi}.ts`, `src/data/activities.ts`, `tests/{trip-social.web,mapbox-maps.web}.cjs`, `docs/DRAFTS_AND_CHAT_COMPOSER.md`.

### Verification

- BE full suite: 93 passed; final focused draft/friend/member-avatar checks passed after additional validation. Large draft round trip exceeded the BSON document limit and used GridFS successfully.
- Trip UI integration passed real keyboard typing, save/resume after route changes/reload, media/Excel, incomplete drafts, confirmed/cancelled discard and publication cleanup, compact composer geometry, retained input above icons, chat/media and profile/fallback home avatars; no browser runtime errors.
- Web smoke and FE/BE service integration passed. Maps UI integration passed unchanged lookup/map/filter/chat-location flows with provider doubles. Typecheck/lint passed; Expo Doctor 21/21. Web and Android/iOS bundle exports passed.
- Configured database verified: five new demo profiles, accepted friendships and different avatar URLs for `pminh2004@gmail.com`; all five portrait URLs returned HTTP 200.

### Remaining work

- Physical-device keyboard/attachment-panel and WebView testing. One explicitly saved unfinished create draft per account; not background autosave or multiple-draft management. Production should reconcile GridFS orphans after interrupted writes.

## 2026-10-16 - Use VIETMAP autocomplete with Mapbox maps/routes

### Summary

- Switch configured address/POI lookup to VIETMAP Autocomplete v4/Place v4 while preserving Mapbox map rendering and Directions. Apply to inline activity address suggestions, modal lookup in forms/filters and chat sharing.
- Show VIETMAP lookup attribution and generic search labels; map/route attribution remains Mapbox. Preserve existing debounce, stale-response protection, coordinate clearing on manual edits and manual pin selection.
- Configure the supplied Services key only in ignored BE `.env`; expose search-provider metadata without its key. Update hybrid setup instructions, fallback behavior and release notes.

### Files changed

- `src/services/mapsService.ts`, `src/components/{PlacePicker,AddressAutocomplete,MapAttribution,MapAttribution.web}.tsx`.
- `tests/{mapbox-maps.web.cjs,mapbox-live.web.cjs}`, `.env.example`, README, Maps setup/release docs and `docs/DECISIONS.md`.

### Verification

- Supplied VIETMAP key: real Autocomplete v4 and Place v4 returned HTTP 200, including current ward/province names and valid coordinates. `npm run test:maps:live`: passed hybrid lookup, key exclusion from public config, Mapbox driving/walking and real SDK/tiles/radius/pin/route/attribution checks.
- `npm run test:maps:web`: passed FE/BE/MongoDB integration with provider doubles, including VIETMAP attribution, current ward auto-fill, inline race/error/empty states, activity and chat persistence, Mapbox modes and responsive layouts. Asserted no Mapbox Geocoding calls.
- `npm run test:integration`: passed. BE `npm test`: 91 tests passed, including provider secrecy, ownership/session binding, opaque ref_id round-trip, retryable errors and independent VIETMAP/Mapbox configuration.
- `npm run typecheck`, `npm run lint`: passed without warnings after import cleanup. `npx expo-doctor`: 21/21. Web and Android/iOS bundle exports passed.

### Remaining work

- Physical-device WebView/keyboard/GPS and deployed domain/token verification. Provider availability, quota and search coverage depend on the respective accounts/services.

## 2026-10-16 - Suggest addresses directly while typing

### Summary

- Add inline Mapbox address suggestions under the activity Address input for both creation and editing, without opening a separate picker. Select a result to fill the address, matching region fields and coordinates.
- Debounce typing by 450 ms, suppress short queries, ignore late results, and show loading, empty, retry and dismiss states. Scroll suggestions into view and bound the results list so it remains usable on small screens. Keep manual entry available; editing an address clears its old coordinates to prevent publishing a mismatched pin.
- Avoid searches for externally filled/confirmed addresses; keep existing map picker, GPS and chat flows.

### Files changed

- `src/components/AddressAutocomplete.tsx`, `src/components/FormField.tsx`, `src/screens/CreateActivityScreen.tsx`.
- `tests/mapbox-maps.web.cjs`, `docs/MAPBOX_SETUP.md`.

### Verification

- `npm run typecheck`, `npm run lint`, `npx expo-doctor`: passed; doctor 21/21. Web export passed.
- `npm run test:maps:web`: passed actual FE/BE/MongoDB with Mapbox doubles. Covers inline debounce/selection, old-coordinate removal, empty results, denial/retry and out-of-order responses, plus activity publication, map modes, filter and chat regressions. No browser runtime errors.
- New UI uses the existing Maps endpoints; no provider/config/backend changes or extra live provider requests were needed in this task.

### Remaining work

- Physical-device keyboard/tap/GPS verification. Address search remains address geocoding, not a POI directory.

## 2026-10-16 - Switch maps to Mapbox and verify the supplied token live

### Summary

- Replace Google map dependencies with Mapbox GL JS, permanent address geocoding and driving/walking Directions in activity creation, Match, filters, details and chat locations. Rename provider-specific UI/types to reusable names; keep public attribution and an OSM external link/fallback.
- Configure the supplied public token only in ignored backend `.env`. Verify real map style/tiles and APIs; no real token is written into source/tests/docs. Preserve unrelated profile/chat work and Google OAuth settings.
- Confirm activity address/province and manually adjusted coordinates persist after publishing; shared chat locations remain durable. Use permanent address results rather than temporary Search Box data; document address-only search and device/deployment limits.

### Files changed

- `src/services/mapsService.ts`, `src/components/{PlacePicker,MapAttribution,RouteMap,LocationField,ActivityMap}.tsx`, `src/components/MapAttribution.web.tsx`, chat and form callers.
- `tests/{mapbox-maps.web.cjs,mapbox-live.web.cjs,fixtures/mapbox-maps.js}`, `package.json`, `.env.example`, README and map/release documentation. Supersede previous uncommitted Google map fixture/UI files.

### Verification

- Live provider: map style, permanent Geocoding, DRIVE and WALK endpoints returned 200 with the supplied token. Opt-in `npm run test:maps:live` passed real GL JS rendering/tiles, click pin, radius, route overlay/clear, logo and attribution at 390/1000px; screenshots in the temporary test artifact folder.
- `npm run test:maps:web`: passed actual FE + BE + MongoDB with provider doubles, including activity publication/persisted coordinates, GPS/modes, errors/retry, chat persistence and 390/768/1440px layouts.
- `npm run test:web`, `npm run test:trip:web`, `npm run test:integration`: passed existing auth/profile, creation, lifecycle, companion, chat, attachment and OSM/GPS regressions.
- `npm run typecheck`, `npm run lint`, `npx expo-doctor`: passed; doctor 21/21. Expo web and Android/iOS bundle exports passed. Backend full suite passed 88 tests; focused Maps suite passed 3 tests after final malformed-response/cache/fallback checks.

### Remaining work

- Test WebView/GPS on physical Android/iOS and deployed domains. Mapbox request/map-load usage may be billable; permanent geocoding and persisted POI search have different eligibility/rights. Current search is addresses, not a saved POI directory.

## 2026-10-16 - Google Maps, Places and Routes integration

### Summary

- Add a Google Maps JavaScript map document using the existing iframe/WebView bridge, Advanced Markers, radius circles and route polyline messages. Preserve OSM when not configured and scope provider CSP changes to the map document.
- Add debounced Vietnam place search/confirmation with a shared Autocomplete/Details session, provider attribution and address/province matching for activity/filter forms. Allow selecting a place to share in chat and opening chat locations in an in-app map.
- Connect explicit GPS-based driving/walking route calculation, distance/time estimates and external Google Maps directions. Clear stale route overlays on a new attempt; include Google's required walking-route notice. Keep Match geographic radius/distance behavior.
- Protect server-side provider calls with authentication, strict contracts, fixed URLs, minimal field masks, rate/time limits and sanitized errors. Add two-key setup instructions without modifying user keys/billing.

### Files changed

- New `src/services/mapsService.ts`, `src/components/{GooglePlacePicker,GoogleAttribution,GoogleAttribution.web,RouteMap}.tsx`.
- Existing map components/types, location fields, create/filter/detail/Match/chat screens and components, package script and FE env example/README.
- `tests/google-maps.web.cjs`, test-only SDK fixture, `docs/GOOGLE_MAPS_SETUP.md`, release-gap/decision/log docs and the corresponding BE maps API/document/config/tests.

### Verification

- Typecheck/lint passed; Expo Doctor 21/21 passed. Web and Android/iOS bundle exports passed.
- `npm run test:maps:web`: passed with actual FE/BE/MongoDB and stubbed Google SDK/API; checks picker/session/auto-fill, pin/polyline bridge, modes/GPS, no-route/denial/retry, chat and 390/768/1440px layouts. No browser runtime errors.
- Existing `npm run test:web`, `npm run test:trip:web`, `npm run test:integration`: passed, including OSM fallback and prior profile/chat/activity behavior.
- BE full `npm test`: 88 passed; focused Maps tests passed after bounded provider validation changes.
- `git diff --check`: passed.

### Remaining work

- BE key-presence check found both Maps keys unset. User must enable billing/APIs, create/restrict keys, put them in BE `.env`, restart BE and reload app, following `GOOGLE_MAPS_SETUP.md`.
- Live Google calls, origin/IP restrictions and physical-device WebView/GPS behavior are not verified by provider doubles. Production terms/privacy, retention policy, custom map styling/ID and provider quotas remain setup/release work.
- Existing deferred OAuth/business website and other non-map release gaps remain unchanged.

## 2026-10-15 - Limit profile actions to the account profile page

### Summary

- Keep Edit Profile and Preview Profile in the avatar section of the account profile page containing Settings.
- Revert the added host-avatar prop/mapping in activity creation preview per the user's clarification. Preserve the other chat, companion, Match and profile improvements.
- Remove the browser assertion that required the reverted preview avatar; retain the profile-hero layout assertions.

### Files changed

- `src/components/ActivityDraftPreview.tsx`, `src/screens/CreateActivityScreen.tsx`, `tests/trip-social.web.cjs`, `docs/CHAT_AND_RELEASE_GAPS.md` and this log.

### Verification

- `npm run typecheck`, `npm run lint`: passed. `npx expo-doctor`: 21/21 passed.
- Web export and `npm run test:trip:web`: passed, including profile-hero actions and activity preview; no browser runtime errors.
- `git diff --check`: passed.
- Activity draft preview component restored to its pre-task content.

### Remaining work

- Existing release gaps remain documented in `CHAT_AND_RELEASE_GAPS.md`.

## 2026-10-15 - Private chat media, companion cards and profile/Match refinements

### Summary

- Move edit/preview actions into the avatar hero. Show the current host avatar in the creation preview and real Match/detail responses, including legacy avatar fallback.
- Add photo/video/camera/file/GPS attachment selection, removable draft items, content-aware send retries, image/video viewers, authenticated downloads and a paged per-conversation media/file/link/location library. Preserve immediate early group chat and existing access checks.
- Add named companion cards in creation and Members, with host editing, persisted private name/note fields, version protection and atomic conversion of reserved places to account membership. Show which named places an add-friends action will consume. Remove the duplicate member action from the group management tab.
- Build additional diffuse lighting, lavender/blue color fields and curved layers behind Match while preserving the existing 5% card reduction.
- Install expo-video using Expo CLI, enable explicit photo-camera permission, and align Expo to the SDK 57.0.30 patch required by Expo Doctor. Add release-gap recommendations and API documentation without enabling deferred providers.

### Files changed

- New `src/components/{ChatContent,CompanionCards}.tsx`, `src/services/chatContent.ts`, and corresponding BE chat/companion APIs, persistence, indexes and tests.
- Chat/profile/activity screens, `AddActivityFriends`, creation fields/preview, Match primitives/background, `ScreenHeader`, service/domain types, Expo config and package/lock.
- `tests/trip-social.web.cjs`, local CC0 MDN video fixture/source attribution, `docs/CHAT_AND_RELEASE_GAPS.md`, account notes and decision log.

### Verification

- `npm run typecheck`, `npm run lint`: passed. `npx expo-doctor`: 21/21 passed.
- `npm run test:integration`: passed against real FE services and temporary MongoDB-backed BE.
- `npm run test:trip:web`: passed two-account creation/preview, companion save/conversion, early group/direct chat, image/video/file/GPS messages, library filters/download, reload and 390/768/1440px layouts; no browser runtime errors.
- `npm run test:web`, `npm run test:community:web`: passed existing authentication/profile/Match/map/lifecycle and community/privacy/notification flows.
- `node --test tests/native-session.test.cjs`: 4 passed. Web and Android/iOS exports passed; no native folders were generated.
- BE full `npm test`: 86 passed, including content validation, privacy, byte ranges, retries, member revocation and named companions.
- `git diff --check`: passed.

### Remaining work

- Native binaries must be rebuilt for expo-video/camera configuration. No physical device was attached; camera/GPS/keyboard and real-device playback QA remain.
- Media is bounded to 10 MB/file and 4/message. Private object storage/thumbnails/transcoding, durable offline sends, voice recording/calls and live location are follow-ups, not included capabilities.
- Google Maps Platform setup, push while the app is closed, Excel row import and other priorities are detailed in `CHAT_AND_RELEASE_GAPS.md`. Google Login provider setup and the separate business website remain deferred as instructed.

## 2026-10-15 - Package shared workspace launcher for Git publication

### Summary

- Preserve root-level dev:all tooling in FE because the shared parent directory is not a Git repository. Keep FE and BE repositories independent.

### Files changed

- `tooling/README.md`, `tooling/workspace-root/` (root package/lock, ignore file, README and root development log), and this entry.

### Verification

- Launcher package/lock parse and version agreement checked; copied files match the workspace originals.
- FE/BE `git diff --check`: passed. Existing functional validation is recorded in the preceding task entries; no application source changed for publication packaging.

### Remaining work

- Separate business website remains deferred per user instruction.

## 2026-10-15 - Connected daily account, community and safety flows

### Summary

- Persist native sessions in SDK-compatible SecureStore with async startup/retry, serialized writes/deletion, corrupt-data recovery and expired-session clearing. Persist language selection locally on web/native.
- Connect password change to BE with empty fields, validation and sign-out after all sessions are revoked.
- Replace rating, notification, blocked-account and settings prototypes with actual account-scoped APIs. Ratings require completed activity membership and present/late attendance, persist once and update real host reputation.
- Add report submission/history plus a BE admin-only moderation API. Blocking is enforced bilaterally for direct chat/invitations/search/discovery and preserves existing groups.
- Save direct-message, invitation, search-visibility and in-app notification preferences on BE. Give settings subpages URL/reload/history support. Remove fake security/Plus/theme controls and dead safety menu actions.
- Consume authenticated SSE chat events with reconnect/poll fallback and queued refresh to avoid missed updates. Replace always-on unread dots and invented profile statistics/verification icons with actual data.

### Files changed

- `App.tsx`, `app.config.js`, package/lock and `src/services/{api,googleLogin,communityService,chatEvents,activityApi,profileService}.ts`.
- `src/screens/{SettingsScreen,NotificationsScreen,RatingScreen,MemberProfileScreen,MainApp,ChatScreen,ActivityProgressScreen,MatchScreen}.tsx`.
- `src/components/{BlockUserButton,UnreadDot,BottomNav,MemberProfileModal}.tsx`, home/Match components and language context.
- `tests/{community.web,native-session.test}.cjs`; supporting BE community module, event hooks, indexes and authorization tests.
- `docs/ACCOUNT_COMPLETION.md`, README, workflow/decision logs and matching BE docs.

### Verification

- BE full `npm test`: 81 tests passed; final focused activity/community/trip tests: 18 passed after notification hook/read-state updates.
- Native session tests: 4 passed (restore, write/delete ordering, corrupt data, failure/retry and expired tokens), with a mocked secure-storage adapter.
- FE real-service integration passed. Existing full web regression and two-account trip/chat regression passed.
- New two-account community browser flow passed settings persistence, real notifications/deep links/approval, rating persistence, report history, bilateral block/unblock and password change/new login; no browser runtime errors. Settings URL/history assertions are included.
- TypeScript and lint passed. Expo Doctor: 21/21. Web/Android/iOS bundle exports passed.
- `git diff --check`: passed; no unrelated work reverted, no live account roles changed.

### Remaining work

- OS push delivery, physical-device QA and separate business website remain outside these daily-account flows. Google provider configuration remains deferred per user instruction.
- Optional chat media, Excel row import, identity-document verification, dark theme and paid Plus require separate feature/provider work; unsupported prototype controls are not presented as working features.
- Notifications are secondary writes with logged failure isolation; a durable outbox/worker is a future production reliability improvement.

## 2026-10-15 - Personal publishing, searchable categories and group chat workspace

### Summary

- Remove consumer business publishing and force personal payloads; enforce rejection independently in BE.
- Expand FE/BE category choices to 56; add searchable selection and six popular shortcuts.
- Add relative registration deadline presets (6/12/24 hours) and custom selection, recalculated from start time. Move validation/API errors beside the fixed Continue/Publish footer.
- Replace host management button stacks with an activity selector, status/capacity/request overview, schedule confirmation, action rows, request decisions and useful empty states.
- Open real chat immediately inside the group; keep Chat/Plan/Members tabs above it and show host-only Management. Reuse the same management panel across standalone/group routes.
- Redesign inbox with search, unread/group/direct filters, actual avatars/unread counts/schedule metadata. Refine chat bubbles, day separators, sender names, retry and fixed composer; keep persisted messaging/pagination and membership enforcement.

### Files changed

- New `src/components/ActivityManagementPanel.tsx` and `RegistrationDeadlineField.tsx`.
- `src/screens/CreateActivityScreen.tsx`, `GroupScreen.tsx`, `MessagesScreen.tsx`, `ChatScreen.tsx`, `ManageActivitiesScreen.tsx`, `MembershipViews.tsx`, `MainApp.tsx`, `ActivityProgressScreen.tsx`.
- `src/components/ActivityPlanPanel.tsx`, `src/data/activityOptions.ts`, activity/chat services, FE integration/browser tests.
- `docs/ACTIVITY_CHAT_AND_MANAGEMENT.md`, existing workflow docs, README and decision log; matching BE routes/contracts/tests documented in BE.

### Verification

- BE `npm test`: 75 tests passed, including consumer business denial, host/version checks, confirmation invalidation, early chat and inbox ordering.
- FE `npm run test:integration`: passed with actual BE/MongoDB, including relative deadline offsets/recalculation.
- `npm run test:web`: passed edit/start/attendance/complete/delete and existing auth/profile/Match regressions.
- `npm run test:trip:web`: passed two-session creation/category search, nearby validation error, relative deadline persistence, host approval/confirmation, member role tabs, early persistent chat, friends, shared plans and Excel download. Screenshots checked at 390/768/1440px.
- `npm run typecheck`, `npm run lint`: passed. `npx expo-doctor`: 21/21 passed.
- Web, Android and iOS bundle exports passed. `git diff --check`: passed.

### Remaining work

- Physical-device keyboard and safe-area behavior still needs iOS/Android device testing. Text messaging is supported; no chat file/media uploads were added.
- Business publishing remains the responsibility of the separate business website; this consumer API does not grant website access based on request headers.

## 2026-10-15 - Resolve development API from the current Expo host

### Summary

- Fix the stale LAN IP in local API configuration (old 10.87.28.73, current 192.168.2.237).
- With no explicit API URL, use the Expo host on native and browser host on web during development, with API port 3000. Keep explicit URLs and production same-origin web behavior.
- Add expo-constants as a direct SDK-compatible dependency.

### Files changed

- `src/services/api.ts`, `src/services/apiUrl.ts`, `tests/api-url.test.cjs`.
- `.env.local` (ignored), `.env.example`, `package.json`, `package-lock.json`, `README.md`, and development/decision logs.

### Verification

- API URL regression tests: 3 passed (LAN changes, web development/production, overrides and emulator fallback).
- `npm run typecheck`, `npm run lint`: passed.
- `npx expo-doctor`: 21/21 checks passed.
- Backend LAN `/api/health` and browser fetch from localhost:8081: HTTP 200, status ok.
- Fresh Metro web bundle on temporary port 8091: passed. Browser API requests from that extra port were blocked by the existing CORS allowlist, as expected; port 8081 was verified instead.
- Automated login interaction was not completed (selector/navigation timeouts); no successful login claimed.

### Remaining work

- Reload/restart the existing Expo session to replace its embedded old environment URL. A physical-device connection was not available to verify.
- Remote APIs, nonstandard API ports and Expo tunnels require an explicit URL; extra web ports require a matching BE CORS_ORIGIN.

## 2026-10-15 - Four-step activity creation, trip planner and persistent friends/chat

### Summary

- Simplify creation to four steps with a shared date-range calendar, separate
  hour/minute wheels, profile-default city, searchable province/ward and optional
  district landmark wheels. Reuse the wheel fields in filters and group preferences.
- Add simple capacity steppers, offline companion reservations and selection of
  accepted GoMate friends. Remove the free-form join-requirements input; add age
  ranges checked on BE. Merge estimated costs and cost notes into group setup.
- Build a structured trip editor with up to 60 dated steps, a starter template,
  HTTPS Sheets/plan links and an Excel attachment up to 3 MB. Host edits shared
  plans from the activity/chat area with version checks; others view/download.
- Preview the real Match card with media, schedule, cost and itinerary. Reset
  scroll when changing steps, show the end timestamp and fix zero-width thumbnails.
- Add friend search/requests/recipient decisions/removal, member-profile friend
  actions, direct chat and early activity chat. Replace sample messages and group
  plans/expenses with real API data; persist messages, read markers and retry IDs.
- Count offline companions without granting chat identities. Allow hosts to add
  accepted friends and convert reserved seats without double counting. Read current
  membership/reservation data when returning to member management.

### Files changed

- `src/screens/{CreateActivityScreen,FilterScreen,GroupScreen,ChatScreen,MessagesScreen,FriendsScreen,MainApp,MembershipViews,ActivityDetailScreen}.tsx`
- `src/components/{DateTimeField,SelectionField,NumberStepper,ActivityLocationFields,CreateGroupFields,ActivityChoices,ActivityDraftPreview,TripPlanEditor,TripPlanView,ActivityPlanPanel,AddActivityFriends,FriendRequestButton,MemberProfileModal}.tsx`
- `src/components/match/MatchPrimitives.tsx`, `src/data/{regions.json,legacyDistricts.json,regionOptions.ts,activities.ts}`
- `src/services/{planService,chatService,friendService,activityService,activityApi,filterService}.ts`
- `app.json`, `package.json`, `package-lock.json`, `tests/{trip-social.web,web.smoke}.cjs`
- `docs/ACTIVITY_CREATION_AND_FRIENDS.md`, `docs/DECISIONS.md`, `README.md`
- BE: activity-plan validation, capacity/membership and friend repositories/routes,
  age checks, chat metadata, public field projections and friend indexes;
  `tests/trip-social.test.js`.

### Verification

- `npm run typecheck`, `npm run lint`: Passed.
- `npx expo-doctor`: Passed, 21/21 checks.
- Web export with `EXPO_PUBLIC_API_BASE_URL=/api`: Passed.
- `npx expo export --platform all` to a temporary folder: Passed for web/Android/iOS;
  no native project directories generated.
- BE `npm test`: Passed, 74 tests including six new trip/social tests.
- FE `npm run test:integration`: Passed against real BE services.
- `npm run test:web`: Passed after updating the four-step edit flow; includes
  prior Match, GPS, lifecycle, auth, profile and Google callback regressions.
- `npm run test:trip:web`: Passed through two isolated account sessions: recipient
  acceptance, date/time/place wheels, profile city, reserved/friend occupancy, age,
  cost notes, Excel, Match preview at 390/768/1440px, cross-user persisted group and
  direct chat, reserved-seat conversion, host-only plan editing and file download.
  Includes thumbnail dimensions and no browser runtime errors.
- `git diff --check`: Passed.

### Remaining work

- Physical Android/iOS picker, keyboard and external Excel app review was not run.
- Excel is an attachment, not an automatic row import; online plans are HTTPS links
  whose sharing permissions are managed by their owners. Native rebuild is required
  for the newly added document-picker/sharing capabilities.
- Districts are explicitly optional legacy landmarks; current wards are selected
  at province level from the bundled API snapshot.

## 2026-10-15 - Match P1/P2, location, favorites and profile media

### Summary

- Add personal/business activity creation and filtering, recommended/nearest/
  soonest ordering, foreground GPS and interactive map point selection. Connect
  real coordinates to BE distance/radius queries; no deposit filter is present.
- Persist filters and favorites per account. Recommend activities using interests
  and bounded category feedback before paging. Restore saved nearest/radius
  preferences through a location prompt without storing precise GPS coordinates.
- Add profile-cover upload/replacement/removal and full-screen album viewing;
  preserve multiple uploads, reorder and confirmed deletion. Show covers in the
  profile and preview; normalize and clean assets with optimistic concurrency.
- Connect the Google GIS/native SDK token flow to BE sessions, leaving provider
  setup disabled as requested. Add optional native config and a public client-ID
  endpoint; do not create or modify provider credentials.
- Fix wheel selection being overwritten by stale web scroll events, restore the
  requested gomate_user placeholder, handle older filter objects without the new
  organizer field, and show actual activity photos instead of repeated placeholders.
  Disable joining closed/full activities and resolve own request state in favorites.

### Files changed

- `src/screens/{MainApp,MatchScreen,MatchHubScreen,FilterScreen,CreateActivityScreen,ActivityDetailScreen,FavoriteActivitiesScreen,ProfileViews,AuthScreen}.tsx`
- `src/components/{ActivityMap,ActivityMap.web,LocationField,GoogleLoginButton,GoogleLoginButton.web,ProfileCoverEditor,ProfilePhotoEditor,ProfilePickers,GradientButton}.tsx`
- `src/components/ActivityMap.types.ts`, `src/components/match/MatchPrimitives.tsx`
- `src/services/{matchService,locationService,googleLogin,activityApi,activityService,filterService,profileService}.ts`, `src/data/activities.ts`
- `app.json`, `app.config.js`, `.env.example`, `package.json`, `package-lock.json`
- `tests/web.smoke.cjs`, `docs/MATCH_FEATURES.md`, `docs/DECISIONS.md`, `README.md`
- BE: activity/profile/auth repositories and routes, bounded Match filter validator,
  map document/assets routes, Leaflet dependency and `tests/match-preferences.test.js`.

### Verification

- `npm run typecheck` and `npm run lint`: Passed.
- `npx expo-doctor`: Passed, 21/21 checks.
- Web export with `EXPO_PUBLIC_API_BASE_URL=/api`: Passed.
- Android export to a temporary folder: Passed; no native directories generated.
- BE `npm test`: Passed, 68 tests; focused Match suite passed again after stricter
  filter validation, nearest-location requirement and map embedding changes.
- FE `npm run test:integration`: Passed after fixing legacy filter compatibility.
- `node --test tests/profile-date.test.cjs`: Passed, 2 tests.
- Browser smoke: Passed through favorites persistence, organizer filters, simulated
  GPS, map clicks, radius, profile cover/album, wheel regression and simulated Google
  callback through real BE sessions. Final smoke also passed join/cancel from
  favorites, restored-radius location prompts, and no browser runtime errors.
- `git diff --check`: Passed.

### Remaining work

- Real Google provider setup is deferred. Browser Google tests substitute the SDK
  response; real provider credentials and physical-device sign-in were not tested.
- Physical GPS, native device rendering and iOS builds were not run. OSM tiles
  require internet; geographical searches omit activities without pinned points.

## 2026-10-15 - Soft abstract lavender Match background and smaller card

### Summary

- Replace the flat Match backdrop with a three-stop gradient (#F5F3FF,
  #EAE7FF, #F9F9FF), translucent pastel circles and large curved accents.
  Feather the shapes on native and add blur on web; keep the backdrop behind
  content and outside pointer handling in every Match state.
- Scale only the Match card to 95%, preserving swipe transforms and action
  button sizes. Compensate for the scaled card's unused layout height.

### Files changed

- `src/components/match/MatchBackground.tsx`
- `src/screens/MatchScreen.tsx`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed, 21/21 checks.
- `EXPO_PUBLIC_API_BASE_URL=/api npx expo export --platform web`: Passed.
- Temporary focused browser review: Passed at 390, 768 and 1440px without
  horizontal overflow; captured screenshots, dragged a card to expose the
  backdrop, checked skip/undo and found no browser runtime errors.
- `npm run test:web`: Failed later at the language-picker English selection
  assertion; Match checks passed before that unrelated step.

### Remaining work

- Native device visual review was not run; browser review covered web only.
- Investigate the full-app language-picker smoke failure separately.

## 2026-10-15 - Match lavender background and floating activity card

### Summary

- Add a very pale lavender gradient scoped to Match, including empty/loading
  states. Keep the existing primary palette and all button styles and handlers.
- Set the card's horizontal inset to 16px and separate its shadow from the
  clipped content. Round only the top corners; retain the full scrolling post
  with square bottom corners and the additional photos at the end.
- Place category and member count directly below the main photo, followed by
  title and basic information. Consolidate host information and its existing
  verification icon in the host detail section without removing post content.

### Files changed

- `src/screens/MatchScreen.tsx`
- `src/components/match/MatchPrimitives.tsx`

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed, 21/21 checks.
- `EXPO_PUBLIC_API_BASE_URL=/api npx expo export --platform web`: Passed.
- `npm run test:web`: Passed with the cached MongoDB binary supplied through
  `MONGOMS_SYSTEM_BINARY`; includes Match skip/undo and no browser runtime errors.
  The initial attempt was stopped while downloading an already cached binary.
- `git diff --check` for the changed Match files: Passed.

### Remaining work

- Native device visual review was not run; validation used the web build/browser.

## 2026-10-15 - GoMate companion profiles, wheel pickers and single-post Match undo

### Summary

- Adapt the supplied matching-profile references to GoMate: basic information,
  photo gallery, introduction, interests, companion goals, availability, two short
  activity prompts, and optional work/education. Remove dedicated lifestyle/music
  sections from the profile editor and provide edit/preview tabs using current drafts.
- Split incomplete-profile onboarding into persisted basic information, then the
  companion profile. Bio and at least one interest complete the second step;
  work/education, prompts and photos remain optional.
- Add day/month/year wheels and masked `DD-MM-YYYY` typing, including separators
  after complete day/month, deletion handling, leap years and future-date checks.
  Preserve ISO birth dates at the API boundary. Rename the username label to
  `Nickname (không bắt buộc)` and retain the `gomate_user` placeholder.
- Add 174 searchable interests, accent-insensitive matching and custom interests;
  retain the 12-interest limit. Select province-level areas only, with the catalogue
  checked against https://chinhphu.vn/cac-tinh-thanh-pho-68349 on 2026-10-15.
- Add a language wheel with Vietnamese selected by default, multiple selection,
  duplicate prevention and at least one remaining language (up to 12).
- Add six profile photos, each up to 10 MiB, with owner-only upload/reorder/delete,
  optimistic concurrency, processed images and failed-upload cleanup. Profile
  context updates photos without discarding unsaved form text. Await avatar upload
  before releasing the completion gate so failures stay visible.
- Use the live account avatar in Home/Match headers; tapping it opens the profile.
  Move settings into the seven requested profile menu rows; show actual account
  fields in Settings. Verification reports the persisted email status; reviews read
  stored scores with an honest empty state. Preview/member modals use public profile
  fields and ordered photos, with complete-years age instead of the exact birth date.
- Remove the Match undo confirmation and per-session allowance. Undo returns only
  the immediately skipped post, clears its slot on use, and becomes available after
  the next skip. Accepting a post clears the previous skip slot. Add web selection
  semantics alongside native accessibility state for wheels, tabs and chips.

### Files changed

- New FE `src/components/ProfilePickers.tsx`, `ProfilePhotoEditor.tsx`,
  `UserAvatar.tsx`, `src/data/profileOptions.ts`, `src/services/profileDate.ts`,
  `src/screens/ProfileAccountScreens.tsx`, and `tests/profile-date.test.cjs`.
- FE profile/MainApp/Home/Match/Settings screens, Home header and public profile
  modal; `ActivityChoices.tsx`, `BottomNav.tsx`, `MatchSheets.tsx`, translations;
  profile service/context and `useRemote.ts`; extended `tests/web.smoke.cjs`.
- BE profile routes, auth repository methods and `tests/profile.test.js`.
- Both READMEs and `docs/DECISIONS.md`. Earlier P0 edits and the existing BE
  package-lock change remain in the working tree.

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `node --test tests/profile-date.test.cjs`: Passed, 2 tests for incremental typing,
  backspace, ISO/display conversion and invalid/leap/future dates.
- FE `npm run test:integration`: Passed against actual BE/MongoDB.
- BE `npm test`: Passed, 61 tests. Subsequent targeted
  `node --test tests/profile.test.js`: Passed, 11 tests including photo capacity
  and oversized image rejection added during review.
- `npx expo-doctor`: Passed, 21/21 checks.
- `EXPO_PUBLIC_API_BASE_URL=/api npx expo export --platform web --clear`: Passed.
- `npm run test:web`: Passed in headless Chrome with real BE/MongoDB and test
  mail/image storage: seven menu rows, account identity, immediate one-post undo
  and reset, date typing and actual year scrolling, leap-day clamping, region
  search, actual language scrolling/multiple selection/minimum one, interest
  search without accents, two-stage registration, profile photo upload/order/delete,
  live avatar propagation, draft preview and persisted profile after reload.
  Previous P0 activity/auth smoke coverage also passed; no runtime errors.
- Screenshots of birthday/language wheels and profile previews/editors at
  390/768/1440 px were reviewed. `git diff --check` passed in both repositories.

### Remaining work

- Physical iPhone/Android interaction and live SMTP/Cloudinary delivery were not
  exercised. The cross-platform wheels were verified in Chrome, including actual
  scroll events. Profile verification currently covers email, not identity documents.
- The reviews page reads existing `activity_ratings`; the existing activity rating
  submission screen remains a separate prototype and does not create reviews yet.

## 2026-10-15 - Complete P0 web authentication, profiles and activity management

### Summary

- Expand bounded web pages for desktop/tablet, keep readable auth forms, and wrap
  upcoming activity cards into columns. Fix clipped email descenders with a padded
  input using the font's normal line height and accessible input labels.
- Add hash URLs and per-user browser history snapshots for tabs/screens; restore
  Back/Forward and reload, hydrate activity links from BE, and recover pending
  verification emails. Web sessions persist in localStorage, use remembered BE
  sessions, and clear on logout/401; native session behavior remains in memory.
- Complete reset-password OTP/new-password validation, resend cooldown and feedback.
  Replace dismissible profile reminders with a completion gate. Move birth date
  and gender into basic information; advanced religion/alcohol remain optional.
- Reuse the creation wizard for host edits; support capacity, optional estimated
  cost, multiple photos (six, 10 MiB each), gallery replacement/clearing and deletion
  confirmation. Remove prepayment/deposit/deadline requirements from creation.
- Connect start, attendance, updates and completion to BE; persist the audit trail
  and use real roster/update counts in summaries. Confirm completion and stop
  attendance edits after completion.
- Upgrade Expo to SDK 57 patch ~57.0.29 after Doctor detected an installed patch
  mismatch. Add Playwright and a repeatable browser smoke command.

### Files changed

- FE `App.tsx`, `src/theme.ts`, `src/services/webNavigation.ts`, `api.ts`,
  `activityApi.ts`, `activityService.ts`, `profileService.ts`, and activity types.
- FE auth/profile/create/manage/group/progress/summary/detail/home screens;
  shared `FormField.tsx` and `BottomNav.tsx`.
- BE activity validation/routes/repository and profile completion contract.
- FE `tests/backend.integration.cjs`, new `tests/web.smoke.cjs`; BE new
  `tests/activity-gallery.test.js` and updated `tests/profile.test.js`.
- FE package manifest/lock, both READMEs, and `docs/DECISIONS.md`.
  The pre-existing BE package-lock modification was left as found.

### Verification

- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npx expo-doctor`: Passed, 21/21 checks.
- BE `npm test`: Passed, 58 tests including exact 10 MiB acceptance, oversize
  rejection, ordered gallery persistence, replacement/clear/delete cleanup,
  rollback of partial uploads, lifecycle permissions and profile completion.
- FE `npm run test:integration`: Passed against actual BE/MongoDB; includes
  web session restoration, 401 cleanup, no financial configuration requirement,
  cleared registration deadline, lifecycle, attendance and audit adapters.
- `EXPO_PUBLIC_API_BASE_URL=/api npx expo export --platform web --clear`: Passed.
  Clearing Metro was necessary to avoid reusing the prior LAN API build.
- `npm run test:web`: Passed in headless Chrome with an isolated BE/MongoDB;
  login/reload/Back/Forward, 390/768/1440 px overflow checks, actual multi-file
  picker, gallery/edit/delete/start/attendance/reload/complete, reset OTP,
  verification reload, required profile gate and basic/advanced profile save.
  No browser runtime errors. Email g/q screenshot and responsive screenshots
  were visually inspected; artifacts are printed in the temporary test directory.
- `git diff --check` in both repositories: Passed.
- Tests reused the cached MongoDB executable through `MONGOMS_SYSTEM_BINARY`.
  The initial integration attempt was stopped while it downloaded a duplicate binary.

### Remaining work

- No remaining implementation items from this P0 list. Native device validation
  and live SMTP/Cloudinary delivery were not run; automated tests substitute email
  and image storage while using the actual API and MongoDB.

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

