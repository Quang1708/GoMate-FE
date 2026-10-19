# GoMate Mobile

Demo hai trình duyệt, portal doanh nghiệp và quy trình staff duyệt bài: [hướng dẫn demo](docs/DEMO_GUIDE.md). Tạo dữ liệu bằng `npm run demo:seed`, mở `/demo` hoặc `/portal` trên web.

Ứng dụng tìm người cùng tham gia một hoạt động cụ thể, được xây dựng bằng React
Native, Expo SDK 57 và TypeScript. Luồng hiện tại gồm đăng nhập/đăng ký, xác minh
email, hoàn thiện hồ sơ và khu vực ứng dụng chính với năm tab: Trang chủ, Match,
Tạo, Tin nhắn và Hồ sơ.

Tab Match là trung tâm tìm và quản lý hoạt động: mở chế độ khám phá toàn màn hình,
xem chi tiết, gửi yêu cầu tham gia, xem yêu cầu đang chờ, hoặc quản lý hoạt động
đã đăng và duyệt thành viên. Khi được duyệt, mỗi hoạt động có nhóm riêng với
Chat, Kế hoạch và Thành viên (host có thêm Quản lý), sau đó đi qua trạng thái đang diễn ra,
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
- `node --test tests/profile-date.test.cjs`: kiểm tra định dạng, xóa ký tự và ngày sinh hợp lệ.
- `npm.cmd run test:integration`: chạy dịch vụ FE với BE và MongoDB tạm thời.
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
- `src/services/activityService.ts`: chuyển form tạo hoạt động sang contract BE, giờ Việt Nam sang UTC và upload bộ ảnh.
- `src/assets/Activity-image/`: ảnh prototype cũ; dữ liệu hoạt động API dùng ảnh trực tuyến.
- `docs/`: nhật ký phát triển và quyết định sản phẩm/kỹ thuật.

## Kết nối BE

Khi phát triển, để trống `EXPO_PUBLIC_API_BASE_URL`: app lấy địa chỉ máy chạy Expo
(native) hoặc hostname của trình duyệt (web), dùng API cổng `3000`. Cách này tránh
IP LAN cũ khi đổi Wi-Fi. Backend cần đang chạy; thiết bị thật dùng chung mạng với
máy tính và BE đặt `HOST=0.0.0.0`. Expo tunnel không tự đưa API lên internet;
trường hợp đó cần cấu hình URL API riêng.

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
tự cấp phiên đăng nhập và vào bước hoàn thiện hồ sơ. Trên web, phiên đăng nhập được lưu trong localStorage,
khôi phục khi tải lại và bị xóa khi đăng xuất hoặc API trả 401; thời hạn do BE quản lý.
Các màn hình dùng URL hash `#/app/<tab>/<screen>/<id>` và hỗ trợ Back/Forward.
Trên native, token được lưu bằng Expo SecureStore và khôi phục khi mở lại app.

Home, Match, tạo hoạt động, chờ duyệt, host duyệt/từ chối, danh sách đã tham gia
và thành viên đã nối BE. `/activities/mine` chỉ dùng cho hoạt động host tổ chức;
`/me/activities` dùng cho hoạt động đã được duyệt, `/me/join-requests?status=pending`
dùng cho yêu cầu chờ. Danh sách có phân trang tự tải đủ và kéo xuống để làm mới.
Thao tác rời/loại thành viên chỉ khả dụng trước khi hoạt động bắt đầu.

Tạo/sửa hoạt động hỗ trợ tối đa 6 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 10 MB;
ảnh đầu là ảnh bìa, upload cần Cloudinary. Số thành viên từ 2–1000, tính cả host.
Chi phí dự kiến không bắt buộc; không yêu cầu cọc, đóng đủ hoặc hạn đóng tiền.
Ngày nhập `DD/MM/YYYY`, giờ `HH:mm`; hạn đăng ký không muộn hơn giờ bắt đầu.
Host có thể sửa trước giờ bắt đầu, xóa (có xác nhận), bắt đầu, điểm danh và kết thúc
(có xác nhận). Điểm danh và lịch sử cập nhật lưu trên BE; sau khi kết thúc không thể sửa điểm danh.

Hồ sơ dùng GET/PATCH `/profile/me` và PUT `/profile/me/avatar`. App yêu cầu hoàn thiện
theo hai bước: (1) họ tên, ngày sinh, giới tính, tỉnh / thành phố và ngôn ngữ;
(2) giới thiệu, sở thích và gợi ý tìm người đồng hành. Ngày sinh hiển thị `DD-MM-YYYY`,
tự chèn dấu khi gõ và có bộ chọn cuộn ngày/tháng/năm; API vẫn dùng `YYYY-MM-DD`.
Có thể chọn giới tính "Không tiết lộ". Ngôn ngữ dùng bộ chọn cuộn, mặc định
Tiếng Việt, chọn từ một ngôn ngữ trở lên. Khu vực chỉ chọn cấp tỉnh/thành phố;
danh mục theo [Cổng TTĐT Chính phủ](https://chinhphu.vn/cac-tinh-thanh-pho-68349).
Sở thích hỗ trợ tìm không dấu, thêm mục riêng và chọn tối đa 12 mục.

Hồ sơ GoMate có tab chỉnh sửa/xem trước, tối đa 6 ảnh hoạt động cá nhân (10 MB/ảnh),
sắp xếp bằng nút trước/sau, mục tiêu tìm bạn đồng hành, thời gian rảnh, hai câu gợi ý,
công việc và học vấn tùy chọn. Avatar đầu trang dùng ảnh tài khoản và mở tab hồ sơ.
Menu hồ sơ có chỉnh sửa, xem trước, xác minh, điểm đánh giá, hoạt động, thông báo
và cài đặt. Xác minh hiện hiển thị trạng thái email; chưa có xác minh giấy tờ.
Trang điểm đánh giá đọc dữ liệu đã lưu trong `activity_ratings`, có trạng thái chưa
có đánh giá; người đã điểm danh có mặt/đến muộn có thể gửi đánh giá thật sau hoạt động.

Trong Match, nút quay lại mở ngay bài vừa bỏ qua, không hiện cảnh báo. Sau khi
quay lại, nút bị vô hiệu hóa cho tới lần bỏ qua kế tiếp; không thể lùi qua hai bài
liên tiếp. Chấp nhận một hoạt động sẽ xóa lịch sử bỏ qua ngay trước đó.

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

Chat, thông báo, tiến trình và đánh giá đã nối API thật. Chi phí là dự toán, chưa có xử lý giao dịch.
Google đã có luồng tích hợp nhưng chưa cấu hình provider theo yêu cầu; Apple chưa tích hợp.
Chưa kiểm tra trên thiết bị thật.

`npm.cmd run test:integration` chạy service FE thực tế với BE và MongoDB tạm,
không ghi vào database ứng dụng. Cần cài dependencies ở cả hai thư mục;
MongoDB binary được tải ở lần kiểm thử đầu tiên.

## Kiểm thử trình duyệt P0

`npm run test:web` dùng Playwright, BE thật và MongoDB tạm thời; email và kho ảnh
được thay bằng bộ nhớ, không gửi email hoặc ghi Cloudinary. Kiểm thử bao gồm
Back/Forward, tải lại, responsive 390/768/1440 px, chọn nhiều ảnh, sửa/xóa,
bắt đầu/kết thúc/điểm danh, OTP và đăng ký → hoàn thiện hồ sơ.

```powershell
$env:EXPO_PUBLIC_API_BASE_URL='/api'
npx.cmd expo export --platform web --clear
npm.cmd run test:web
```

Chrome trên Windows được phát hiện tự động; nếu chưa có trình duyệt, chạy
`npx playwright install chromium`, hoặc đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.
Ảnh chụp được ghi vào thư mục tạm và in đường dẫn khi chạy. Nếu đã có MongoDB binary,
có thể đặt `MONGOMS_SYSTEM_BINARY` để dùng lại thay vì tải binary kiểm thử.

Match P1/P2, bản đồ/GPS, yêu thích, ảnh bìa và Google tùy chọn: [docs/MATCH_FEATURES.md](docs/MATCH_FEATURES.md).

Luồng tạo hoạt động 4 bước, kế hoạch chuyến đi và bạn bè/chat: [docs/ACTIVITY_CREATION_AND_FRIENDS.md](docs/ACTIVITY_CREATION_AND_FRIENDS.md).

Giao diện tạo bài, quản lý host và chat mới: [docs/ACTIVITY_CHAT_AND_MANAGEMENT.md](docs/ACTIVITY_CHAT_AND_MANAGEMENT.md).

Cài đặt, thông báo, đánh giá và an toàn: [docs/ACCOUNT_COMPLETION.md](docs/ACCOUNT_COMPLETION.md).

## Mapbox

Bản đồ, GPS, ghim, bán kính và tuyến đường dùng Mapbox; gợi ý địa chỉ/địa điểm dùng VIETMAP Autocomplete/Place v4 qua BE khi có `VIETMAP_API_KEY`. Đặt `MAPBOX_ACCESS_TOKEN` (public `pk.` token) trong `GoMate-BE/.env`; không cần Google Maps key. Xem [hướng dẫn Mapbox](docs/MAPBOX_SETUP.md). Khi không cấu hình token, bản đồ OSM/GPS vẫn có thể dùng. Chạy `npm.cmd run test:maps:web` để kiểm tra FE/BE với provider giả lập; `npm.cmd run test:maps:live` kiểm tra API và bản đồ thật bằng token local (có gọi dịch vụ tính phí).

## Bản nháp và khung chat

Bấm **Lưu nháp** ở màn tạo để lưu nội dung đang làm theo tài khoản và tiếp tục đúng bước lần sau. Xem [bản nháp, người đi cùng và khung chat](docs/DRAFTS_AND_CHAT_COMPOSER.md).
