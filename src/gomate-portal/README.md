# GoMate Portal

The connected portal runs at /portal in the Expo web export and uses /api/portal plus the shared authentication API. There are no demo logins.

See [backend setup, roles and API contracts](../../../GoMate-BE/docs/PORTAL_API.md). Register and verify an account, submit a business application, then have an operator grant an admin role to a verified account using the documented CLI. Staff/Admin permissions are checked on every backend request.

Billing manages Free/Plus entitlement and active/paused/cancelled status; it does not charge money. Business posts are announcements in the portal feed, separate from personal activities.

Validation: npm run typecheck, npm run lint, npx expo-doctor, npm run test:portal:web (requires an exported web build with EXPO_PUBLIC_API_BASE_URL=/api and a MongoDB test binary). The test uses isolated accounts and does not alter the configured application database.
