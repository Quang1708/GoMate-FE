# Tạo hoạt động, kế hoạch và bạn bè

Luồng tạo hoạt động có bốn bước:

1. Ảnh, tên, danh mục có tìm kiếm và mô tả. Bài tạo từ tài khoản thường là hoạt động cá nhân.
2. Một lịch chọn khoảng ngày, hai bộ cuộn giờ riêng, tỉnh/thành phố mặc định từ
   hồ sơ, quận/khu vực tham khảo và phường/xã có tìm kiếm + cuộn; địa chỉ và GPS.
3. Số lượng tối thiểu/tối đa, bạn đi cùng, bạn bè GoMate có sẵn, tùy chọn độ tuổi/
   giới tính/ngôn ngữ, chi phí dự kiến mỗi người và phần bao gồm/cách chia; kế hoạch.
4. Xem trước bằng chính `ActivityMatchCard`, gồm ảnh, thời gian đi/về, nhóm, chi phí
   và lịch trình. Các nút Match được ẩn trong bản nháp. Cuộn về đầu khi đổi bước.

## Kế hoạch

Thêm tối đa 60 mốc có ngày, giờ, nội dung, địa điểm và ghi chú. Có mẫu gợi ý ba mốc
để bắt đầu rồi tự chỉnh lại. Mốc phải nằm trong khoảng thời gian của hoạt động.
Kế hoạch hiển thị trên Match, chi tiết hoạt động và tab Kế hoạch của nhóm.
Host sửa được kế hoạch trước/trong hoạt động; người tham gia chỉ xem. Xung đột
phiên bản yêu cầu tải lại, tránh ghi đè thay đổi từ thiết bị khác.

Có thể nhập link Google Sheets/kế hoạch HTTPS hoặc đính kèm một tệp `.xlsx`/`.xls`
tối đa 3 MB. Đây là tệp đính kèm để mở/tải, không tự phân tích Excel thành các mốc
và không tự đọc nội dung Sheets. Tệp được kiểm tra tên/đuôi/chữ ký định dạng,
được tải với phiên đăng nhập và trả về dưới dạng attachment, không render nội dung.
Khi tạo xong, mọi người xem bài Match có thể mở kế hoạch; sau khi hoạt động đóng,
quyền tải theo quyền truy cập của host/thành viên. Native dùng vùng cache và share
sheet để mở Excel, cần ứng dụng có thể đọc định dạng tương ứng.

## Thành viên và bạn đi cùng

Số lượng tính cả host. Ví dụ host + 2 bạn ngoài GoMate + 1 bạn GoMate = 4 chỗ.
Bạn ngoài GoMate là số chỗ giữ, không có tài khoản giả, quyền chat hoặc hồ sơ để
đối chiếu tuổi. Host quản lý các bạn đi cùng này. Tài khoản được thêm vào nhóm
phải là bạn bè đã chấp nhận kết bạn và đáp ứng tùy chọn nhóm.

Ở tab Thành viên hoặc từ Chat → Thành viên/thêm bạn, host chọn bạn bè để thêm.
Nếu có chỗ giữ sẵn, bật “Dùng chỗ đã giữ” để chuyển chỗ đó sang tài khoản mà không
đếm hai lần. Không thể vượt sức chứa; hoạt động đã bắt đầu không nhận thêm theo
luồng này. Danh sách thành viên lấy lại số chỗ giữ và trạng thái mới nhất từ API.

Chi tiết giao diện quản lý, hạn đăng ký và chat mới: [ACTIVITY_CHAT_AND_MANAGEMENT.md](ACTIVITY_CHAT_AND_MANAGEMENT.md).

## Kết bạn và chat

Mở Tin nhắn → Bạn bè để tìm theo tên/Nickname, gửi/nhận/chấp nhận/từ chối/hủy lời
mời và bỏ kết bạn. Hồ sơ thành viên cũng có nút kết bạn. Chỉ người nhận xử lý được
lời mời còn chờ; danh sách tìm kiếm không trả email, ngày sinh hoặc thông tin riêng.

Nhóm hoạt động có thể mở chat ngay sau khi đăng, trước giờ bắt đầu. Những bạn
GoMate có sẵn đã được host thêm sẽ thấy chat trong Tin nhắn. Tin nhắn lưu ở BE,
khôi phục sau reload, có phân trang tin cũ, dấu đã đọc và retry không gửi trùng.
Chat nhận sự kiện SSE, có cơ chế tải lại khi ngắt kết nối; hộp thư mười giây/lần.
Bạn bè có nút nhắn tin riêng.
Thành viên bị loại/rời nhóm không đọc/gửi thêm được; bạn đi cùng chưa có tài khoản
không có quyền chat. Bỏ kết bạn không tự loại khỏi các nhóm đã tham gia.

## Dữ liệu địa danh và kiểm thử

Snapshot tải ngày 15-10-2026 từ [Province Open API](https://provinces.open-api.vn/):
`/api/v2/?depth=2` cho 34 tỉnh/thành phố và phường/xã;
`/api/v1/?depth=2` cho địa danh quận/huyện cũ. Các lựa chọn dùng offline sau build.
Nhãn quận/khu vực luôn là tham khảo; phường/xã không phụ thuộc quận cũ.

Chạy `npm run test:trip:web` sau web export với API `/api`. Test dùng MongoDB cô lập,
hai tài khoản và phiên trình duyệt tách biệt, gửi lời mời và tin nhắn chỉ trong dữ liệu kiểm thử,
chọn lịch/giờ/địa danh, tạo bài, kiểm tra ảnh/preview ở 390/768/1440px, chỗ giữ,
thêm bạn, sửa kế hoạch theo quyền và tải Excel. Cần MongoDB memory binary có sẵn
hoặc cho phép thư viện tải binary. Native mới được kiểm tra bundle; chưa kiểm tra
thiết bị thật hoặc ứng dụng Excel ngoài hệ thống.
