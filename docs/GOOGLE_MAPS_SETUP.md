# Google Maps đã được thay bằng Mapbox

Theo yêu cầu ngày 16-10-2026, GoMate chuyển sang Mapbox. Các biến `GOOGLE_MAPS_BROWSER_KEY`, `GOOGLE_MAPS_SERVER_KEY`, `GOOGLE_MAPS_MAP_ID` không còn được dùng. Không cần tạo Google Cloud billing cho bản đồ.

Xem [hướng dẫn Mapbox](MAPBOX_SETUP.md).

Lý do đổi: Việt Nam đang có trong [danh sách lãnh thổ hạn chế của Google Maps Platform](https://cloud.google.com/maps-platform/terms/maps-prohibited-territories?hl=en). Hướng dẫn cũ chưa kiểm tra điều kiện này; không tiếp tục theo các bước cấp key Google trước đó. Điều này không áp dụng cho việc sử dụng ứng dụng Google Maps thông thường hoặc thiết lập OAuth riêng.
