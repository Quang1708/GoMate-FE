# Bản nháp, người đi cùng và khung chat

- Trong Tạo hoạt động, bấm **Lưu nháp** ở bất kỳ bước nào, kể cả chưa đủ dữ liệu để đăng. App lưu một bản nháp tạo mới theo tài khoản trên BE. Lần sau vào Tạo hoặc tải lại trang, app khôi phục đúng bước cùng ảnh, người đi cùng, chi phí, lịch và tệp Excel. Thay đổi sau lần lưu cần bấm Lưu nháp lại.
- **Bỏ bản nháp và tạo mới** yêu cầu xác nhận. Đăng thành công sẽ dọn bản nháp đã dùng. Bản nháp không xuất hiện trên Match trước khi đăng; các kiểm tra đăng hoạt động vẫn áp dụng. Khi bản nháp thay đổi từ phiên khác, app báo xung đột thay vì ghi đè.
- Tên/ghi chú người đi cùng có ô nhập rõ và đủ vùng chạm. Cập nhật từng người bằng state hiện tại để không ghi đè phần vừa gõ; thông tin được giữ trong bản nháp và khi đăng.
- Ô chat trống mặc định cao một dòng, tự tăng trong giới hạn khi nội dung dài. Dấu **+** ở bên phải mở bảng icon thay cho bàn phím, bên dưới cùng ô nhập; nội dung đang gõ vẫn hiển thị và không chuyển sang thẻ/modal khác. Chạm ô nhập để quay lại bàn phím. Bảng chỉ giữ icon và nhãn, trạng thái xử lý/lỗi cần thiết; hạn mức tệp vẫn được kiểm tra khi chọn/gửi.
- Ảnh cạnh số thành viên trên trang chủ lấy từ hồ sơ host và thành viên đã được duyệt. Người chưa có ảnh, ảnh lỗi hoặc chỗ giữ cho người đi cùng dùng bóng người xám. Không lặp ảnh mẫu cố định.

Dữ liệu demo đã thêm cho `pminh2004@gmail.com`: Mai Anh, Hoàng Nam, Thu Hà, Đức Huy, Ngọc Trâm — 5 tài khoản riêng với avatar và quan hệ bạn bè đã chấp nhận. Xem [chi tiết BE](../../GoMate-BE/docs/activity-drafts.md).

Kiểm thử: luồng FE/BE/MongoDB và ảnh chụp trình duyệt; export web/Android/iOS. Bàn phím thực tế trên iOS/Android cần kiểm tra thủ công trên máy thật.
