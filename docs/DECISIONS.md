# Decision log

Record decisions here when they materially affect architecture, dependencies,
security, the data model, or product behavior. Keep the newest decision at the
top. Small implementation details belong only in `DEVELOPMENT_LOG.md`.

### 2026-10-26 - Recipient-approved activity invitations and qualified lifecycle transitions

- **Status:** Accepted at the user's explicit request to bind the complete user-to-user journey. Supersedes immediate friend membership and permissive lifecycle rules below.
- **Decision:** Initial selections and host friend additions are invitations, with notifications and recipient-only accept/decline. Acceptance atomically creates `host-invited` membership and optionally converts a reserved companion seat. Pending invitations grant no chat access or guaranteed seat; preserve existing `host-added` records.
- **Decision:** Minimum participants counts confirmed GoMate accounts including the host, excluding anonymous companions. Confirmation/start additionally require at least one approved public join request; host-added/host-invited friends do not satisfy the outside-member gate. Capacity must accommodate the minimum and retain an outside seat until a public member joins. These rules run on the server, with explicit FE blocking reasons.
- **Decision:** Require schedule confirmation before start, recheck membership on start and use versioned updates. Invalidate confirmation when members leave or schedule/capacity/requirements change. Require every attendance record marked before manual completion. Never-started overdue activities become `expired`; running automatic completion preserves existing attendance and review eligibility.
- **Decision:** Default discovery to all regions unless filters were explicitly saved; refresh while browsing and keep swiped IDs stable. Enforce self exclusion in API and FE. Keep friendship recipient-approved after the trip and expose it in Summary/Rating. Scope activity write quotas per authenticated account so users on one network do not share a quota.
- **Validation:** 110 backend tests and the trip/social and lifecycle browser suites passed using separate accounts and temporary databases; TypeScript/lint/unit checks and web export passed. Existing Expo patch mismatches remain.

### 2026-10-26 - Confirm participation and keep trip planning inside group chat

- **Status:** Accepted at the user's request; clarified that the added step is a commitment before applying.
- **Decision:** Show activity conditions and require an explicit checkbox before sending join requests from Match or activity details. Cancellation sends no request. This is a client confirmation, not a server consent ledger; existing API eligibility and approval remain authoritative.
- **Decision:** Remove personal estimated-cost inputs/displays and budget filtering; preserve legacy stored costs and business offer pricing. Create/edit trip itineraries, links and Excel files through the existing group chat Plans tab; remove plans from public posts and the activity composer.
- **Decision:** Activity age choices start at 12; zero still means unrestricted. Retain the four-step draft format, friend membership APIs and host plan permissions. Show the bottom activity gallery only for multiple photos.
- **Decision:** Keep the embedded map and open Google Maps universal direction URLs for car/motorcycle/walking, using driving/two-wheeler/walking. Google Maps handles route availability and device location. Reference: https://developers.google.com/maps/documentation/urls/get-started.

### 2026-10-26 - Isolate account state and reconcile activity schedules

- **Status:** Accepted for the requested account isolation and overdue activity behavior.
- **Decision:** Key the app workspace by account identity and discard API responses from superseded sessions, including successful empty responses. Browser storage events update identity across tabs. Profile-name updates within one account do not reset the workspace.
- **Decision:** The backend checks schedules at startup and every 30 seconds. Published/in-progress activities become completed after `endsAt`; host and approved members receive in-app reminders within 30 minutes of the start and automatic-completion notices. Stable schedule keys prevent duplicate notices and delivery failures are retried.
- **Decision:** Automatic completion preserves attendance. It does not imply attendance or change existing rating eligibility. Keep validation limits while simplifying user-facing messages and using the shared app dialog for action feedback.
- **Decision:** Reuse the existing language preference for portal English/Vietnamese; translate UI labels without resetting form state or rewriting submitted content. Keep the 10 MiB image limit on both client and API.

### 2026-10-19 - Connect the merged partner portal and business events to the app

- **Status:** Accepted at the user's request. `origin/htan-ui-web` was merged into `fe-ui2` without conflicts; existing activity/chat work was committed before merging.
- **Decision:** Reuse the merged portal's visual foundations at `/portal`, with real session/role/application/post APIs. Retain its original mock module as a design preview only. Isolate DOM/CSS imports behind a web platform component so native Expo bundles remain supported.
- **Decision:** Business applications may be reviewed by Staff/Admin. New portal event posts include schedule, place, capacity, final price, discount percentage and offer terms. Only approved events become app activities, using the server-owned verified business identity and an official confirmed appointment. Legacy text-only announcements stay in the portal feed.
- **Decision:** Business attendees apply under their own account and await organizer approval. Anonymous reserved seats and host-added friends are disabled for business events on both client and API. Existing group permissions, attendance and review eligibility remain enforced.
- **Decision:** Chat shows only a state notice; library/menu actions live in the top-right header. The phase timeline stays in host Management. Attendance and Plans use structured cards and explicit controls.
- **Decision:** Demo support is an opt-in CLI seed plus ordinary API login at `/demo`, not a public seeding endpoint or authentication bypass. Seeded records are identifiable, preserved on reruns and disabled under production NODE_ENV. Keyword search and deep links let two independent browser sessions find the same activity.
- **Validation:** Business/individual lifecycle browser integration, full backend suite, web smoke, maps/community/trip suites, service tests, TypeScript/ESLint/Expo Doctor and Android/web exports passed. Physical-device testing remains outstanding.

### 2026-10-19 - Restrict the activity timeline to host Management

- **Status:** Accepted at the user's request; supersedes the shared group timeline placement below.
- **Decision:** Show the stage timeline and host actions inside Management only. Chat displays an informational state notice for host and participants. Do not show the timeline in Plans, Members, progress or summary.
- **Decision:** Keep member access to progress and summary/reviews through Plans, preserving the existing lifecycle and attendance controls.

### 2026-10-19 - Make activity stages and host actions visible in the group

- **Status:** Accepted at the user's request.
- **Decision:** Keep a server-derived four-stage timeline above the group tabs and offer the next action directly from chat. Put schedule confirmation/start at the top of Management, with a link from Plans. Use the same controls in standalone host management.
- **Decision:** Direct running hosts to attendance before completion, with a visible finish action and an explicit unmarked-member warning. Retain the backend's existing permission, confirmation, start and rating rules; this does not require schedule confirmation before starting or prevent completion with unmarked members.
- **Validation:** Isolated browser integration covers host/member visibility, appointment changes, confirmation persistence, attendance and a real review after completion.

### 2026-10-16 - Server-backed create drafts and an inline chat attachment panel

- **Status:** Accepted.
- **Decision:** Store one explicit unfinished create draft per authenticated account on BE, including editor step and original photo/Excel content. Use owner-scoped versioned metadata plus GridFS rather than browser storage, temporary file URLs or a single BSON document. Restore automatically, confirm discard and remove only the saved version after publication.
- **Decision:** Drafts permit incomplete fields and stay outside published activities/Match; publication still uses full validation and existing media uploads. Conflicting sessions do not overwrite each other. Multiple drafts/edit drafts/background autosave are not included.
- **Decision:** Keep a single composer mounted while replacing the keyboard with an inline icon panel. Default blank input to one row; preserve the same text/attachment state during keyboard/panel transitions.
- **Decision:** Home participant photos come from actual approved-member profiles. Missing/error portraits and reserved companions use a neutral silhouette, never a fixed sample person.

### 2026-10-16 - VIETMAP lookup with Mapbox rendering and routes

- **Status:** Accepted at the user's request; supersedes the Mapbox-only lookup part of the decision below.
- **Decision:** Prefer VIETMAP Autocomplete v4/Place v4 when `VIETMAP_API_KEY` exists. Keep Mapbox GL JS/Directions and existing points, filters, activity/chat persistence and bridge unchanged. Use new administrative format (`display_type=1`) for current wards/provinces.
- **Decision:** Keep the Services key on BE only. Expose only search-provider identity/availability in public config; fixed upstream URLs, per-account/session selections, validation, rate/time limits and sanitized errors protect the lookup flow. No VIETMAP requests are made directly by FE or map WebView.
- **Decision:** Attribute lookup results to VIETMAP and preserve Mapbox's own map/route attribution. Do not silently call Mapbox Geocoding after a configured VIETMAP provider fails. Mapbox permanent address geocoding remains available only on installations without a VIETMAP key.
- **Validation:** Supplied key passed live Autocomplete/Place v4; the hybrid live test passed Mapbox tiles and both route modes. FE/BE/MongoDB tests cover inline suggestions, current ward auto-fill and persisted activity/chat points.

### 2026-10-16 - Replace Google Maps with Mapbox

- **Status:** Accepted; supersedes the Google Maps decision below at the user's request.
- **Decision:** Use Mapbox GL JS 3.33.0/streets-v12 in the shared BE map document, plus authenticated Geocoding v6 and Directions v5. Preserve the existing iframe/WebView contracts, GPS, radius and manual selection. Keep OSM when no token is configured; remove Google Maps runtime configuration/documents and keep OAuth separate.
- **Decision:** Use permanent geocoding for address results that can be saved to activities/chat. Do not persist temporary Search Box/POI data. Address search is intentionally labeled as address search, not a POI directory; broader POI persistence needs suitable Mapbox rights.
- **Decision:** Store the user-provided public token only in ignored BE `.env`. Expose it to the map SDK through public config, never embed the actual value in source, tests, docs or FE builds. Limit authenticated API calls, sanitize failures and scope provider CSP to the map page.
- **Decision:** Keep at most 500 account/session-bound address selections for five minutes; details consumes one selection without another provider request. This is a process-local cache; clients must search again if an instance changes. Geocoding billing remains per request, not per session.
- **Validation:** Real token API calls and real SDK/tiles passed in desktop Chrome, including selection, radius, pin, routes and attribution; deterministic FE/BE/MongoDB tests cover activity/chat persistence. Mobile bundle export is not physical-device validation.

### 2026-10-16 - Google Maps in the shared map document

- **Status:** Superseded by Mapbox above.
- **Decision:** Reuse the BE-hosted map page in web iframe and native WebView for Google Maps JavaScript. Keep the OSM document when no browser key is supplied; never silently draw Google Places/Routes data on OSM. Preserve Google attribution and the required walking-route beta notice.
- **Decision:** Use separate restricted browser/server keys from BE configuration. The browser key is public by design; the server key stays in provider request headers on BE. Scope the Maps SDK CSP allowances to the map document and retain frame-origin restrictions.
- **Decision:** Proxy only fixed, authenticated, validated Places (New) and Routes calls with rate/time limits and minimal field masks. Share a session token between debounced Autocomplete and Details. Support explicit GPS-based DRIVE/WALK calculations with polylines, rather than calling Routes for all Match results.
- **Decision:** Confirm a selected place before updating activity/filter/chat drafts. Keep Match radius/straight-line distance semantics and manual coordinate selection. Do not persist autocomplete lists or route responses; review Google data retention and public Terms/Privacy before a wider release.
- **Limit:** User-owned billing/key setup and live/physical-device verification are separate from stubbed-provider tests. No key, billing, deployment or OAuth setting is changed automatically. Setup is documented in `GOOGLE_MAPS_SETUP.md`.

### 2026-10-15 - Private chat attachments and named companions

- **Status:** Accepted.
- **Decision:** Store bounded chat uploads as separate MongoDB Binary documents (10 MB/file, maximum 4/message). Authorize every upload/download/library read through current conversation access; bind sends to uploader and conversation. Expire unused uploads after 24 hours. Message retry IDs compare text, attachment metadata and location together. Same-owner attachments can be reused within the same conversation after editing a draft following an uncertain send outcome.
- **Decision:** Keep companion name/note arrays aligned with reserved-seat capacity. Only group members can read them; only the host edits before start, using activity versions. Consuming reserved seats removes the corresponding initial companion entries atomically, without inventing authenticated identities. Names/notes are excluded from public activity responses.
- **Decision:** Add SDK-compatible expo-video for on-demand playback. Camera permission is requested only when the user chooses to take a photo. GPS sharing sends an explicit snapshot, not background tracking. Existing Google provider and business website deferrals stand.
- **Follow-up:** Move large-scale media to private object storage with thumbnails/transcoding and a durable cleanup policy before increasing limits. See `CHAT_AND_RELEASE_GAPS.md`.

### 2026-10-15 - Persisted accounts and real community actions

- **Status:** Accepted.
- **Decision:** Store native sessions with Expo SecureStore, serialize storage writes and gate startup on restoration. Keep existing web storage behavior; BE remains the authority on session validity.
- **Decision:** Account privacy/notification preferences are explicit validated BE settings and are enforced in write/access paths. Blocks deny bilateral private contact while preserving existing shared activity membership.
- **Decision:** Ratings are immutable, idempotent per completed activity/author, with present/late attendance and actual target checks. Read host reputation from persisted member scores and completed activities.
- **Decision:** Use actual in-app notification records and authenticated SSE chat updates. Notification failures do not roll back successful core operations; a durable outbox is separate production hardening.
- **Decision:** Reports are private to the reporter; moderation requires a provisioned BE admin role. Do not expose prototype security/subscription/theme controls as working features or grant business/admin privileges from client input.

### 2026-10-15 - Consumer publishing and the activity chat workspace

- **Status:** Accepted.
- **Decision:** Consumer apps publish only personal activities. Reject business creation/conversion on BE regardless of platform headers; business website authorization must use a separate trusted publishing flow.
- **Decision:** Chat opens before activity start. Use a shared top-tab group workspace and a shared host-only management panel; put cost estimates under Plan instead of a separate expense tab.
- **Decision:** Confirming a schedule is a versioned host action distinct from starting the activity. Store confirmation and audit fields; time/location edits clear confirmation. Members can see its actual persisted status.
- **Decision:** Deadline shortcuts resolve relative to start time until publication, then persist as the existing absolute UTC deadline. Retain custom times and BE validation/enforcement.
- **Reason:** Reduce form friction, separate conversation from attendance, and keep permissions and group state consistent between the UI and API.

### 2026-10-15 - Infer the local API host in development

- **Status:** Accepted.
- **Decision:** An explicit EXPO_PUBLIC_API_BASE_URL always wins. Otherwise development native clients derive the API host from Constants.expoConfig.hostUri, web clients use their browser origin hostname, and both use port 3000. Exported web retains /api.
- **Reason:** Hardcoded Wi-Fi addresses become unreachable when the developer changes networks. Native localhost also refers to the device itself.
- **Limits:** Backend must listen on the LAN for physical devices. Expo tunnels do not tunnel the API; remote/custom-port APIs still need explicit configuration. Existing CORS allowlists remain enforced.

### 2026-10-15 - Four-step activity creation, trip plans and social membership

- **Status:** Accepted.
- **Decision:** Use four steps: basics, schedule/location, group/cost/plan, Match
  preview. Share scroll-wheel selectors across time, administrative places,
  advanced group preferences and filters. Choose start/end on one range calendar.
  Default a new activity's city to the current profile; preserve explicit edits.
- **Decision:** Use the bundled Province Open API v2 province/ward snapshot for
  current choices. Keep v1 district names as optional familiar landmarks, not a
  current administrative hierarchy. Wards are selected at province level and
  are not falsely constrained by obsolete district boundaries.
- **Decision:** Persist at most 60 structured itinerary steps, an optional HTTPS
  plan link, and one Excel attachment up to 3 MB. Sheets links are opened as links;
  Excel is stored/downloaded as an attachment, not executed or imported into rows.
  Only hosts edit the shared plan, with version checks, including while in progress.
  Completed plans are read-only. Keep legacy text plans readable.
- **Decision:** Keep costs as an estimated per-person amount and explanatory note
  within group setup. Drop the free-form join-requirements input; retain structured
  age/gender/language choices. Enforce volunteered profile age on joining and host
  additions. Existing preference fields remain API-compatible.
- **Decision:** Model offline companions as reserved seats counted in memberCount,
  never as fake accounts or chat identities. A host can add accepted GoMate friends
  directly at creation or before activity start. Converting a reserved seat to a
  named member does not increase occupancy; all changes enforce capacity and version.
- **Decision:** Add unique friend relationships with recipient-only acceptance,
  lookup by public name/Nickname, cancellation/removal and direct chat entry points.
  Activity chat uses live approved membership; added friends can chat before start,
  and removed members lose access. Existing direct-chat semantics remain compatible.
  Replace the app's sample conversation/group chat data with persistent API messages,
  idempotent retries, older-message paging, read markers and three-second chat polling.

### 2026-10-15 - Persistent Match preferences, geolocation and optional Google sign-in

- **Status:** Accepted.
- **Decision:** Add `organizerType=personal|business` to activities; treat existing
  records without it as personal. This is the host's declared activity type,
  not a business-verification badge. Retain estimated-cost filtering; do not
  introduce deposit or funding-mode filters.
- **Decision:** Rank recommendations before pagination using profile interests
  matched against category, tags and description/title, plus bounded per-category
  skip/interested/dislike/favorite signals. Keep explicit nearest/soonest sorts.
  Store filters and up to 500 favorite IDs on the authenticated account.
- **Decision:** Use Expo foreground location and the existing MongoDB 2dsphere
  index for actual distance/radius queries. GPS coordinates stay in session state;
  restore saved nearest/radius preferences only after a fresh GPS or map point.
  Choosing a map point remains available when GPS is denied or times out.
- **Decision:** Self-host Leaflet assets and a small map document on BE, with OSM
  tiles and visible attribution. Embed it through an iframe on web and WebView
  on native. Permit map embedding only from self/configured frontend origins;
  check message source, origin and coordinate bounds on web.
- **Decision:** Use Google's rendered GIS button on web and native Google Sign-In
  in a development/production build. Exchange the provider ID token for the
  existing BE session; do not link accounts based only on matching email.
  Provider setup stays disabled until IDs/native configuration are supplied.
- **Decision:** Store a separate profile cover with version-guarded replacement,
  10 MB input validation, image re-encoding and cleanup of replaced cloud assets.
  Preserve the six-photo profile album with upload/reorder/delete and add viewing.

### 2026-10-15 - Companion profile structure and repeatable single-post undo

- **Status:** Accepted.
- **Decision:** Interpret the supplied dating-profile screens as structure references
  for an activity companion profile. Keep photos, intro, interests, work/education;
  add GoMate goals, availability and activity prompts. Dedicated lifestyle, music,
  relationship, children and height sections are omitted from the editor. Existing
  private preference values remain compatible with activity matching.
- **Decision:** Save basic information before the companion-profile step. Require
  name, birth date, gender, region and language at the first step; bio/interests at
  the second. Extra profile detail and photos are optional. Existing complete
  profiles are not forced to provide the new optional fields.
- **Decision:** Use shared React Native scroll wheels on web/native rather than a
  new picker dependency. Render birthday `DD-MM-YYYY` with incremental separators,
  but preserve ISO `YYYY-MM-DD` in storage/API. Vietnamese is the default language;
  retain at least one selected language. Province-level selection replaces free
  text on profile forms; distance remains a matching concern.
- **Decision:** Keep the existing `username` API/storage semantics under the new
  optional Nickname label, including uniqueness and normalization.
- **Decision:** Add ordered profile photos independent of the avatar (six, 10 MiB
  each). Upload one image per request, return opaque photo IDs/public URLs, and
  version-guard reorder/delete operations. Update shared profile state without
  resetting the editor. Public responses include only complete-years age and
  volunteered profile detail; exact birth date and private demographic preferences
  stay omitted.
- **Decision:** Profile verification represents email verification. The reviews
  screen reads actual `activity_ratings` and renders an empty state when none exist;
  it does not fabricate scores or claim identity verification. Rating submission
  integration is outside this profile/menu change.
- **Decision:** Match keeps one pending skipped-post slot. Consume it immediately
  on undo; the next skip replaces it, and accepting a post clears it. No session
  quota or confirmation dialog is shown.

### 2026-10-15 - P0 browser navigation, required basic profiles and activity galleries

- **Status:** Accepted.
- **Decision:** Use hash URLs through the existing screen flow rather than adding
  a router dependency. Browser history/sessionStorage snapshots are scoped to the
  signed-in user; activity routes hydrate current server data on history restore.
  Tabs, known screens and activity links work after reload and browser Back/Forward.
- **Decision:** Persist web Bearer sessions in localStorage and request the existing
  BE remembered-session lifetime. The server still enforces expiry/revocation;
  logout and 401 remove local credentials. Native sessions remain memory-only.
  Pending email drafts use sessionStorage; passwords and OTPs are not persisted.
- **Decision:** Basic profile completion includes birth date and a saved gender
  choice (`undisclosed` allowed), in addition to existing basic fields. Incomplete
  profiles must complete the form before accessing the main UI, including existing
  incomplete accounts. Religion/alcohol remain optional; public profiles still
  omit private demographic fields.
- **Decision:** Creation only records optional estimated cost. It sends no deposit,
  prepayment or payment deadline; legacy BE financial contracts remain compatible.
- **Decision:** Store ordered `imageUrls` and private storage IDs for up to six
  activity images, each at most 10 MiB decoded. Keep legacy cover support. Replace
  galleries atomically with the activity write, clean failed/replaced uploads,
  and bound JSON requests to 81 MiB for base64 overhead. Reverse proxies must
  allow the documented request size; no raw base64 is stored in MongoDB.
- **Decision:** Group progress uses existing host-authorized lifecycle and attendance
  endpoints. Completion requires confirmation and leaves attendance immutable.
  Summary counts derive from persisted data instead of prototype numbers.

### 2026-10-13 - Remote demo media and persisted member rosters

- **Status:** Accepted.
- **Decision:** Demo activities use curated external Unsplash images; profiles use
  Random User portraits and Unsplash covers. FE activity adapters no longer fall
  back to local images. CSP permits only these providers alongside existing Cloudinary.
- **Decision:** Add ten complete fictional member accounts (14 demo accounts total)
  and actual approved/pending join requests. Group counts derive from approved
  membership. Enrichment only targets marked demo records; roster version guards
  prevent resurrecting cancelled/left/removed membership on reruns.
- **Decision:** Show member avatars and a real public-profile modal. Public responses
  omit email, date of birth, gender, religion and alcohol settings.
- **Consequences:** Images require provider/network availability. Accounts remain
  explicitly fictional. Existing demo account completion reminders no longer show
  because all demo profiles are now complete; ordinary incomplete accounts still get reminders.
- **Supersedes:** Local activity-image fallback and the empty demo participant profile.

### 2026-10-13 - Automatic verification login, precise scheduling and real profiles

- **Status:** Accepted.
- **Decision:** Passwords require 6–128 characters without composition rules.
  Successful single-use email verification issues a regular Bearer session;
  FE enters the app immediately without retaining/reusing the password.
- **Decision:** Shared calendar/time controls feed Vietnam dates and minute-level
  times to BE. Activities store min/max member counts and optional participant
  requirements. Match filters dates, times, sizes and requirements server-side.
- **Decision:** Profile completion requires name, location, bio, interests and
  languages. Avatar, gender, religion, alcohol and birth date are optional;
  advanced fields remain collapsed. App reminders can be deferred. Host-selected
  restrictions use volunteered profile fields and are enforced when requesting to join.
- **Decision:** Seed 20 fictional TP.HCM activities with four marked demo accounts,
  deterministic IDs and insert-only writes. Dates start tomorrow at first seed;
  reruns preserve existing data rather than rescheduling it.
- **Consequences:** Existing long passwords remain valid. Sessions still live in
  memory in FE; refresh needs login. Finance setup is persisted, but payment
  transactions are not part of creation. Missing optional profile data does not
  satisfy an explicitly restricted group. Demo listings are clearly labeled.
- **Supersedes:** Manual login after email verification and mock profile UI.

### 2026-10-13 - Use backend identity and persisted activity membership

- **Status:** Accepted.
- **Context:** The Expo application used Vite environment variables, mock login,
  local join decisions and hardcoded group members despite available BE endpoints.
- **Decision:** Use `EXPO_PUBLIC_API_BASE_URL` and Bearer sessions; keep tokens in
  memory and return to login on 401. Read hosted, joined and pending activities
  from their separate endpoints. All membership mutations await server success.
- **Consequences:** Reload requires login. Lists exhaust pagination and offer
  refresh/error states. Create persists to BE, converts Vietnam input dates to
  UTC, and supports one cover image rather than six local-only photos. BE stores
  and validates optional funding configuration and registration deadlines;
  treasury is the host. Funding transactions and the remaining prototype screens
  are outside this integration. Actual form/API validation now prevents invalid
  publication; mock navigation between form steps remains available.
- **Supersedes:** Local publication in the funding decision and unrestricted mock
  publication in the 2026-09-29 Create Activity navigation decision.

### 2026-09-29 - Configure activity funding during creation

- **Status:** Accepted
- **Context:** Hosts need to define how members contribute before publishing,
  while the backend and the later Fund transaction experience are not ready.
- **Decision:** Store one financial config in the create draft with exactly two
  modes: full prepayment or deposit. Both modes include a deadline, host-managed
  treasury, approval threshold, and a member approval rule. Persist published
  drafts through the local activity adapter until the creation API supports the
  same model.
- **Consequences:** Create Activity now has five steps. Form and financial
  validation are intentionally deferred while the flow is used as a UI mockup
  and must return before backend integration. Payment, contribution,
  disbursement, settlement, and other Fund operations remain out of scope.
- **Supersedes:** None.

### 2026-09-29 - Keep successful Match requests in discovery

- **Status:** Accepted
- **Context:** Routing to a dedicated success screen interrupts rapid activity
  discovery after every interested swipe.
- **Decision:** Submit the join request, advance the deck, and show a temporary
  bottom confirmation explaining that host approval is pending. Do not navigate
  away from Match for this action.
- **Consequences:** The dedicated Match success route and screen are removed.
  Request persistence still depends on a future backend integration.
- **Supersedes:** The dedicated post-match success-screen behavior.

### 2026-09-29 - Keep Match discovery separate from its management hub

- **Status:** Accepted
- **Context:** The Match swipe experience is already the approved discovery
  surface, while the former "Hoạt động của bạn" page needs to provide concise
  access to requests, hosted activities, and the user's public identity.
- **Decision:** Preserve the existing Match screen and use the underlying Match
  hub only for launching discovery, managing the two request types, and opening
  a reusable own-profile public preview.
- **Consequences:** Discovery gestures and filters remain stable. The hub stays
  visually focused and does not duplicate activity lists, recommendations,
  category browsing, or tutorial content.
- **Supersedes:** None.

### 2026-09-29 - Separate activity management from discovery

- **Status:** Accepted
- **Context:** Home previously promoted Match and rendered recommended activity
  cards, which duplicated discovery and weakened the role of the Match tab.
- **Decision:** Home only manages activities the user joins or hosts, including
  their next activity, actionable updates, schedule, and history. Match is the
  only surface for discovering new activities; Create, Messages, and Profile
  retain their existing creation, communication, and identity responsibilities.
- **Consequences:** Home contains no recommendations, nearby activity search,
  categories, or swipe discovery. Its empty state links directly to Match.

### 2026-09-29 - Make Match a single-activity decision flow

- **Status:** Accepted
- **Context:** The previous dark swipe deck treated details as a separate route
  and exposed three competing actions, while the approved Match design requires
  focused evaluation of one activity at a time.
- **Decision:** Match renders one light activity card with details in the same
  vertical scroll. Skip and Interested are the only primary actions; filter,
  undo, report, hide, and safety are secondary controls or sheets.
- **Consequences:** Match no longer routes to Activity Detail for basic reading.
  Existing detail routes remain available from Home and activity-management
  flows. Preference/report persistence still depends on future services.

### 2026-09-29 - Separate notification inbox content from notification preferences

- **Status:** Accepted
- **Context:** GoMate needs both a user-facing notification history and controls
  for choosing which notification categories are delivered.
- **Decision:** Keep the notification inbox as a full-screen route from Home and
  Profile, while making notification preferences a nested Settings screen.
- **Consequences:** Users can review activity updates without conflating them
  with delivery controls. The preference toggles remain local until persistence
  APIs are connected.

### 2026-09-29 - Keep password recovery as a navigable UI prototype

- **Status:** Accepted
- **Context:** The supplied reference defines the full password-reset journey,
  but the current frontend has no connected authentication or email API.
- **Decision:** Make every recovery state navigable in the client so the design
  and interaction flow can be reviewed now, without simulating a real email or
  password update.
- **Consequences:** The screens and transitions are complete for UI review;
  production use still requires backend validation, secure token handling, and
  error/loading states.

### 2026-09-29 - Keep onboarding product-focused

- **Status:** Accepted
- **Context:** The Figma onboarding section includes Suggested Communities and
  Suggested People, while GoMate's agreed product scope excludes communities,
  followers, and generic social discovery.
- **Decision:** Implement the Figma onboarding presentation and all relevant
  setup steps, but omit the two social suggestion screens. Continue from
  Interests to Notifications, Location, and the completion screen.
- **Consequences:** The onboarding remains visually complete and leads directly
  into GoMate's activity workflow without introducing unsupported social
  concepts. Native permission requests remain behind a service-integration TODO.
- **Supersedes:** None.

### 2026-09-29 - Treat Figma as the visual source of truth

- **Status:** Accepted
- **Context:** The existing React Native screens carried a legacy visual system
  that did not match the supplied GoMate UI2 Figma file. Keeping their layouts
  and only changing colors made the product still read as the old frontend.
- **Decision:** Preserve useful navigation, state, types, services, and product
  logic, but replace visual layouts using the Figma typography, spacing,
  controls, image treatment, cards, headers, and navigation patterns. Keep the
  GoMate activity lifecycle as the functional source of truth and do not add
  Figma's unrelated community, social-feed, or follower features. All product
  colors and semantic surfaces must come from the centralized theme.
- **Consequences:** Existing screens may be structurally rewritten even when
  their callbacks remain unchanged. Figma establishes presentation; GoMate's
  Activity → Match → Request → Group → Activity → Rating flow establishes
  behavior.
- **Supersedes:** The legacy screen layouts as implementation references.

### 2026-09-29 - Make the activity lifecycle the product architecture

- **Status:** Accepted
- **Context:** The inherited template included social-style screens, while
  GoMate must help users discover a concrete activity, join a moderated group,
  coordinate it, and close the experience with expenses and ratings.
- **Decision:** Keep the existing lightweight state navigation and reusable UI,
  but organize all primary routes around Activity → Match → Join Request →
  Group → Plan/Expenses → In Progress → Summary → Rating. Use centralized GoMate
  tokens with violet as primary, pink for match actions, and mint for success.
- **Consequences:** The prototype communicates the product purpose immediately
  and can be connected to backend services incrementally. Route state and mock
  mutations remain local until stable API contracts and a navigation library
  are introduced.
- **Supersedes:** The discovery-only interpretation of the Match flow; the
  existing five-tab shell remains accepted.

### 2026-09-28 - Centralize display-language state and translation

- **Status:** Accepted
- **Context:** GoMate needs to switch between Vietnamese and English without
  resetting navigation, filters, or in-progress form values.
- **Decision:** Keep the selected locale in a provider above the complete app
  flow, translate display text through a shared text component, and translate
  non-text props such as placeholders at their reusable component boundary.
- **Consequences:** All screens update immediately from one setting without a
  new runtime dependency. Translation entries remain centralized, while locale
  persistence is deferred until app settings storage is introduced.
- **Supersedes:** None.

### 2026-09-28 - Separate Match management from full-screen discovery

- **Status:** Accepted
- **Context:** Match now needs to support discovery, pending join requests, and
  host-side member approval without crowding the swipe experience.
- **Decision:** Use the Match tab as a persistent management hub and launch the
  swipe deck as a full-screen nested flow without bottom navigation. Keep
  pending and hosted activity management as separate full-screen routes.
- **Consequences:** Discovery stays immersive while request state and host tools
  remain easy to revisit. Nested routes carry explicit return context until a
  navigation library and backend state are introduced.
- **Supersedes:** None.

### 2026-09-28 - Make Match the only activity discovery surface

- **Status:** Accepted
- **Context:** Showing activities on both Home and Match duplicated content and
  weakened the focused swipe-to-discover experience.
- **Decision:** Keep Home as a dashboard for entry points and personal status;
  show activity recommendations only in Match, where each card supports
  horizontal decisions and vertical detail exploration.
- **Consequences:** Activity filtering belongs to Match, while joined and hosted
  items remain accessible from My Activities. The gesture responder must keep
  vertical scrolling and horizontal swiping distinct.
- **Supersedes:** The Home list-discovery portion of "Use a single-card swipe
  deck for Match".

### 2026-09-28 - Use a single-card swipe deck for Match

- **Status:** Accepted
- **Context:** Match should support quick activity discovery rather than repeat
  the list-based Home experience.
- **Decision:** Present exactly one activity card at a time with horizontal
  swipe gestures and explicit like/skip actions; keep list discovery on Home.
- **Consequences:** Home and Match serve distinct browsing modes while sharing
  activity data and filters. Swipe state is local until the backend provides
  persisted recommendations and decisions.
- **Supersedes:** None.

### 2026-09-28 - Keep interests inside the basic profile

- **Status:** Accepted
- **Context:** Interest selection and a separate trip-photo section made initial
  onboarding longer than necessary.
- **Decision:** Use a two-step Login/Register → Complete Profile flow, keep
  interest chips in Basic Information, and remove the trip-photo gallery.
- **Consequences:** Onboarding is shorter and requires photo-library access only
  for the avatar; interest and extended media management can evolve later in the
  main profile experience.
- **Supersedes:** The standalone Select Interests step and the onboarding media
  gallery decision below.

### 2026-09-28 - Use Expo ImagePicker for onboarding media

- **Status:** Accepted
- **Context:** Complete Profile needs real multi-photo selection and camera
  capture rather than a visual-only placeholder.
- **Decision:** Use the SDK-compatible `expo-image-picker` module for avatar,
  gallery, and camera interactions, with a six-photo UI limit.
- **Consequences:** The app requests media/camera permission only when needed,
  does not request microphone access, and keeps selected URIs local until
  backend upload and persistence are added.
- **Supersedes:** The earlier image-picker placeholder implementation.

### 2026-09-28 - Make the repository root the Expo mobile application

- **Status:** Accepted
- **Context:** The requested GoMate deliverable is a React Native/Expo mobile
  flow, while the repository root contained only a Vite starter. A second nested
  project would duplicate configuration and obscure the primary application.
- **Decision:** Replace the Vite starter at the repository root with an Expo SDK
  57 TypeScript app and keep screens/components under the existing `src/`.
- **Consequences:** Mobile development runs directly from the repository root;
  the unused Vite scaffold is removed, and web-specific code would need to be
  reintroduced as a separate application if required later.
- **Supersedes:** None.

## Template

### YYYY-MM-DD - Decision title

- **Status:** Proposed | Accepted | Superseded
- **Context:** What problem or constraint required a decision?
- **Decision:** What was chosen?
- **Consequences:** What becomes easier, harder, or constrained?
- **Supersedes:** Link or title of an older decision, if applicable.

