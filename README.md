# GoMate Mobile

Ứng dụng tìm người cùng tham gia một hoạt động cụ thể, được xây dựng bằng React
Native, Expo SDK 57 và TypeScript. Luồng hiện tại gồm đăng nhập/đăng ký, xác minh
email, hoàn thiện hồ sơ và khu vực ứng dụng chính với năm tab: Trang chủ, Match,
Tạo, Tin nhắn và Hồ sơ.

Tab Match là trung tâm tìm và quản lý hoạt động: mở chế độ khám phá toàn màn hình,
xem chi tiết, gửi yêu cầu tham gia, xem yêu cầu đang chờ, hoặc quản lý hoạt động
đã đăng và duyệt thành viên. Khi được duyệt, mỗi hoạt động có nhóm riêng với
Chat, Kế hoạch, Chi phí và Thành viên, sau đó đi qua trạng thái đang diễn ra,
tổng kết và đánh giá.

## Chạy dự án

```powershell
npm.cmd install
npm.cmd start
```

Quét QR bằng Expo Go hoặc nhấn `a` để mở Android emulator. Trên PowerShell, dùng
`npm.cmd` nếu chính sách thực thi chặn `npm.ps1`.

## Kiểm tra

- `npm.cmd run typecheck`: kiểm tra TypeScript.
- `npm.cmd run lint`: kiểm tra mã bằng Expo ESLint.
- `npx.cmd expo-doctor`: kiểm tra cấu hình và dependency Expo.
- `npx.cmd expo export --platform android --output-dir dist`: tạo Android bundle.

## Cấu trúc chính

- `App.tsx`: điều phối xác thực, onboarding và ứng dụng chính.
- `src/screens/`: toàn bộ màn hình auth, profile, dashboard, Match, bộ lọc,
  tạo hoạt động, tin nhắn và các luồng phụ.
- `src/components/`: header, bottom navigation, activity card và UI dùng lại.
- `src/data/activities.ts`: dữ liệu activity mẫu cho Match.
- `src/services/api.ts`: URL API, Bearer token, đăng nhập/đăng xuất, lỗi và timeout.
- `src/services/activityApi.ts`: khám phá, hoạt động đã tham gia/tổ chức, yêu cầu và thành viên.
- `src/services/activityService.ts`: chuyển form tạo hoạt động sang contract BE, giờ Việt Nam sang UTC và upload ảnh bìa.
- `src/assets/Activity-image/`: ảnh prototype cũ; dữ liệu hoạt động API dùng ảnh trực tuyến.
- `docs/`: nhật ký phát triển và quyết định sản phẩm/kỹ thuật.

## Kết nối BE

Sao chép `.env.example` thành `.env.local`. Dùng `EXPO_PUBLIC_API_BASE_URL` theo
[quy tắc biến môi trường Expo](https://docs.expo.dev/guides/environment-variables/).

- Expo web: `http://localhost:3000/api`, BE `CORS_ORIGIN=http://localhost:8081,http://127.0.0.1:8081`.
- Android emulator: `http://10.0.2.2:3000/api`.
- Điện thoại thật: `http://<IP-LAN-máy-tính>:3000/api`, BE `HOST=0.0.0.0`; điện thoại và máy tính cùng mạng.
- Web chung server: build với `EXPO_PUBLIC_API_BASE_URL=/api`, rồi chạy BE và mở `http://127.0.0.1:3000`.

Khởi động BE bằng `npm.cmd start` tại `../GoMate-BE`, FE bằng `npm.cmd run web`
tại thư mục này. Khởi động lại Expo sau khi thay đổi biến môi trường.
Đăng ký/xác minh email và đăng nhập dùng API thật; mã xác minh có 6 số, mật khẩu
cần 6–128 ký tự, không bắt buộc chữ hoa/số/ký tự đặc biệt. Xác minh email thành công
tự cấp phiên đăng nhập và vào app. Token hiện giữ trong bộ nhớ; tải lại ứng dụng cần đăng nhập lại.

Home, Match, tạo hoạt động, chờ duyệt, host duyệt/từ chối, danh sách đã tham gia
và thành viên đã nối BE. `/activities/mine` chỉ dùng cho hoạt động host tổ chức;
`/me/activities` dùng cho hoạt động đã được duyệt, `/me/join-requests?status=pending`
dùng cho yêu cầu chờ. Danh sách có phân trang tự tải đủ và kéo xuống để làm mới.
Thao tác rời/loại thành viên chỉ khả dụng trước khi hoạt động bắt đầu.

Tạo hoạt động hỗ trợ một ảnh bìa JPEG/PNG/WebP tối đa 2 MB; upload cần Cloudinary.
Cấu hình quỹ được lưu trong BE, chưa thực hiện giao dịch tiền. Ngày nhập
`DD/MM/YYYY`, giờ `HH:mm`; hạn đăng ký/đóng tiền phải không muộn hơn giờ bắt đầu.

Hồ sơ dùng GET/PATCH `/profile/me` và PUT `/profile/me/avatar`. App nhắc hoàn thiện
khi thiếu họ tên, khu vực, giới thiệu, sở thích hoặc ngôn ngữ. Giới tính, ngày sinh,
tôn giáo và khả năng uống rượu là thông tin tự nguyện; không tính vào độ hoàn thiện.

Match và tạo hoạt động dùng lịch chọn ngày, các buổi sáng/chiều/tối và giờ cụ thể
theo mốc 15 phút (có thể nhập HH:mm khác). Match gửi ngày/giờ chính xác tới BE;
số thành viên hỗ trợ tối thiểu và tối đa. Tùy chọn nâng cao mặc định đóng, gồm giới
tính, ngôn ngữ, tôn giáo, khả năng uống rượu và dress code. Điều kiện do host chọn
được lưu và BE kiểm tra với hồ sơ khi xin tham gia; không suy đoán thông tin cá nhân.

## Dữ liệu demo TP.HCM

Đã thêm 20 hoạt động demo vào database cấu hình trong BE. Chạy lại an toàn,
không tạo bản trùng hoặc ghi đè hoạt động/tài khoản cũ:

```powershell
cd ..\GoMate-BE
npm.cmd run db:seed-demo
```

- Người tham gia: `demo@gomate.local`.
- Host: `host1@gomate.local`, `host2@gomate.local`, `host3@gomate.local`.
- Thành viên mới: `member1@gomate.local` đến `member10@gomate.local`.
- Mật khẩu mặc định: `gomate123`; có thể đặt `DEMO_PASSWORD` trước lần tạo đầu.

14 tài khoản demo đã xác minh email, có hồ sơ đầy đủ, avatar và ảnh bìa trực tuyến.
Các hoạt động có ảnh Unsplash riêng, mỗi nhóm 3–5 người tính cả host và một yêu cầu chờ duyệt.
Bấm tên thành viên để xem hồ sơ có avatar/ảnh bìa; public profile không trả email,
ngày sinh hoặc các tùy chọn cá nhân nhạy cảm. Các hoạt động bắt đầu từ ngày sau lần seed đầu,
trải trong 10 ngày, có tọa độ, lịch, chi phí, quy mô và một số điều kiện nâng cao.
Đây là dữ liệu minh họa, không phải lịch sự kiện thật. Seed lại giữ nguyên ngày đã lưu
và không phục hồi người đã rời nhóm. Nguồn ảnh: [docs/demo.md](../GoMate-BE/docs/demo.md).

Các màn hình tin nhắn/chat, thông báo, tiến trình, chi phí và đánh giá vẫn
là prototype. Google/Apple chưa tích hợp UI đăng nhập. Chưa kiểm tra trên thiết bị thật.

`npm.cmd run test:integration` chạy service FE thực tế với BE và MongoDB tạm,
không ghi vào database ứng dụng. Cần cài dependencies ở cả hai thư mục;
MongoDB binary được tải ở lần kiểm thử đầu tiên.
