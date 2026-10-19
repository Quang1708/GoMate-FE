# GoMate Portal Module

The visual module was merged from `origin/htan-ui-web`. Its original `GoMatePortal.jsx` and preview remain a standalone design reference. The application renders `ConnectedPortal.jsx` at `/portal`, using the same visual foundations with real authentication, business applications, moderation and publication APIs. `/demo` provides normal-login demo accounts and walkthroughs; see [the demo guide](../../docs/DEMO_GUIDE.md).

The original preview's mock credentials/data are not used by the live portal. Native builds resolve a platform fallback and do not import DOM/CSS modules. The live portal reads the authenticated user's role from `/api/portal/me`, not a role selector.

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
- `/register` - business verification registration
- `/business` - business dashboard and post studio
- `/staff` - moderation, reports, and support tickets
- `/admin` - global metrics, business review, and users/subscriptions

Demo accounts are prefilled by the role selector:

- Business: `business@gomate.app` / `business123`
- Staff: `staff@gomate.app` / `staff123`
- Admin: `admin@gomate.app` / `admin123`
