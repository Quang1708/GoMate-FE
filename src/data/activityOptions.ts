export const activityCategories = [
  'Ăn uống',
  'Thể thao',
  'Du lịch',
  'Giải trí',
  'Học tập',
  'Gaming',
  'Âm nhạc',
  'Nghệ thuật',
  'Thiên nhiên',
  'Tình nguyện',
  'Công nghệ',
  'Networking',
  'Cà phê', 'Khám phá ẩm thực', 'Nấu ăn', 'Làm bánh', 'Picnic', 'Cắm trại',
  'Trekking', 'Leo núi', 'Chạy bộ', 'Đi bộ', 'Đạp xe', 'Cầu lông', 'Bóng đá',
  'Bóng rổ', 'Bóng chuyền', 'Bơi lội', 'Yoga', 'Gym', 'Tennis', 'Pickleball',
  'Bóng bàn', 'Board game', 'Xem phim', 'Đọc sách', 'Nhiếp ảnh', 'Vẽ tranh',
  'Thủ công', 'Làm gốm', 'Nhảy', 'Karaoke', 'Nhạc sống', 'Tham quan bảo tàng',
  'Khám phá thành phố', 'Du lịch biển', 'Ngoại ngữ', 'Trao đổi ngôn ngữ',
  'Workshop', 'Lập trình', 'Khởi nghiệp', 'Chăm sóc thú cưng', 'Làm vườn',
  'Bảo vệ môi trường', 'Thiền', 'Khác',
];

export const popularActivityCategories = ['Cà phê', 'Ăn uống', 'Cầu lông', 'Du lịch', 'Board game', 'Trekking'];

export const activityLocations: Record<string, string[]> = {
  'TP. Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Phú Nhuận', 'Gò Vấp', 'Thủ Đức'],
  'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Tây Hồ', 'Nam Từ Liêm'],
  'Đà Nẵng': ['Hải Châu', 'Sơn Trà', 'Ngũ Hành Sơn', 'Thanh Khê', 'Liên Chiểu'],
  'Lâm Đồng': ['Đà Lạt', 'Bảo Lộc', 'Đức Trọng', 'Lạc Dương'],
  'Hải Phòng': ['Hồng Bàng', 'Lê Chân', 'Ngô Quyền', 'Hải An', 'Đồ Sơn'],
  'Cần Thơ': ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'],
  'Khánh Hòa': ['Nha Trang', 'Cam Ranh', 'Ninh Hòa', 'Diên Khánh'],
  'Quảng Ninh': ['Hạ Long', 'Cẩm Phả', 'Uông Bí', 'Móng Cái'],
  'Thừa Thiên Huế': ['Huế', 'Hương Thủy', 'Hương Trà', 'Phú Vang'],
  'Bà Rịa - Vũng Tàu': ['Vũng Tàu', 'Bà Rịa', 'Phú Mỹ', 'Long Điền'],
};

export const provinces = Object.keys(activityLocations);
