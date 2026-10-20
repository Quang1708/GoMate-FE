# GoMate Portal

The partner portal (`PartnerPortal.jsx`) runs at `/portal` and `/business`; `ConnectedPortal.jsx` serves `/admin` and `/staff`. Both use `/api/portal` and shared authentication. Routing does not depend on a demo email domain.

`GoMatePortal.jsx` contains shared visual components only; mock login, local-storage accounts and fabricated dashboards have been removed. `/demo` is an explicit test-account launcher using real API authentication; see [the demo guide](../../docs/DEMO_GUIDE.md).

Native builds resolve a platform fallback and do not import DOM/CSS modules. When a portal API session exists, the connected dashboard reads the authenticated user's role from `/api/portal/me`.

See [backend setup, roles and API contracts](../../../GoMate-BE/docs/PORTAL_API.md). Register and verify an account, submit a business application, then have an operator grant an admin role to a verified account using the documented CLI. Staff/Admin permissions are checked on every backend request.

Billing reads the authenticated account's Free/Plus entitlement from `/api/portal/me`; support requests and replies use `/api/portal/tickets`. It does not charge money. Partner event posts use `/api/portal/posts` and become activities after staff approval. Categories come from `/api/portal/options`; prices, dates, location, discounts and itinerary are entered by the business.

Validation: npm run typecheck, npm run lint, npx expo-doctor, npm run test:portal:web (requires an exported web build with EXPO_PUBLIC_API_BASE_URL=/api and a MongoDB test binary). The test uses isolated accounts and does not alter the configured application database.

```jsx
import GoMatePortal from './gomate-portal';

export default function PortalScreen() {
  return <GoMatePortal />;
}
```

The module uses a small history-based router so it works with the current dependency set:

- `/login` - unified role login
- `/register` - Staff or Business account registration (Admin is not available)
- `/business` - business dashboard and post studio
- `/staff` - moderation, reports, and support tickets
- `/admin` - global metrics, business review, and users/subscriptions

The standalone mock portal stores its accounts, active session, verification
applications, and business approval status in browser `localStorage`. Partner
registration collects the company verification details before account creation.
After submission, the business workspace shows an application status until an
Admin sets `isApproved: true`; its next sign-in opens the full dashboard. Admin
accounts are only available through the preconfigured demo account.

Demo accounts are prefilled by the role selector:

- Business: `business@gomate.app` / `business123` (starts pending review)
- Staff: `staff@gomate.app` / `staff123`
- Admin: `admin@gomate.app` / `admin123`

Mock registrations are local to the current browser and are for portal UI
development only. The connected portal's mock login sets an in-memory role and
does not create an API session. Its role workspace remains on `/portal` because
the host Expo router does not define top-level `/admin`, `/staff`, or `/business`
routes.

The connected portal login test accounts are:

- Admin: `admin@gomate.app` / `admin123` → Admin workspace
- Staff: `staff@gomate.app` / `staff123` → Staff workspace
- Business: `partner@gomate.app` / `partner123` → Business workspace

## Development Log

### 2026-10-19: Original auth layout and partner forms

- Restored the original two-column AuthShell login layout and kept the dynamic Staff and Partner forms in its form panel. Aligned the Back to Login control on its own row beneath the logo. Partner sign-up collects company, tax, address, contact, and verification document details before account creation. Connected mock login renders the full role dashboards; the Business dashboard no longer contains a verification form.
- Changed `ConnectedPortal.jsx`, `connected-portal.css`, `GoMatePortal.jsx`, `gomate-portal.css`, and this README.
- Verification: targeted ESLint (with the existing `react-hooks/set-state-in-effect` rule suppressed), `npm run lint`, `npm run typecheck`, `npx expo-doctor` (21/21 checks), and `git diff --check` passed. No tests were run.
- Remaining: mock sign-in does not create an API session; role dashboards render inside `/portal` because the host Expo router does not define top-level role URLs. The host does not compile Tailwind utilities, so the restored AuthShell stylesheet provides the rendered styling.

### 2026-10-19: Role registration and business verification

- Added Staff and Business registration, protected role routes, a required business verification step, and an approval-driven transition to the approved dashboard. Added community chat and wired admin decisions to mock application state.
- Changed `GoMatePortal.jsx`, `gomate-portal.css`, and this README.
- Verification: targeted ESLint, `npm run lint`, `npm run typecheck`, `npx expo-doctor`, and `git diff --check` passed. No tests were run.
- Remaining: mock accounts and approvals are browser-local; the live `/portal` component remains API-backed.

## Staff data and moderation

/staff reads queue counts from /api/portal/metrics, including pendingBusinesses and approvedPosts. Applications, posts, reports, tickets and feed all use authenticated portal endpoints. No shift status or SLA is inferred from login. Run `node tests/staff.web.cjs` after exporting the web build to verify the staff flow against an isolated database.
