# Mapbox và VIETMAP cho GoMate

Cập nhật 16-10-2026. GoMate dùng Mapbox GL JS 3.33.0 trong trang bản đồ do BE phục vụ, dùng chung web iframe và native WebView. Không thêm SDK native hoặc yêu cầu rebuild chỉ vì đổi nhà cung cấp bản đồ.

## Cấu hình và chạy

1. Trong `GoMate-BE/.env`, đặt `MAPBOX_ACCESS_TOKEN=YOUR_PUBLIC_PK_TOKEN`. Khóa người dùng cung cấp đã được cấu hình tại máy này; không chép lại vào tài liệu, test hoặc commit. Dùng token public bắt đầu `pk.`, không dùng secret token cho trang bản đồ.
2. Thêm `VIETMAP_API_KEY=YOUR_SERVICES_KEY` vào cùng file BE `.env` để dùng VIETMAP cho gợi ý địa chỉ và lấy tọa độ. Khóa được cung cấp đã được cấu hình tại máy này. Không dùng Tilemap key; không đưa khóa Services vào FE, Git hay tài liệu. Giữ MongoDB/API/LAN và OAuth như trước; FE không cần env của VIETMAP.
3. Tại thư mục ngoài chứa cả FE và BE: `npm run dev:all`. Nếu đang chạy, restart lệnh sau khi đổi `.env`, rồi tải lại app.
4. Mở tạo/chỉnh sửa hoạt động → thời gian/địa điểm → nhập vào ô **Địa chỉ**: từ 2 ký tự, app gợi ý trực tiếp bên dưới sau khoảng 450 ms. Chạm một gợi ý để tự điền địa chỉ, tỉnh/thành và tọa độ. Sửa lại địa chỉ sẽ xóa tọa độ cũ. Vẫn có thể dùng **Tìm địa chỉ** để xem trước trên bản đồ, chỉnh ghim thủ công hoặc lấy GPS.
5. Trong Match/chi tiết/chat vị trí, chọn ô tô hoặc đi bộ và **Tính đường từ vị trí của tôi**. Cho phép GPS; quãng đường/thời gian được lấy từ Directions, tách biệt với khoảng cách đường chim bay trong Match.

Mapbox phụ trách bản đồ và Directions. VIETMAP phụ trách tìm địa chỉ/địa điểm khi có `VIETMAP_API_KEY`. Không có Mapbox token: map dùng OSM, Directions không bật, nhưng VIETMAP vẫn tìm được địa điểm. Chỉ khi không cấu hình VIETMAP, tìm kiếm mới dùng Mapbox Geocoding nếu có token. VIETMAP lỗi sẽ báo và cho thử lại, không tự gọi Mapbox Geocoding.

## Gợi ý và chọn địa điểm

- VIETMAP Autocomplete v4 tìm địa chỉ, tên quán/POI theo dữ liệu nhà cung cấp, gợi ý tối đa 5 dòng sau debounce 450 ms. `display_type=1` ưu tiên địa chỉ hành chính hiện tại (phường/xã → tỉnh/thành), `focus=latitude,longitude` khi có tọa độ tìm kiếm. Hiển thị toàn bộ `display` để người dùng phân biệt các kết quả.
- Khi chọn, BE gọi Place v4 với nguyên `ref_id` do Autocomplete trả về để lấy tọa độ và city/district/ward. Địa chỉ, tỉnh/thành và phường/xã được đối chiếu vào danh sách của GoMate; quận mới để trống nếu provider không có quận. Người dùng vẫn kiểm tra/chỉnh ghim và nhập hướng dẫn gặp mặt.
- Gợi ý trong form tạo/sửa, bộ chọn địa điểm của bộ lọc và chat đều dùng chung provider. Nguồn địa điểm ghi VIETMAP, logo/attribution trên bản đồ vẫn do Mapbox hiển thị.
- BE giữ tối đa 500 lựa chọn trong 5 phút, ràng buộc tài khoản/phiên; không chuyển key hoặc ref_id thô xuống FE. Place chỉ được gọi cho một kết quả hợp lệ của người đó. Lỗi provider giữ lựa chọn để thử lại; thành công tiêu thụ lựa chọn. Restart/đổi instance có thể yêu cầu tìm lại.
- Autocomplete và Place đều tiêu thụ quota của VIETMAP; session nội bộ không phải session billing. Xem hạn mức trên tài khoản của bạn. Không có thay đổi billing hoặc đăng ký dịch vụ tự động.
- Mapbox Geocoding chỉ là phương án cho máy không cấu hình VIETMAP: `permanent=true`, giới hạn Việt Nam/tiếng Việt, địa chỉ (không POI), kết quả phải đủ quyền lưu trữ. Mapbox Search Box không được dùng để lưu POI.

## Token, giới hạn và bản quyền

VIETMAP Services key chỉ nằm ở BE và lời gọi HTTPS tới `maps.vietmap.vn`; `/api/maps/config` chỉ trả `searchProvider`, không trả key. Lỗi upstream được làm sạch để không lộ URL/key. CSP của FE/WebView không cần cho phép gọi VIETMAP trực tiếp.

Public Mapbox token được trả ở `/api/maps/config` để SDK tải bản đồ; không phải secret. Không đưa actual token vào Git. Một token đang dùng cả SDK và các lời gọi BE: nếu đặt URL restrictions chỉ cho browser, cần kiểm tra lại các lời gọi backend vì chúng có thể bị 403. Production nên tách token/map và token/backend với cấu hình riêng trước khi giới hạn theo domain.

BE giới hạn Maps 60 lần/phút/tài khoản, Directions thêm 12 lần/phút/tài khoản, timeout 10 giây; đây không phải hard cap chi phí Mapbox. Bản đồ tải style/tiles và các API đều có cách tính phí riêng. Giữ logo Mapbox và attribution OpenStreetMap trên map. Chính sách CSP chỉ mở các domain Mapbox cần thiết trong tài liệu bản đồ, không mở toàn bộ SPA.

Lối mở bản đồ ngoài dùng OpenStreetMap, không gọi Google Maps API. Kiểm tra điều khoản/quyền riêng tư của sản phẩm trước khi phát hành rộng rãi.

## Kiểm thử

- `npm run test:maps:web`: FE + BE + MongoDB tạm, SDK/API giả lập. Kiểm tra auto-fill, chọn ghim, lưu hoạt động, GPS/tuyến đường, lỗi/thử lại, vị trí chat và responsive 390/768/1440.
- `npm run test:maps:live`: API có xác thực và SDK thật, dùng token từ BE `.env`; có một số request có thể tính phí. Kiểm tra VIETMAP Autocomplete/Place khi có key (hoặc Mapbox Geocoding nếu chưa cấu hình VIETMAP), hai chế độ đi, vẽ/xóa polyline, bán kính, click ghim, logo/attribution và ảnh chụp 390/1000. Không chạy tự động trong bộ test mặc định.
- `npm run typecheck`, `npm run lint`, `npx expo-doctor`; BE `npm test`.
- Android/iOS đã export bundle; vẫn cần thử GPS, mạng LAN và WebView trên điện thoại thật. Không tuyên bố kiểm thử trên thiết bị chỉ từ bundle export.

Tài liệu chính thức: [VIETMAP Autocomplete v4](https://maps.vietmap.vn/docs/map-api/autocomplete-version/autocomplete-v4/), [VIETMAP Place v4](https://maps.vietmap.vn/docs/map-api/place-v4/), [GL JS](https://docs.mapbox.com/mapbox-gl-js/), [Geocoding và quyền lưu kết quả](https://docs.mapbox.com/api/search/geocoding/), [Directions](https://docs.mapbox.com/api/navigation/directions/), [Search Box hạn chế lưu trữ](https://docs.mapbox.com/api/search/search-box/), [CSP](https://docs.mapbox.com/mapbox-gl-js/guides/security-and-testing/).
