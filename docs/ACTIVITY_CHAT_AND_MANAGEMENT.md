# Activity creation, inbox and host management

- Consumer activity creation always publishes a personal activity. There is no business
  toggle; the API independently rejects consumer business publishing and conversion.
- Category selection shares the searchable wheel picker, offers six popular shortcuts
  and 56 supported categories. `Khác` allows a custom tag.
- Registration deadlines offer start time, 6 hours, 12 hours, 1 day before start, and a
  custom date/time. Relative choices follow changes to the start time until publication.
  Invalid or elapsed deadlines block continuation. Errors appear above the fixed footer.
- After publication, management shows an activity selector, state/roster/request counts,
  schedule, action rows, pending request decisions and an informative empty state.
- Opening a group immediately opens persistent chat. Top tabs are Chat, Kế hoạch and
  Thành viên; only the host sees Quản lý. The inbox and activity routes lead to the same
  group workspace. Cost estimates are under Kế hoạch.
- Quản lý uses shared backend-connected controls for schedule confirmation, approvals,
  editing, deletion, start, attendance and completion. Consequential actions require an
  explicit confirmation. Schedule edits clear confirmation; chatting needs no start.
- Inbox supports accent-insensitive search and All/Unread/Group/Direct filters, actual
  avatars, actual unread counts and schedule status. Chat shows day separators, sender
  names, message times, text selection, pagination, retry and a fixed multiline composer.
  The single check means the message was sent, not that recipients read it.
- Refresh: authenticated SSE drives chat updates, with 15-second reconciliation and
  3-second polling while disconnected; inbox/group metadata refresh every 10 seconds.
  No attachments, fake online indicators or fake payment-sharing events are displayed.

Validation uses isolated temporary MongoDB databases and two browser sessions in
`npm run test:trip:web`; the full application regression is `npm run test:web`.
Physical keyboard behavior on iOS/Android still needs device testing.
