# GoMate Portal Module

This folder is a standalone React module for the GoMate web portal. It does not modify the existing app entry point, router, or styles.

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
