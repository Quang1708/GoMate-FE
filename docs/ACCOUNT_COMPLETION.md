# Connected account and community features

- Native sessions persist in Expo SecureStore. Startup awaits storage; a locked store
  has a retry screen. Damaged values are removed. Writes/deletion are serialized to
  prevent a delayed login write restoring a logged-out session. Storage failures are
  surfaced to login and clear the in-memory session. MainApp validates restored
  sessions through authenticated profile loading; revoked/expired tokens clear storage.
  Web keeps its existing localStorage persistence. Native development builds need to
  be rebuilt for the added `expo-secure-store` module/plugin; no native folders are edited.
- Password change starts with empty fields, validates confirmation, calls the existing
  password API and signs out. BE invalidates every old session by credential version.
- Rating screens load actual present/late participants after completion, submit once,
  restore the saved result after reload and update real profile/host reputation.
- Notifications show real server events, unread state and navigable activity/chat/friend
  targets. Home/Inbox dots use actual unread counts. There is no hardcoded notification
  list or always-on badge. OS push notifications are separate and not configured.
- Report submission persists the selected reason/details and shows a saved state.
  The current user's reports/status are visible in Settings. BE provides an admin-only
  moderation queue/action API; regular accounts cannot change report status.
- Blocking is available on public profiles and direct chat. Settings lists actual
  blocked users and supports unblocking. Shared activity membership remains intact.
- Settings save invitation, friend-search visibility, direct-message and notification
  preferences per account on BE. Web settings subpages have distinct hash URLs and
  restore on reload/Back/Forward. Language preference persists locally (web/native).
  Prototype controls for two-factor authentication, fake connected accounts, GoMate
  Plus purchases and unapplied theme/font sliders are removed from the consumer UI.
- Chat now consumes authenticated SSE summary events using streaming fetch, immediately
  refreshes history and reconnects. Polling remains every 15 seconds while streaming,
  falling back to 3 seconds while disconnected. Tokens are headers, not URL parameters.
- Public member profiles and Match show actual reputation/counts, with a no-reviews
  state instead of invented ratings or verification icons.

Validation: `npm run test:community:web`, `npm run test:trip:web`, `npm run test:web`,
`npm run test:integration`, and `node --test tests/native-session.test.cjs`.

Chat media and companion cards are now connected; see `CHAT_AND_RELEASE_GAPS.md` for
current upload limits, endpoints and release follow-ups.

Limits: no physical device was attached for keyboard/GPS/permission QA. Excel row parsing, identity-document verification, payments/Plus and a separate business
website are outside these daily account flows. Google provider setup remains deferred
at the user's request. No production deployment, provider credentials or live account
roles are changed by this work.
