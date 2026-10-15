# Chat, hồ sơ và các bước tiếp theo

Ngày rà soát: 16-10-2026.

## Đã nối FE và BE trong lần này

- Chỉnh sửa và xem trước hồ sơ nằm trong khung avatar tại trang Hồ sơ của tôi, cùng trang có menu Cài đặt. Theo đính chính của người dùng, không thay đổi avatar trong bản xem trước hoạt động. Match/detail vẫn lấy avatar host theo hồ sơ hiện tại.
- Chat riêng và chat hoạt động gửi được ảnh, video, tệp và một vị trí GPS do người dùng chủ động chia sẻ. Có chụp ảnh, xem ảnh lớn, phát video, tải/chia sẻ tệp và mở vị trí bằng ứng dụng bản đồ.
- Thư viện của mỗi cuộc trò chuyện chia Ảnh/video, Tệp, Liên kết, Vị trí; có phân trang và xem lại sau tải lại trang. Tệp âm thanh hiện nằm trong mục media và được tải/mở bằng ứng dụng trên thiết bị; chưa có ghi âm tin nhắn thoại.
- Mỗi tin nhắn tối đa 4 tệp, mỗi tệp tối đa 10 MB. Ảnh hỗ trợ JPEG/PNG/WebP, video MP4/MOV/WebM. PDF, Office/ZIP, TXT/CSV và một số tệp âm thanh được nhận sau kiểm tra định dạng. Lỗi chọn/tải được báo cạnh thao tác và giữ nội dung đã tải thành công trong bản nháp.
- BE giữ tệp trong collection MongoDB riêng, không nhét binary/base64 vào JSON lịch sử. Tệp chưa gửi tự hết hạn sau 24 giờ. Tệp đã gửi yêu cầu phiên đăng nhập và quyền thành viên hiện tại ở mỗi lần đọc; có byte ranges cho phát video native. Hạn mức hiện tại 250 MB/người/cuộc trò chuyện; giới hạn upload 12 lần/phút/IP là lớp kiểm soát bổ sung.
- Người đi cùng có thẻ biểu tượng người dùng, tên và giới thiệu ngắn. Host nhập ngay khi tạo hoặc chỉnh trong Thành viên trước khi bắt đầu. Tên/ghi chú chỉ lộ trong nhóm; không tạo tài khoản hay quyền chat giả. Khi thêm bạn bè GoMate vào chỗ đã giữ, BE trừ chỗ và thông tin người đi cùng tương ứng trong cùng một cập nhật có kiểm tra version.
- Tab Quản lý trong nhóm không lặp lại nút Quản lý thành viên. Trang quản lý độc lập vẫn có lối vào Thành viên.
- Nền Match thêm các vùng sáng, mảng lavender/xanh, lớp chuyển sắc và cung cong mờ; dùng lớp mềm trên native và blur bổ sung trên web. Giữ mức thu nhỏ thẻ 5% hiện có.

## Các phần nên làm tiếp

| Ưu tiên | Hiện có | Phần còn thiếu / đề xuất |
| --- | --- | --- |
| P1 | VIETMAP Autocomplete/Place v4 cho gợi ý địa chỉ/địa điểm, Mapbox cho map và tuyến đường; GPS/ghim/lọc bán kính đã nối FE/BE, kiểm thử hybrid API/SDK thật đã qua | Cần thử WebView/GPS trên điện thoại thật, kiểm soát chi phí/hạn mức, cấu hình token/domain khi triển khai. Xem `MAPBOX_SETUP.md`. |
| P1 | Thông báo và badge trong app, sự kiện chat SSE | Push APNs/FCM khi app đóng, nhắc giờ tập trung, hàng đợi gửi lại và quản lý token theo thiết bị. |
| P1 | Gửi văn bản/media/vị trí, thư viện nội dung, đánh dấu đọc trên BE | Bản nháp/hàng đợi offline bền vững, tìm kiếm tin nhắn, trả lời/trích dẫn, thu hồi, thông báo đang nhập và trạng thái đã đọc của người nhận trên UI. Ghi âm thoại, gọi thoại/video và vị trí trực tiếp chưa có. |
| P1 trước phát hành | Tệp private trong MongoDB, kiểm tra định dạng/kích thước, phân quyền và kiểm thử trình duyệt | Kho object storage private/CDN, ảnh thumbnail/video transcoding, dọn dữ liệu theo chính sách, giám sát upload và quét tệp trước khi mở rộng lưu lượng. Kiểm thử camera/GPS/bàn phím/video trên thiết bị iOS/Android thật. |
| P2 | Timeline, Google Sheets/Excel đính kèm, host chốt lịch, chi phí dự kiến | Đọc hàng Excel thành timeline, bình chọn ngày/địa điểm; sổ khoản chi thực tế và chia chi phí nếu cần. Chưa có thanh toán hoặc ví. |
| Theo lịch đã thống nhất | Luồng OAuth có cổng bật/tắt; consumer chỉ đăng hoạt động cá nhân | Google Login thực tế chờ cấu hình provider theo yêu cầu đã hoãn; website doanh nghiệp làm sau. Xác minh giấy tờ và UI vận hành kiểm duyệt cũng là luồng riêng chưa hoàn thiện. |

Nên ưu tiên thử Mapbox/GPS trên điện thoại thật và domain triển khai theo `MAPBOX_SETUP.md`, sau đó làm push nhắc lịch.

Tài liệu provider đã đối chiếu:

- [Mapbox Geocoding và quyền lưu địa chỉ](https://docs.mapbox.com/api/search/geocoding/), [Directions](https://docs.mapbox.com/api/navigation/directions/), [CSP](https://docs.mapbox.com/mapbox-gl-js/guides/security-and-testing/).
- [Expo ImagePicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [DocumentPicker](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/), [Video](https://docs.expo.dev/versions/v57.0.0/sdk/video/).

Build native cần tạo lại development build để nhận module `expo-video` và quyền camera mới; không tạo native folders thủ công. Không thay cấu hình OAuth hay triển khai production trong lần này.
