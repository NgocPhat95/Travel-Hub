/**
 * Script đồng bộ dữ liệu Vietnam Travel trực tiếp vào DB
 * Chạy: npx ts-node scripts/seed-vietnam-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRIPADVISOR_DEEP_LINKS: Record<string, string> = {
  'Sofitel Legend Metropole Hanoi': 'https://www.tripadvisor.com.vn/Hotel_Review-g293924-d302071-Reviews-Sofitel_Legend_Metropole_Hanoi-Hanoi.html',
  'JW Marriott Hotel Hanoi': 'https://www.tripadvisor.com.vn/Hotel_Review-g293924-d3225292-Reviews-JW_Marriott_Hotel_Hanoi-Hanoi.html',
  'Lotte Hotel Hanoi': 'https://www.tripadvisor.com.vn/Hotel_Review-g293924-d3879977-Reviews-Lotte_Hotel_Hanoi-Hanoi.html',
  'Hanoi La Siesta Hotel & Spa': 'https://www.tripadvisor.com.vn/Hotel_Review-g293924-d1504851-Reviews-Hanoi_La_Siesta_Hotel_Spa-Hanoi.html',
  'Apricot Hotel Hanoi': 'https://www.tripadvisor.com.vn/Hotel_Review-g293924-d12659263-Reviews-Apricot_Hotel-Hanoi.html',
  'Park Hyatt Saigon': 'https://www.tripadvisor.com.vn/Hotel_Review-g293925-d300658-Reviews-Park_Hyatt_Saigon-Ho_Chi_Minh_City.html',
  'Caravelle Saigon': 'https://www.tripadvisor.com.vn/Hotel_Review-g293925-d300701-Reviews-Caravelle_Saigon-Ho_Chi_Minh_City.html',
  'The Reverie Saigon': 'https://www.tripadvisor.com.vn/Hotel_Review-g293925-d7083551-Reviews-The_Reverie_Saigon-Ho_Chi_Minh_City.html',
  'InterContinental Danang Sun Peninsula Resort': 'https://www.tripadvisor.com.vn/Hotel_Review-g298085-d3889397-Reviews-InterContinental_Danang_Sun_Peninsula_Resort-Da_Nang.html',
  'Hyatt Regency Danang Resort': 'https://www.tripadvisor.com.vn/Hotel_Review-g298085-d3536552-Reviews-Hyatt_Regency_Danang_Resort_and_Spa-Da_Nang.html',
  'Four Seasons Resort The Nam Hai': 'https://www.tripadvisor.com.vn/Hotel_Review-g298082-d630554-Reviews-Four_Seasons_Resort_The_Nam_Hai_Hoi_An_Vietnam-Hoi_An.html',
  'Anantara Hội An Resort': 'https://www.tripadvisor.com.vn/Hotel_Review-g298082-d1141524-Reviews-Anantara_Hoi_An_Resort-Hoi_An.html',
  'JW Marriott Phu Quoc Emerald Bay': 'https://www.tripadvisor.com.vn/Hotel_Review-g469418-d12536765-Reviews-JW_Marriott_Phu_Quoc_Emerald_Bay_Resort_Spa-Phu_Quoc_Island.html',
  'Premier Village Phu Quoc Resort': 'https://www.tripadvisor.com.vn/Hotel_Review-g469418-d8729009-Reviews-Premier_Village_Phu_Quoc_Resort-Phu_Quoc_Island.html',
  'Sheraton Nha Trang Hotel & Spa': 'https://www.tripadvisor.com.vn/Hotel_Review-g293979-d1203073-Reviews-Sheraton_Nha_Trang_Hotel_Spa-Nha_Trang.html',
  'Mia Resort Nha Trang': 'https://www.tripadvisor.com.vn/Hotel_Review-g293979-d2073116-Reviews-Mia_Resort_Nha_Trang-Nha_Trang.html',
  'Dalat Palace Heritage Hotel': 'https://www.tripadvisor.com.vn/Hotel_Review-g303946-d302114-Reviews-Dalat_Palace_Heritage_Hotel-Da_Lat.html',
  'Ana Mandara Villas Dalat Resort': 'https://www.tripadvisor.com.vn/Hotel_Review-g303946-d1061296-Reviews-Ana_Mandara_Villas_Dalat_Resort_Spa-Da_Lat.html',
  'Azerai La Residence Hue': 'https://www.tripadvisor.com.vn/Hotel_Review-g303880-d1023892-Reviews-Azerai_La_Residence_Hue-Hue.html',
  'Paradise Elegance Cruise': 'https://www.tripadvisor.com.vn/Hotel_Review-g1371476-d3877543-Reviews-Paradise_Elegance_Cruise-Ha_Long.html',
  'Indochine Premium Halong Bay Cruise': 'https://www.tripadvisor.com.vn/Hotel_Review-g1371476-d12714534-Reviews-Indochine_Premium_Halong_Bay_Cruise-Ha_Long.html',
  'Hotel de la Coupole MGallery Sapa': 'https://www.tripadvisor.com.vn/Hotel_Review-g303868-d14088706-Reviews-Hotel_de_la_Coupole_MGallery-Sapa.html',
};

const hotels = [
  // HÀ NỘI
  { name: 'Sofitel Legend Metropole Hanoi', city: 'Hà Nội', address: '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', lat: 21.0245, lng: 105.8412, priceMin: 5200000, priceMax: 11700000, priceRange: '6.500.000đ/đêm', rating: 4.9, amenities: ['Bể bơi', 'Spa', 'Nhà hàng 5 sao', 'WiFi miễn phí', 'Bar & Lounge'], images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'], category: 'HOTEL' },
  { name: 'JW Marriott Hotel Hanoi', city: 'Hà Nội', address: '8 Đỗ Đức Dục, Nam Từ Liêm, Hà Nội', lat: 21.0169, lng: 105.7839, priceMin: 3360000, priceMax: 7560000, priceRange: '4.200.000đ/đêm', rating: 4.8, amenities: ['Bể bơi vô cực', 'Spa', 'Gym', 'WiFi miễn phí', 'Buffet sáng'], images: ['https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80'], category: 'HOTEL' },
  { name: 'Lotte Hotel Hanoi', city: 'Hà Nội', address: '54 Liễu Giai, Ba Đình, Hà Nội', lat: 21.0314, lng: 105.8143, priceMin: 3040000, priceMax: 6840000, priceRange: '3.800.000đ/đêm', rating: 4.7, amenities: ['Sky Bar', 'Bể bơi', 'Spa', 'Buffet quốc tế', 'WiFi'], images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'], category: 'HOTEL' },
  { name: 'Hanoi La Siesta Hotel & Spa', city: 'Hà Nội', address: '94 Mã Mây, Hoàn Kiếm, Hà Nội', lat: 21.0337, lng: 105.8507, priceMin: 1440000, priceMax: 3240000, priceRange: '1.800.000đ/đêm', rating: 4.6, amenities: ['Spa', 'Bar', 'WiFi miễn phí', 'Bữa sáng'], images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80'], category: 'HOTEL' },
  { name: 'Apricot Hotel Hanoi', city: 'Hà Nội', address: '136 Hàng Trống, Hoàn Kiếm, Hà Nội', lat: 21.0297, lng: 105.8494, priceMin: 2000000, priceMax: 4500000, priceRange: '2.500.000đ/đêm', rating: 4.7, amenities: ['View Hồ Hoàn Kiếm', 'Nhà hàng fine dining', 'Spa', 'WiFi'], images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80'], category: 'HOTEL' },
  { name: 'InterContinental Hanoi Westlake', city: 'Hà Nội', address: '5 Từ Hoa, Quảng An, Tây Hồ, Hà Nội', lat: 21.0587, lng: 105.8324, priceMin: 2560000, priceMax: 5760000, priceRange: '3.200.000đ/đêm', rating: 4.8, amenities: ['Xây trên mặt nước', 'Sunset Bar', 'Bể bơi ngoài trời', 'Gym', 'WiFi'], images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'], category: 'HOTEL' },
  { name: 'Somerset Grand Hanoi', city: 'Hà Nội', address: '49 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', lat: 21.0264, lng: 105.8472, priceMin: 1680000, priceMax: 3780000, priceRange: '2.100.000đ/đêm', rating: 4.6, amenities: ['Căn hộ dịch vụ', 'Bể bơi', 'Sân tennis', 'Khu vui chơi trẻ em', 'WiFi'], images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'], category: 'HOTEL' },

  // TP. HỒ CHÍ MINH
  { name: 'Park Hyatt Saigon', city: 'TP. Hồ Chí Minh', address: '2 Công Trường Lam Sơn, Quận 1, TP.HCM', lat: 10.7764, lng: 106.7032, priceMin: 5600000, priceMax: 12600000, priceRange: '7.000.000đ/đêm', rating: 4.9, amenities: ['Bể bơi', 'Spa', 'Bar', 'Nhà hàng cao cấp', 'WiFi'], images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'], category: 'HOTEL' },
  { name: 'Caravelle Saigon', city: 'TP. Hồ Chí Minh', address: '19-23 Công Trường Lam Sơn, Quận 1', lat: 10.7761, lng: 106.7027, priceMin: 3600000, priceMax: 8100000, priceRange: '4.500.000đ/đêm', rating: 4.8, amenities: ['Rooftop Bar', 'Bể bơi', 'Spa', 'WiFi'], images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'], category: 'HOTEL' },
  { name: 'The Reverie Saigon', city: 'TP. Hồ Chí Minh', address: '22-36 Nguyễn Huệ, Quận 1, TP.HCM', lat: 10.7740, lng: 106.7034, priceMin: 6800000, priceMax: 15300000, priceRange: '8.500.000đ/đêm', rating: 4.9, amenities: ['Bể bơi vô cực', 'Spa cao cấp', 'Bar & Lounge', 'View sông', 'Nội thất Ý'], images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'], category: 'HOTEL' },
  { name: 'Hotel Majestic Saigon', city: 'TP. Hồ Chí Minh', address: '1 Đồng Khởi, Quận 1, TP.HCM', lat: 10.7725, lng: 106.7067, priceMin: 1920000, priceMax: 4320000, priceRange: '2.400.000đ/đêm', rating: 4.5, amenities: ['Lịch sử từ 1925', 'Bể bơi ngoài trời', 'Rooftop Bar', 'View sông Sài Gòn'], images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'], category: 'HOTEL' },
  { name: 'Rex Hotel Saigon', city: 'TP. Hồ Chí Minh', address: '141 Nguyễn Huệ, Quận 1, TP.HCM', lat: 10.7758, lng: 106.7015, priceMin: 2080000, priceMax: 4680000, priceRange: '2.600.000đ/đêm', rating: 4.6, amenities: ['Vị trí trung tâm', 'Bể bơi', 'Rooftop Garden', 'Tennis court', 'WiFi'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'], category: 'HOTEL' },

  // ĐÀ NẴNG
  { name: 'InterContinental Danang Sun Peninsula Resort', city: 'Đà Nẵng', address: 'Bán đảo Sơn Trà, Đà Nẵng', lat: 16.1120, lng: 108.2880, priceMin: 7200000, priceMax: 16200000, priceRange: '9.000.000đ/đêm', rating: 4.9, amenities: ['Bãi biển riêng', 'Bể bơi vô cực', 'Spa', 'Funicular riêng'], images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'], category: 'HOTEL' },
  { name: 'Hyatt Regency Danang Resort & Spa', city: 'Đà Nẵng', address: '5 Trường Sa, Hoà Hải, Ngũ Hành Sơn', lat: 15.9677, lng: 108.2666, priceMin: 3840000, priceMax: 8640000, priceRange: '4.800.000đ/đêm', rating: 4.8, amenities: ['5 bể bơi', 'Bãi biển riêng', 'Spa', 'Gym'], images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80'], category: 'HOTEL' },
  { name: 'Novotel Danang Premier Han River', city: 'Đà Nẵng', address: '36 Bạch Đằng, Hải Châu, Đà Nẵng', lat: 16.0778, lng: 108.2238, priceMin: 1840000, priceMax: 4140000, priceRange: '2.300.000đ/đêm', rating: 4.7, amenities: ['View sông Hàn', 'Rooftop Sky36', 'Bể bơi', 'WiFi'], images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80'], category: 'HOTEL' },
  { name: 'Pullman Danang Beach Resort', city: 'Đà Nẵng', address: '101 Võ Nguyên Giáp, Khuê Mỹ, Ngũ Hành Sơn', lat: 16.0385, lng: 108.2492, priceMin: 2480000, priceMax: 5580000, priceRange: '3.100.000đ/đêm', rating: 4.7, amenities: ['Bãi biển Mỹ Khê', 'Hồ bơi vô cực', 'Spa', 'Tennis court', 'WiFi'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'], category: 'HOTEL' },

  // HỘI AN
  { name: 'Four Seasons Resort The Nam Hai', city: 'Hội An', address: 'Đường Hà My Bắc, Điện Dương, Quảng Nam', lat: 15.8756, lng: 108.2957, priceMin: 9600000, priceMax: 21600000, priceRange: '12.000.000đ/đêm', rating: 5.0, amenities: ['3 bể bơi', 'Bãi biển riêng', 'Spa', 'Butler service'], images: ['https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800&q=80'], category: 'HOTEL' },
  { name: 'Anantara Hội An Resort', city: 'Hội An', address: '1 Phạm Hồng Thái, Cẩm Châu, Hội An', lat: 15.8779, lng: 108.3348, priceMin: 3360000, priceMax: 7560000, priceRange: '4.200.000đ/đêm', rating: 4.8, amenities: ['Bể bơi', 'Spa', 'Nhà hàng ven sông', 'Tour phố cổ'], images: ['https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80'], category: 'HOTEL' },
  { name: 'Allegro Hoi An Luxury Hotel & Spa', city: 'Hội An', address: '86 Trần Hưng Đạo, Cẩm Phô, Hội An', lat: 15.8795, lng: 108.3245, priceMin: 1360000, priceMax: 3060000, priceRange: '1.700.000đ/đêm', rating: 4.7, amenities: ['Gần phố cổ', 'Hồ bơi ngoài trời', 'Spa', 'Xe đạp miễn phí'], images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'], category: 'HOTEL' },

  // PHÚ QUỐC
  { name: 'JW Marriott Phu Quoc Emerald Bay', city: 'Phú Quốc', address: 'Khu Bãi Khem, An Thới, Phú Quốc', lat: 10.0289, lng: 103.9931, priceMin: 6400000, priceMax: 14400000, priceRange: '8.000.000đ/đêm', rating: 4.9, amenities: ['Bãi biển riêng', '5 bể bơi', 'Spa', 'Khu vui chơi trẻ em'], images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'], category: 'HOTEL' },
  { name: 'Premier Village Phu Quoc Resort', city: 'Phú Quốc', address: 'Mũi Ông Đội, An Thới, Phú Quốc', lat: 10.0192, lng: 103.9842, priceMin: 4400000, priceMax: 9900000, priceRange: '5.500.000đ/đêm', rating: 4.8, amenities: ['Villa riêng', 'Bãi biển', 'Bể bơi', 'Đảo riêng'], images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80'], category: 'HOTEL' },
  { name: 'Vinpearl Resort & Spa Phú Quốc', city: 'Phú Quốc', address: 'Khu Bãi Dài, Gành Dầu, Phú Quốc', lat: 10.3392, lng: 103.8564, priceMin: 2465000, priceMax: 4495000, priceRange: '2.900.000đ/đêm', rating: 4.7, amenities: ['Sát biển', 'Hồ bơi cực lớn', 'Gần Safari & Grand World', 'Spa ngoài trời', 'WiFi'], images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'], category: 'HOTEL' },

  // NHA TRANG
  { name: 'Sheraton Nha Trang Hotel & Spa', city: 'Nha Trang', address: '26-28 Trần Phú, Nha Trang', lat: 12.2437, lng: 109.1952, priceMin: 2800000, priceMax: 6300000, priceRange: '3.500.000đ/đêm', rating: 4.7, amenities: ['View biển', 'Rooftop pool', 'Spa', 'Gym'], images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80'], category: 'HOTEL' },
  { name: 'Mia Resort Nha Trang', city: 'Nha Trang', address: 'Bãi Dài, Cam Lâm, Khánh Hoà', lat: 12.0657, lng: 109.1290, priceMin: 3360000, priceMax: 7560000, priceRange: '4.200.000đ/đêm', rating: 4.8, amenities: ['Bãi biển riêng', 'Bể bơi', 'Spa', 'Snorkeling'], images: ['https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80'], category: 'HOTEL' },
  { name: 'Amiana Resort Nha Trang', city: 'Nha Trang', address: 'Phạm Văn Đồng, Vĩnh Hòa, Nha Trang', lat: 12.3025, lng: 109.2147, priceMin: 2805000, priceMax: 5115000, priceRange: '3.300.000đ/đêm', rating: 4.8, amenities: ['Hồ nước khoáng riêng', 'Bãi biển cát trắng', 'Hồ bơi nước biển', 'Spa', 'WiFi'], images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'], category: 'HOTEL' },

  // ĐÀ LẠT
  { name: 'Dalat Palace Heritage Hotel', city: 'Đà Lạt', address: '2 Trần Phú, Phường 3, Đà Lạt', lat: 11.9415, lng: 108.4384, priceMin: 2560000, priceMax: 5760000, priceRange: '3.200.000đ/đêm', rating: 4.7, amenities: ['Lịch sử 1922', 'Golf', 'Spa', 'Nhà hàng cổ điển'], images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'], category: 'HOTEL' },
  { name: 'Ana Mandara Villas Dalat Resort', city: 'Đà Lạt', address: 'Lê Lai, Phường 5, Đà Lạt', lat: 11.9385, lng: 108.4360, priceMin: 2240000, priceMax: 5040000, priceRange: '2.800.000đ/đêm', rating: 4.7, amenities: ['Villa kiểu Pháp', 'Spa', 'Vườn hoa', 'WiFi'], images: ['https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800&q=80'], category: 'HOTEL' },

  // HUẾ
  { name: 'Azerai La Residence Hue', city: 'Huế', address: '5 Lê Lợi, Vĩnh Ninh, Huế', lat: 16.4651, lng: 107.5988, priceMin: 3040000, priceMax: 6840000, priceRange: '3.800.000đ/đêm', rating: 4.8, amenities: ['Bể bơi ven sông Hương', 'Art Deco 1930', 'Spa', 'Nhà hàng'], images: ['https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=800&q=80'], category: 'HOTEL' },
  { name: 'Imperial Hotel Hue', city: 'Huế', address: '8 Hùng Vương, Phú Hội, Huế', lat: 16.4687, lng: 107.5941, priceMin: 1275000, priceMax: 2325000, priceRange: '1.500.000đ/đêm', rating: 4.6, amenities: ['Kiến trúc cung đình', 'Rooftop Bar', 'Bể bơi', 'Spa', 'WiFi'], images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'], category: 'HOTEL' },

  // HẠ LONG
  { name: 'Paradise Elegance Cruise', city: 'Hạ Long', address: 'Cảng Quốc tế Tuần Châu, Hạ Long', lat: 20.9131, lng: 107.0349, priceMin: 4400000, priceMax: 9900000, priceRange: '5.500.000đ/đêm', rating: 4.9, amenities: ['Du thuyền 5 sao', 'Kayak', 'Tắm hang động', 'Ẩm thực'], images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], category: 'HOTEL' },
  { name: 'Vinpearl Resort & Spa Hạ Long', city: 'Hạ Long', address: 'Đảo Rêu, Bãi Cháy, Hạ Long', lat: 20.9425, lng: 107.0452, priceMin: 2380000, priceMax: 4185000, priceRange: '2.800.000đ/đêm', rating: 4.7, amenities: ['Nằm trên đảo riêng', 'Hồ bơi cực lớn', 'View vịnh Hạ Long', 'Spa', 'Bãi biển riêng'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'], category: 'HOTEL' },

  // SAPA
  { name: 'Hotel de la Coupole MGallery Sapa', city: 'Sapa', address: '1 Hoàng Diệu, Sapa, Lào Cai', lat: 22.3361, lng: 103.8443, priceMin: 3600000, priceMax: 8100000, priceRange: '4.500.000đ/đêm', rating: 4.8, amenities: ['View Fansipan', 'Bể bơi trong nhà', 'Spa', 'Lò sưởi'], images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'], category: 'HOTEL' },
  { name: 'Silk Path Grand Resort & Spa Sapa', city: 'Sapa', address: 'Đồi Quan Điểm, Tổ 10, Sapa', lat: 22.3412, lng: 103.8385, priceMin: 2125000, priceMax: 3875000, priceRange: '2.500.000đ/đêm', rating: 4.8, amenities: ['Vườn hoa hồng lớn', 'Bể bơi bốn mùa', 'Spa', 'View dãy Hoàng Liên Sơn'], images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'], category: 'HOTEL' },
];

const restaurants = [
  // HÀ NỘI
  { name: 'Chả Cá Lã Vọng', city: 'Hà Nội', address: '14 Chả Cá, Hoàn Kiếm, Hà Nội', lat: 21.0360, lng: 105.8468, priceMin: 175000, priceMax: 625000, priceRange: '250.000đ/người', rating: 4.6, amenities: ['Chả cá đặc sản', 'Lịch sử 100 năm', 'Ngồi bàn thấp'], images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1025181-Reviews-Cha_Ca_La_Vong-Hanoi.html', category: 'RESTAURANT' },
  { name: 'Bun Cha Huong Lien', city: 'Hà Nội', address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội', lat: 21.0211, lng: 105.8512, priceMin: 70000, priceMax: 250000, priceRange: '100.000đ/người', rating: 4.7, amenities: ['Bún chả Obama nổi tiếng', 'Nem cuốn', 'Bia Hà Nội'], images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d8110284-Reviews-Bun_Cha_Huong_Lien-Hanoi.html', category: 'RESTAURANT' },
  { name: 'Quan An Ngon', city: 'Hà Nội', address: '18 Phan Bội Châu, Hoàn Kiếm, Hà Nội', lat: 21.0275, lng: 105.8426, priceMin: 105000, priceMax: 375000, priceRange: '150.000đ/người', rating: 4.5, amenities: ['100+ món ăn VN', 'Sân vườn', 'Phở', 'Bánh cuốn'], images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1524793-Reviews-Quan_An_Ngon-Hanoi.html', category: 'RESTAURANT' },
  { name: "Pizza 4P's Hanoi", city: 'Hà Nội', address: '24 Lý Quốc Sư, Hoàn Kiếm, Hà Nội', lat: 21.0319, lng: 105.8491, priceMin: 210000, priceMax: 750000, priceRange: '300.000đ/người', rating: 4.7, amenities: ['Pizza lò củi', 'Phô mai tươi', 'Đặt bàn online'], images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d8559088-Reviews-Pizza_4P_s-Hanoi.html', category: 'RESTAURANT' },
  { name: 'Phở Gia Truyền Bát Đàn', city: 'Hà Nội', address: '49 Bát Đàn, Cửa Đông, Hoàn Kiếm, Hà Nội', lat: 21.0321, lng: 105.8475, priceMin: 48000, priceMax: 100000, priceRange: '65.000đ/người', rating: 4.6, amenities: ['Phở bò gia truyền', 'Xếp hàng truyền thống', 'Lâu đời'], images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1154562-Reviews-Pho_Bat_Dan-Hanoi.html', category: 'RESTAURANT' },
  { name: 'Nhà hàng Sen Tây Hồ', city: 'Hà Nội', address: '614 Lạc Long Quân, Tây Hồ, Hà Nội', lat: 21.0768, lng: 105.8175, priceMin: 285000, priceMax: 570000, priceRange: '380.000đ/người', rating: 4.5, amenities: ['Buffet ẩm thực lớn nhất VN', 'Khu ẩm thực Sen Tây Hồ', 'View Hồ Tây'], images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1112445-Reviews-Sen_Tay_Ho-Hanoi.html', category: 'RESTAURANT' },
  { name: 'Gia Restaurant', city: 'Hà Nội', address: '61 Văn Miếu, Đống Đa, Hà Nội', lat: 21.0289, lng: 105.8364, priceMin: 1200000, priceMax: 3600000, priceRange: '1.800.000đ/người', rating: 4.9, amenities: ['Nhà hàng đạt sao Michelin', 'Fine Dining hiện đại', 'Concept văn hoá Việt', 'Đặt bàn trước'], images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d23821035-Reviews-GIA_Restaurant-Hanoi.html', category: 'RESTAURANT' },

  // TP. HỒ CHÍ MINH
  { name: 'Nhà Hàng Ngon', city: 'TP. Hồ Chí Minh', address: '160 Pasteur, Bến Nghé, Quận 1', lat: 10.7760, lng: 106.7007, priceMin: 140000, priceMax: 500000, priceRange: '200.000đ/người', rating: 4.6, amenities: ['Ẩm thực VN', 'Sân vườn thuộc địa', '100+ món'], images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1522940-Reviews-Nha_Hang_Ngon-Ho_Chi_Minh_City.html', category: 'RESTAURANT' },
  { name: 'The Deck Saigon', city: 'TP. Hồ Chí Minh', address: '38 Nguyễn Ư Dĩ, Thảo Điền, Quận 2', lat: 10.8023, lng: 106.7343, priceMin: 350000, priceMax: 1250000, priceRange: '500.000đ/người', rating: 4.7, amenities: ['Riverside dining', 'Cocktail bar', 'International cuisine'], images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1524776-Reviews-The_Deck_Saigon-Ho_Chi_Minh_City.html', category: 'RESTAURANT' },
  { name: 'Cục Gạch Quán', city: 'TP. Hồ Chí Minh', address: '10 Đặng Tất, Tân Định, Quận 1', lat: 10.7891, lng: 106.6989, priceMin: 210000, priceMax: 750000, priceRange: '300.000đ/người', rating: 4.7, amenities: ['Nhà cổ 1930', 'Ẩm thực Nam Bộ', 'Vườn cây xanh'], images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1524786-Reviews-Cuc_Gach_Quan-Ho_Chi_Minh_City.html', category: 'RESTAURANT' },
  { name: 'Phở Lệ Sài Gòn', city: 'TP. Hồ Chí Minh', address: '415 Nguyễn Trãi, Phường 7, Quận 5', lat: 10.7538, lng: 106.6789, priceMin: 65000, priceMax: 150000, priceRange: '90.000đ/người', rating: 4.6, amenities: ['Phở Nam Bộ chuẩn vị', 'Nước dùng đậm đà', 'Mở cửa khuya'], images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1025176-Reviews-Pho_Le-Ho_Chi_Minh_City.html', category: 'RESTAURANT' },
  { name: 'Anan Saigon', city: 'TP. Hồ Chí Minh', address: '89 Tôn Thất Đạm, Bến Nghé, Quận 1', lat: 10.7712, lng: 106.7045, priceMin: 1100000, priceMax: 3200000, priceRange: '1.600.000đ/người', rating: 4.8, amenities: ['Sao Michelin danh giá', 'Street food nâng tầm', 'Rooftop Bar', 'View chợ cũ'], images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d12345095-Reviews-Anan_Saigon-Ho_Chi_Minh_City.html', category: 'RESTAURANT' },

  // ĐÀ NẴNG
  { name: 'Madame Lân', city: 'Đà Nẵng', address: '4 Bạch Đằng, Hải Châu, Đà Nẵng', lat: 16.0712, lng: 108.2237, priceMin: 126000, priceMax: 450000, priceRange: '180.000đ/người', rating: 4.6, amenities: ['Ẩm thực miền Trung', 'Mì Quảng', 'View sông Hàn'], images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298085-d1524739-Reviews-Madame_Lan-Da_Nang.html', category: 'RESTAURANT' },
  { name: 'Waterfront Restaurant Danang', city: 'Đà Nẵng', address: '150/11 Bạch Đằng, Hải Châu, Đà Nẵng', lat: 16.0698, lng: 108.2231, priceMin: 245000, priceMax: 875000, priceRange: '350.000đ/người', rating: 4.7, amenities: ['View sông Hàn', 'Hải sản tươi sống', 'Bar', 'Live music'], images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298085-d1524768-Reviews-Waterfront_Restaurant_Bar-Da_Nang.html', category: 'RESTAURANT' },
  { name: 'Nhà hàng hải sản Bé Mặn', city: 'Đà Nẵng', address: 'Lô 11 Võ Nguyên Giáp, Mân Thái, Sơn Trà', lat: 16.0845, lng: 108.2487, priceMin: 320000, priceMax: 1100000, priceRange: '450.000đ/người', rating: 4.5, amenities: ['Hải sản tươi sống chọn tại bể', 'Không khí nhộn nhịp', 'Sát bãi biển Mỹ Khê'], images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298085-d7274092-Reviews-Nha_Hang_Be_Man-Da_Nang.html', category: 'RESTAURANT' },

  // HỘI AN
  { name: 'Mango Rooms', city: 'Hội An', address: '111 Nguyễn Thái Học, Hội An', lat: 15.8801, lng: 108.3354, priceMin: 196000, priceMax: 700000, priceRange: '280.000đ/người', rating: 4.7, amenities: ['Fusion Á-Âu', 'View phố cổ', 'Cocktail', 'Lãng mạn'], images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298082-d1024870-Reviews-Mango_Rooms-Hoi_An.html', category: 'RESTAURANT' },
  { name: 'White Rose Restaurant', city: 'Hội An', address: '533 Hai Bà Trưng, Hội An', lat: 15.8732, lng: 108.3267, priceMin: 105000, priceMax: 375000, priceRange: '150.000đ/người', rating: 4.7, amenities: ['Bánh bao hoa hồng trắng', 'Hoành thánh chiên', 'Gia đình 3 đời'], images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298082-d1025019-Reviews-White_Rose_Restaurant-Hoi_An.html', category: 'RESTAURANT' },
  { name: 'Bánh Mì Phượng Hội An', city: 'Hội An', address: '2b Phan Chu Trinh, Minh An, Hội An', lat: 15.8778, lng: 108.3312, priceMin: 25000, priceMax: 80000, priceRange: '40.000đ/người', rating: 4.6, amenities: ['Bánh mì ngon nhất thế giới', 'Đa dạng nhân', 'Xếp hàng mua'], images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298082-d2243555-Reviews-Banh_Mi_Phuong-Hoi_An.html', category: 'RESTAURANT' },

  // NHA TRANG
  { name: 'Lanterns Restaurant', city: 'Nha Trang', address: '34/6 Nguyễn Thiện Thuật, Nha Trang', lat: 12.2429, lng: 109.1940, priceMin: 140000, priceMax: 500000, priceRange: '200.000đ/người', rating: 4.7, amenities: ['Ẩm thực Việt', 'Cooking class', 'Lồng đèn', 'Rooftop'], images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293979-d1524804-Reviews-Lanterns_Restaurant-Nha_Trang.html', category: 'RESTAURANT' },
  { name: 'Nhà hàng hải sản Hạnh Xuân', city: 'Nha Trang', address: '36 Cù Huân, Vĩnh Thọ, Nha Trang', lat: 12.2612, lng: 109.1985, priceMin: 200000, priceMax: 700000, priceRange: '300.000đ/người', rating: 4.5, amenities: ['View sông Cái & Tháp Bà', 'Hải sản tươi sống bình dân'], images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293979-d3789542-Reviews-Hanh_Xuan_Restaurant-Nha_Trang.html', category: 'RESTAURANT' },

  // PHÚ QUỐC
  { name: 'Chez Carole Restaurant', city: 'Phú Quốc', address: 'Ấp 4, Dương Tơ, Phú Quốc', lat: 10.2899, lng: 103.9731, priceMin: 245000, priceMax: 875000, priceRange: '350.000đ/người', rating: 4.8, amenities: ['Hải sản tươi sống', 'Pháp-Việt fusion', 'Bãi biển'], images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g469418-d1524819-Reviews-Chez_Carole-Phu_Quoc_Island.html', category: 'RESTAURANT' },
  { name: 'Nhà hàng Xin Chào Phú Quốc', city: 'Phú Quốc', address: '66 Trần Hưng Đạo, Dương Đông, Phú Quốc', lat: 10.2125, lng: 103.9592, priceMin: 180000, priceMax: 650000, priceRange: '280.000đ/người', rating: 4.6, amenities: ['View ngắm hoàng hôn cực đỉnh', 'Hải sản Phú Quốc', 'Không gian lộng gió'], images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g469418-d10834241-Reviews-Xin_Chao_Restaurant-Phu_Quoc_Island.html', category: 'RESTAURANT' },

  // SAPA
  { name: 'Nhà hàng A Phủ Sapa', city: 'Sapa', address: '15 Fansipan, Sapa, Lào Cai', lat: 22.3345, lng: 103.8428, priceMin: 150000, priceMax: 450000, priceRange: '220.000đ/người', rating: 4.7, amenities: ['Đặc sản Tây Bắc', 'Thắng cố', 'Gà nướng tiêu xanh', 'Lẩu cá hồi Sapa'], images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g303868-d12450892-Reviews-A_Phu_Restaurant-Sapa.html', category: 'RESTAURANT' },

  // ĐÀ LẠT
  { name: 'Nhà hàng Song May', city: 'Đà Lạt', address: '49 Trần Quang Khải, Phường 8, Đà Lạt', lat: 11.9542, lng: 108.4485, priceMin: 220000, priceMax: 750000, priceRange: '320.000đ/người', rating: 4.6, amenities: ['Biệt thự cổ kính ven đồi', 'Ẩm thực Việt cao cấp', 'Không gian lãng mạn'], images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g303946-d2459082-Reviews-Song_May_Restaurant-Da_Lat.html', category: 'RESTAURANT' },
];

const attractions = [
  { name: 'Vịnh Hạ Long', city: 'Hạ Long', address: 'Vịnh Hạ Long, Quảng Ninh', lat: 20.9101, lng: 107.1839, priceMin: 0, priceMax: 500000, priceRange: 'Xem thêm', rating: 4.9, category: 'ATTRACTION', amenities: ['Di sản UNESCO', 'Hang động', 'Chèo kayak', 'Tắm hang'], images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g1371476-d311070-Reviews-Ha_Long_Bay-Ha_Long.html' },
  { name: 'Phố Cổ Hội An', city: 'Hội An', address: 'Khu phố cổ Hội An, Quảng Nam', lat: 15.8800, lng: 108.3380, priceMin: 96000, priceMax: 300000, priceRange: '120.000đ/người', rating: 4.9, category: 'ATTRACTION', amenities: ['Di sản UNESCO', 'Đèn lồng', 'Kiến trúc cổ', 'Thủ công mỹ nghệ'], images: ['https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298082-d324325-Reviews-Ancient_Town-Hoi_An.html' },
  { name: 'Quần thể di tích Cố đô Huế', city: 'Huế', address: 'Khu Hoàng Thành, Thuận Hoá, Huế', lat: 16.4698, lng: 107.5796, priceMin: 160000, priceMax: 500000, priceRange: '200.000đ/người', rating: 4.8, category: 'ATTRACTION', amenities: ['Di sản UNESCO', 'Đại Nội', 'Lăng tẩm', 'Ẩm thực cung đình'], images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303880-d311083-Reviews-Imperial_Enclosure-Hue.html' },
  { name: 'Thánh địa Mỹ Sơn', city: 'Đà Nẵng', address: 'Mỹ Sơn, Duy Xuyên, Quảng Nam', lat: 15.7694, lng: 108.1233, priceMin: 120000, priceMax: 400000, priceRange: '150.000đ/người', rating: 4.7, category: 'ATTRACTION', amenities: ['Di sản UNESCO', 'Đền Chăm 4-14 thế kỷ', 'Hướng dẫn viên'], images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298085-d311080-Reviews-My_Son_Sanctuary-Da_Nang.html' },
  { name: 'Bà Nà Hills - Cầu Vàng', city: 'Đà Nẵng', address: 'Xã Hoà Ninh, Hoà Vang, Đà Nẵng', lat: 15.9974, lng: 107.9867, priceMin: 600000, priceMax: 1350000, priceRange: '750.000đ/người', rating: 4.8, category: 'ATTRACTION', amenities: ['Cầu Vàng nổi tiếng', 'Cable car', 'Fantasy Park', 'Village Pháp'], images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298085-d8396456-Reviews-Ba_Na_Hills-Da_Nang.html' },
  { name: 'Phong Nha - Kẻ Bàng', city: 'Đồng Hới', address: 'Xã Sơn Trạch, Bố Trạch, Quảng Bình', lat: 17.5425, lng: 106.2812, priceMin: 200000, priceMax: 625000, priceRange: '250.000đ/người', rating: 4.9, category: 'ATTRACTION', amenities: ['Hang Sơn Đoòng', 'Di sản UNESCO', 'Trekking', 'Hang động ngầm'], images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303939-d311069-Reviews-Phong_Nha_Ke_Bang_National_Park-Phong_Nha.html' },
  { name: 'Thung Lũng Tình Yêu Đà Lạt', city: 'Đà Lạt', address: 'Phường 8, Đà Lạt, Lâm Đồng', lat: 11.9563, lng: 108.4255, priceMin: 64000, priceMax: 200000, priceRange: '80.000đ/người', rating: 4.5, category: 'ATTRACTION', amenities: ['Hoa rực rỡ', 'Hồ tình yêu', 'Cáp treo', 'Chụp ảnh'], images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303946-d461178-Reviews-Valley_of_Love-Da_Lat.html' },
  { name: 'Ruộng Bậc Thang Sapa', city: 'Sapa', address: 'Xã Tả Van, Sapa, Lào Cai', lat: 22.2839, lng: 103.8714, priceMin: 0, priceMax: 300000, priceRange: 'Miễn phí', rating: 4.9, category: 'ATTRACTION', amenities: ['Đẹp nhất VN', "Bản làng H'Mông", 'Trekking', 'Homestay'], images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303868-d3207047-Reviews-Ta_Van_Village-Sapa.html' },
  { name: 'Tour Ngắm San Hô Phú Quốc', city: 'Phú Quốc', address: 'Bãi Sao, An Thới, Phú Quốc', lat: 10.0482, lng: 103.9842, priceMin: 360000, priceMax: 1125000, priceRange: '450.000đ/người', rating: 4.8, category: 'TOUR', amenities: ['Lặn ngắm san hô', 'Câu cá', 'Vui chơi dưới nước', 'Ăn trưa trên thuyền'], images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g469418-d8563991-Reviews-Coral_Reef_Snorkeling-Phu_Quoc_Island.html' },
  { name: 'Tour Du Thuyền Hạ Long 2N1Đ', city: 'Hạ Long', address: 'Cảng Tuần Châu, Hạ Long', lat: 20.9131, lng: 107.0500, priceMin: 2800000, priceMax: 8750000, priceRange: '3.500.000đ/người', rating: 4.9, category: 'TOUR', amenities: ['Du thuyền 4 sao', 'Kayak', 'Hang động', 'Ẩm thực hải sản', 'Ngủ trên vịnh'], images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g1371476-d3877543-Reviews-Paradise_Elegance_Cruise-Ha_Long.html' },
  { name: 'Tour Phố Cổ Hội An Buổi Tối', city: 'Hội An', address: 'Phố Cổ Hội An, Quảng Nam', lat: 15.8800, lng: 108.3380, priceMin: 80000, priceMax: 250000, priceRange: '100.000đ/người', rating: 4.9, category: 'TOUR', amenities: ['Thả đèn hoa đăng', 'Phố đèn lồng', 'Ẩm thực đêm', 'Chụp ảnh'], images: ['https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800&q=80'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298082-d19280785-Reviews-Hoi_An_Evening_Lantern_Tour-Hoi_An.html' },
];

async function upsertPlace(data: any) {
  const existing = await prisma.place.findFirst({ where: { name: data.name, category: data.category } });
  let place: any;

  if (!existing) {
    place = await prisma.place.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        address: data.address,
        latitude: data.lat ?? data.latitude ?? 0,
        longitude: data.lng ?? data.longitude ?? 0,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        priceRange: data.priceRange,
        avgRating: data.rating,
        ratingAverage: data.rating,
        amenities: data.amenities,
        images: data.images,
        isVerified: true,
        status: 'ACTIVE',
      },
    });
    console.log(`  ✅ Created: ${data.name}`);
  } else {
    place = await prisma.place.update({
      where: { id: existing.id },
      data: {
        images: data.images,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        priceRange: data.priceRange,
        amenities: data.amenities,
        avgRating: data.rating,
      },
    });
    console.log(`  ♻️  Updated: ${data.name}`);
  }

  // Upsert PartnerPrice TRIPADVISOR
  if (data.link) {
    const existingPrice = await prisma.partnerPrice.findFirst({
      where: { placeId: place.id, partnerName: 'TRIPADVISOR' as any },
    });
    if (existingPrice) {
      await prisma.partnerPrice.update({ where: { id: existingPrice.id }, data: { price: data.priceMin, deepLink: data.link } });
    } else {
      await prisma.partnerPrice.create({ data: { placeId: place.id, partnerName: 'TRIPADVISOR' as any, price: data.priceMin, currency: 'VND', deepLink: data.link } });
    }
  }
  return place;
}

async function main() {
  console.log('\n🌏 Seeding Vietnam Travel Data...\n');

  console.log('🏨 Hotels:');
  for (const h of hotels) {
    await upsertPlace({ ...h, category: 'HOTEL', description: `🏨 ${h.name} - Khách sạn ${h.city}. Đánh giá ${h.rating}/5. ${h.amenities.join(', ')}.`, link: TRIPADVISOR_DEEP_LINKS[h.name] || `https://www.tripadvisor.com.vn/Search?q=${encodeURIComponent(h.name)}&category=Hotels` });
  }

  console.log('\n🍜 Restaurants:');
  for (const r of restaurants) {
    await upsertPlace({ ...r, category: 'RESTAURANT', description: `🍜 ${r.name} - Nhà hàng ${r.city}. Đánh giá ${r.rating}/5. ${r.amenities.join(', ')}.` });
  }

  console.log('\n🗺️ Attractions & Tours:');
  for (const a of attractions) {
    await upsertPlace({ ...a, description: `${a.category === 'TOUR' ? '🎭' : '🗺️'} ${a.name} - ${a.city}. Đánh giá ${a.rating}/5. ${a.amenities.join(', ')}.` });
  }

  const total = hotels.length + restaurants.length + attractions.length;
  console.log(`\n✅ Done! Seeded ${total} places with TripAdvisor links.\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
