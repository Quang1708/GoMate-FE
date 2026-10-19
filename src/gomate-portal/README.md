# GoMate Portal Module

The visual module was merged from `origin/htan-ui-web`. Its original `GoMatePortal.jsx` and preview remain a standalone design reference. The application renders `ConnectedPortal.jsx` at `/portal`, using the same visual foundations with business applications, moderation and publication APIs. Its login screen uses mock test accounts and renders the selected role workspace inside the portal. `/demo` provides normal-login demo accounts and walkthroughs; see [the demo guide](../../docs/DEMO_GUIDE.md).

Native builds resolve a platform fallback and do not import DOM/CSS modules. When a portal API session exists, the connected dashboard reads the authenticated user's role from `/api/portal/me`.

## Use

Render the default export from an existing screen or app entry when you are ready to connect it:

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
