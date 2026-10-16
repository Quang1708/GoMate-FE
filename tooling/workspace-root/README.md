# GoMate

Chạy các lệnh sau tại thư mục gốc `GoMate-prj28.9`, bên ngoài `GoMate-FE` và `GoMate-BE`.

Cài dependency lần đầu:

```powershell
npm install
npm --prefix GoMate-FE install
npm --prefix GoMate-BE install
```

Chạy đồng thời Expo và backend:

```powershell
npm run dev:all
```

Lệnh tổng chạy backend (`npm run dev`) và Expo (`expo start`) trong cùng terminal, giữ mã QR và phím tắt của Expo. Nhấn `Ctrl+C` để dừng cả hai; nếu một tiến trình thoát thì tiến trình còn lại cũng được dừng.

Cấu hình môi trường vẫn đặt riêng trong `GoMate-BE/.env` và `GoMate-FE/.env.local` theo README của mỗi dự án. Lệnh tổng không thay đổi cấu hình kết nối API hay MongoDB.

Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`.
