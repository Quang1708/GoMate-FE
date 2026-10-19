# Demo GoMate với hai trình duyệt

## Chuẩn bị

Đặt hai repository cạnh nhau: `GoMate-FE` và `GoMate-BE`. Dùng nhánh `fe-ui2` ở cả hai vì luồng doanh nghiệp cần API mới.

1. Cài dependency theo lockfile bằng `npm ci` trong từng repository.
2. Cấu hình `GoMate-BE/.env` với MongoDB local/Atlas. Tại BE chạy `npm run dev`.
3. Tại FE chạy `npm run demo:seed`, rồi `npm run web`.
4. Mở <http://localhost:8081/demo>. Có thể mở portal tại <http://localhost:8081/portal>.

Seed chỉ tạo tài khoản/dữ liệu minh họa có tên riêng, không xóa dữ liệu hiện có. Chạy lại giữ nguyên mật khẩu, thành viên và trạng thái hoạt động đã lưu. Khi bài mẫu đã hết hạn/kết thúc, seed tạo mẫu sắp diễn ra mới. Lệnh này bị chặn khi `NODE_ENV=production`; không chạy seed trên database thật của môi trường production.

Mật khẩu mặc định khi tạo lần đầu: `DemoGoMate123!`. Có thể đặt `WORKSHOP_DEMO_PASSWORD` trước lần seed đầu tiên. Trang demo đăng nhập bình thường qua API; không tự đổi vai trò và không bỏ qua xác thực.

| Tài khoản | Vai trò demo |
| --- | --- |
| `demo.host@gomate.local` | Host cá nhân, có bài mẫu “DEMO · Cà phê kết bạn” |
| `demo.member@gomate.local` | Người tham gia ở trình duyệt thứ hai |
| `demo.business@gomate.local` | Doanh nghiệp đã xác minh, tạo sự kiện/ưu đãi |
| `demo.staff@gomate.local` | Staff duyệt hồ sơ và bài đăng |
| `demo.newbusiness@gomate.local` | Tài khoản đối tác mới để thử gửi hồ sơ xác minh |

## Luồng cá nhân

1. Chrome: vào `/demo`, chọn host. Có thể tạo bài mới hoặc dùng bài mẫu.
2. Edge hoặc cửa sổ ẩn danh: chọn người tham gia. Tại **Tìm hoạt động**, nhập tên bài hoặc `DEMO`; nhấn tìm kiếm/làm mới. Tính năng này cũng nằm ở biểu tượng tìm kiếm trong Match.
3. Gửi yêu cầu tham gia. Host mở **Quản lý → Duyệt**. Người tham gia vào nhóm từ thông báo hoặc bài đăng.
4. Chat có thư viện ảnh/tệp ở góc phải; menu ba chấm mở kế hoạch, thành viên, quản lý (host), làm mới và sao chép liên kết. Liên kết bài có thể gửi cho trình duyệt thứ hai sau khi đăng nhập.
5. Host mở **Quản lý → Chốt lịch → Bắt đầu → Điểm danh**. Timeline chỉ nằm trong Quản lý.
6. Điểm danh cả host và thành viên là Có mặt/Đến muộn trước khi kết thúc. Thành viên mở **Kế hoạch → Xem tổng kết → Đánh giá trải nghiệm**.

Hai tab thường trong cùng một trình duyệt dùng chung phiên đăng nhập. Để demo hai người cùng lúc, dùng hai trình duyệt, hai profile hoặc một cửa sổ ẩn danh riêng.

## Luồng doanh nghiệp

1. Chọn doanh nghiệp đã xác minh để tạo sự kiện ngay. Nếu muốn thử từ bước đăng ký, chọn đối tác mới và tải hồ sơ PDF/PNG/JPEG (tối đa 10 MB).
2. Staff mở portal, kiểm tra hồ sơ và duyệt doanh nghiệp. Đối tác bấm **Làm mới** để thấy quyền tạo sự kiện.
3. Doanh nghiệp nhập lịch, địa điểm, sức chứa, giá sau ưu đãi, % giảm, nội dung và điều kiện ưu đãi; gửi cho staff.
4. Staff bấm **Duyệt và đưa lên app**. Bài chờ duyệt/từ chối không xuất hiện trong tìm kiếm hoạt động.
5. Người tham gia tìm tên bài trong app. Thẻ có viền xanh, nhãn **Doanh nghiệp đã xác minh**, % giảm và ưu đãi. Mở chi tiết để đọc điều kiện.
6. Thành viên tự đăng ký và chờ doanh nghiệp xác nhận. Nhóm doanh nghiệp dùng lịch chính thức đã duyệt; không giữ chỗ khách hoặc thêm bạn bè trực tiếp. Doanh nghiệp vẫn điều hành chat, kế hoạch, điểm danh và kết thúc.

Giá/ưu đãi là thông tin do đơn vị tổ chức công bố; GoMate chưa xử lý thanh toán. Các bài có chữ DEMO là dữ liệu minh họa.

## Kiểm thử tự động

- `npm run test:business:web`: gửi hồ sơ, staff duyệt, tạo/duyệt bài, tìm thẻ ưu đãi, join và chat giữa các phiên độc lập; kiểm tra thư viện/menu và responsive.
- `npm run test:lifecycle:web`: nhóm cá nhân, kế hoạch, chốt lịch, điểm danh, kết thúc và rating.
- `npm run test:trip:web`, `npm run test:web`, `npm run test:community:web`, `npm run test:maps:web`: hồi quy các luồng hiện có.

Các bài kiểm thử dùng MongoDB tạm, không gửi email thật hoặc ghi vào database ứng dụng. Chạy Expo web export với `EXPO_PUBLIC_API_BASE_URL=/api` trước các kiểm thử web. Chưa xác minh thao tác bàn phím/chia sẻ trên điện thoại thật.
