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
- A four-stage timeline appears only inside host Management: planning, schedule confirmed,
  in progress, completed. Chat shows an informational status notice for both roles,
  without a timeline or lifecycle buttons. Plans and Members also have no timeline.
- Quản lý puts the next host action and appointment at the top. Kế hoạch links directly
  to these controls. While running, “Điểm danh & kết thúc” opens attendance, where the
  finish action is visible at the top. Completion warns about unmarked members because
  only present/late accounts can rate. Progress/summary have no timeline. Plans provides
  access to progress while running and the summary/review flow after completion.
- Timeline state comes from the API, including after reload and schedule edits; starting
  without confirmation remains allowed and does not falsely mark the schedule confirmed.
- Inbox supports accent-insensitive search and All/Unread/Group/Direct filters, actual
  avatars, actual unread counts and schedule status. Chat shows day separators, sender
  names, message times, text selection, pagination, retry and a fixed multiline composer.
  The single check means the message was sent, not that recipients read it.
- Shared media/files/links are opened from the album icon at the top right of the group
  or direct-chat header, not a separate row above messages. The adjacent menu opens
  plans, members and host management where applicable, refreshes messages without
  discarding the composer, and copies/shares a protected deep link.
- Attendance uses a completion bar, counts, status filters and one selectable state per
  member. Plans use appointment/price/roster cards, readable itinerary milestones and
  document download/link cards. The phase timeline remains exclusive to host Management.
- Verified business event cards have a green border, verification identity and offer
  percentage/content. The approved appointment is official; participants register and
  wait for the organizer to approve them. Business groups do not add friends or anonymous
  reserved companions. Plans can be updated by the organizer while event metadata stays
  under portal moderation.
- Refresh: authenticated SSE drives chat updates, with 15-second reconciliation and
  3-second polling while disconnected; inbox/group metadata refresh every 10 seconds.
  Attachments use authenticated storage; no fake online indicators or payment events are shown.

Validation uses isolated temporary MongoDB databases and two browser sessions in
`npm run test:trip:web`; the full application regression is `npm run test:web`.
`npm run test:lifecycle:web` covers two initial members, a new join, plan editing,
confirmation/cancellation, schedule changes, attendance, completion and rating across
host/member sessions, including 360/390/768/1440 px chat layouts.
Physical keyboard behavior on iOS/Android still needs device testing.

See [the two-browser demo guide](DEMO_GUIDE.md) for `/demo`, `/portal`, demo seed commands
and the business/staff workflow. `npm run test:business:web` verifies the real API flow.
