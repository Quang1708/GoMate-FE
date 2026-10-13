# Decision log

Record decisions here when they materially affect architecture, dependencies,
security, the data model, or product behavior. Keep the newest decision at the
top. Small implementation details belong only in `DEVELOPMENT_LOG.md`.

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

