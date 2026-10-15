# Match, location and profile media

Match supports personal/business organizer filters, estimated-cost filters (no
payment/deposit filter), and recommended/nearest/soonest ordering. Applying a
filter saves it to the current account. The heart on a card saves an activity;
open **Match → Hoạt động yêu thích** to review or remove saved activities.

Recommended ordering uses explicit profile interests and bounded category signals
from skips, requests to join, favorites and “not interested”. Filters still apply;
ranking happens on BE before paging. This is deterministic scoring, not a trained
machine-learning model. Existing activities without organizerType remain personal.

Use **Bộ lọc → Khu vực → Dùng vị trí hiện tại** or **Chọn trên bản đồ**. Enable
“Chỉ tìm trong bán kính” for 1/5/10/20/50 km filtering. Nearest requires a point.
Precise coordinates are sent for the current search and are not saved with account
filters. After reload, saved nearest/radius settings ask for a fresh point. Only
activities with a pinned location can appear in geographical searches. Hosts can
pin or clear the activity's point during creation/editing. GPS permission is only
requested after the user presses the GPS button; no background location tracking.

BE serves `/map.html`, `/map-ui/*` and local `/map-assets/*` Leaflet assets. Tiles
come from OpenStreetMap and need internet; attribution remains visible. A tile
failure shows an inline status. When Expo and BE run on different origins, include
the Expo origin in BE `CORS_ORIGIN` so the map can be embedded. Same-origin web
exports need no additional origin. Use an absolute EXPO_PUBLIC_API_BASE_URL on
native devices. Rebuild a native app after installing the new native dependencies.

Profile editing supports a separate cover (JPEG/PNG/WebP, up to 10 MB, normalized
to 1600×600), plus an album of up to six photos, each at most 10 MB. Upload multiple
photos, reorder, view full-screen with previous/next, and confirm removal. Covers
appear on the profile, its preview and the existing public profile modal. Existing
avatar limits remain 2 MB.

## Optional Google provider activation

Provider setup was deferred; no client credentials or cloud project were created.
Email login remains available. Web reads the public client ID from the BE
`GET /api/auth/google/config` endpoint; absent configuration displays a clear
unavailable state instead of simulating a sign-in. GIS script failures can retry.

When setup is resumed, set BE `GOOGLE_CLIENT_ID` to the web OAuth client ID and
register the actual web origins in Google. Native uses the same server audience,
`EXPO_PUBLIC_GOOGLE_NATIVE_ENABLED=true`, the native platform registrations, and
an iOS client ID via `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` where applicable. The Expo
config adds the iOS callback scheme from that ID. Android registration must match
the app package/signing certificate. Use a development/production native build;
physical-device sign-in and a real Google account were not tested in this task.
Never place a Google client secret in EXPO_PUBLIC variables.

## Validation

The browser smoke test uses a real isolated MongoDB/API and mocked provider
credentials only for the Google SDK callback. Browser geolocation is simulated;
map click handling and server distance queries execute normally. This does not
verify a real Google project, physical GPS precision, or native device rendering.

References: [Expo Location SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/),
[GIS button](https://developers.google.com/identity/gsi/web/guides/display-button),
[Native Google Expo setup](https://react-native-google-signin.github.io/docs/setting-up/expo),
[Leaflet](https://leafletjs.com/reference.html).
