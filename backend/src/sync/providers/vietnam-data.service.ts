import { Injectable, Logger } from '@nestjs/common';

/**
 * Vietnam Travel Data Service
 * Dữ liệu thực về khách sạn, nhà hàng, tour tại Việt Nam
 * Nguồn: Open data tổng hợp từ các nguồn công khai
 * Deep links: TripAdvisor (không cần API key)
 */
@Injectable()
export class VietnamDataService {
  private readonly logger = new Logger(VietnamDataService.name);

  getHotels(): any[] {
    return [
      // HÀ NỘI
      { name: 'Sofitel Legend Metropole Hanoi', city: 'Hà Nội', address: '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', lat: 21.0245, lng: 105.8412, price: 6500000, rating: 4.9, images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'], amenities: ['Bể bơi', 'Spa', 'Nhà hàng 5 sao', 'WiFi miễn phí', 'Bar & Lounge'], link: 'https://www.booking.com/hotel/vn/sofitel-legend-metropole-hanoi.vi.html' },
      { name: 'JW Marriott Hotel Hanoi', city: 'Hà Nội', address: '8 Đỗ Đức Dục, Nam Từ Liêm, Hà Nội', lat: 21.0169, lng: 105.7839, price: 4200000, rating: 4.8, images: ['https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80'], amenities: ['Bể bơi vô cực', 'Spa', 'Gym', 'WiFi miễn phí', 'Buffet sáng'], link: 'https://www.booking.com/hotel/vn/jw-marriott-hanoi.vi.html' },
      { name: 'Lotte Hotel Hanoi', city: 'Hà Nội', address: '54 Liễu Giai, Ba Đình, Hà Nội', lat: 21.0314, lng: 105.8143, price: 3800000, rating: 4.7, images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'], amenities: ['Sky Bar', 'Bể bơi', 'Spa', 'Buffet quốc tế', 'WiFi'], link: 'https://www.booking.com/hotel/vn/lotte-hanoi.vi.html' },
      { name: 'Hanoi La Siesta Hotel & Spa', city: 'Hà Nội', address: '94 Mã Mây, Hoàn Kiếm, Hà Nội', lat: 21.0337, lng: 105.8507, price: 1800000, rating: 4.6, images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80'], amenities: ['Spa', 'Bar', 'WiFi miễn phí', 'Bữa sáng'], link: 'https://www.booking.com/hotel/vn/hanoi-la-siesta.vi.html' },
      { name: 'Apricot Hotel Hanoi', city: 'Hà Nội', address: '136 Hàng Trống, Hoàn Kiếm, Hà Nội', lat: 21.0297, lng: 105.8494, price: 2500000, rating: 4.7, images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80'], amenities: ['View Hồ Hoàn Kiếm', 'Nhà hàng fine dining', 'Spa', 'WiFi'], link: 'https://www.booking.com/hotel/vn/apricot.vi.html' },
      { name: 'InterContinental Hanoi Westlake', city: 'Hà Nội', address: '5 Từ Hoa, Quảng An, Tây Hồ, Hà Nội', lat: 21.0587, lng: 105.8324, price: 3200000, rating: 4.8, images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'], amenities: ['Xây trên mặt nước', 'Sunset Bar', 'Bể bơi ngoài trời', 'Gym', 'WiFi'], link: 'https://www.booking.com/hotel/vn/intercontinental-hanoi-westlake.vi.html' },
      { name: 'Somerset Grand Hanoi', city: 'Hà Nội', address: '49 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', lat: 21.0264, lng: 105.8472, price: 2100000, rating: 4.6, images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'], amenities: ['Căn hộ dịch vụ', 'Bể bơi', 'Sân tennis', 'Khu vui chơi trẻ em', 'WiFi'], link: 'https://www.booking.com/hotel/vn/somerset-grand-hanoi.vi.html' },

      // TP. HỒ CHÍ MINH
      { name: 'Park Hyatt Saigon', city: 'TP. Hồ Chí Minh', address: '2 Công Trường Lam Sơn, Quận 1, TP.HCM', lat: 10.7764, lng: 106.7032, price: 7000000, rating: 4.9, images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'], amenities: ['Bể bơi', 'Spa', 'Bar', 'Nhà hàng Xq', 'WiFi'], link: 'https://www.booking.com/hotel/vn/park-hyatt-saigon.vi.html' },
      { name: 'Caravelle Saigon', city: 'TP. Hồ Chí Minh', address: '19-23 Công Trường Lam Sơn, Quận 1', lat: 10.7761, lng: 106.7027, price: 4500000, rating: 4.8, images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'], amenities: ['Rooftop Bar', 'Bể bơi', 'Spa', 'WiFi'], link: 'https://www.booking.com/hotel/vn/caravellesaigon.vi.html' },
      { name: 'The Reverie Saigon', city: 'TP. Hồ Chí Minh', address: '22-36 Nguyễn Huệ, Quận 1, TP.HCM', lat: 10.7740, lng: 106.7034, price: 8500000, rating: 4.9, images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'], amenities: ['Bể bơi vô cực', 'Spa cao cấp', 'Bar & Lounge', 'View sông', 'Nội thất Ý'], link: 'https://www.booking.com/hotel/vn/the-reverie-saigon.vi.html' },
      { name: 'Hotel Majestic Saigon', city: 'TP. Hồ Chí Minh', address: '1 Đồng Khởi, Quận 1, TP.HCM', lat: 10.7725, lng: 106.7067, price: 2400000, rating: 4.5, images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'], amenities: ['Lịch sử từ 1925', 'Bể bơi ngoài trời', 'Rooftop Bar', 'View sông Sài Gòn'], link: 'https://www.booking.com/hotel/vn/majestic-saigon.vi.html' },
      { name: 'Rex Hotel Saigon', city: 'TP. Hồ Chí Minh', address: '141 Nguyễn Huệ, Quận 1, TP.HCM', lat: 10.7758, lng: 106.7015, price: 2600000, rating: 4.6, images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'], amenities: ['Vị trí trung tâm', 'Bể bơi', 'Rooftop Garden', 'Tennis court', 'WiFi'], link: 'https://www.booking.com/hotel/vn/rex.vi.html' },

      // ĐÀ NẴNG
      { name: 'InterContinental Danang Sun Peninsula Resort', city: 'Đà Nẵng', address: 'Bán đảo Sơn Trà, Đà Nẵng', lat: 16.1120, lng: 108.2880, price: 9000000, rating: 4.9, images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'], amenities: ['Bãi biển riêng', 'Bể bơi vô cực', 'Spa', 'Funicular riêng'], link: 'https://www.booking.com/hotel/vn/intercontinental-danang-sun-peninsula-resort.vi.html' },
      { name: 'Hyatt Regency Danang Resort & Spa', city: 'Đà Nẵng', address: '5 Trường Sa, Hoà Hải, Ngũ Hành Sơn', lat: 15.9677, lng: 108.2666, price: 4800000, rating: 4.8, images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80'], amenities: ['5 bể bơi', 'Bãi biển riêng', 'Spa', 'Gym'], link: 'https://www.booking.com/hotel/vn/hyatt-regency-danang-resort-and-spa.vi.html' },
      { name: 'Novotel Danang Premier Han River', city: 'Đà Nẵng', address: '36 Bạch Đằng, Hải Châu, Đà Nẵng', lat: 16.0778, lng: 108.2238, price: 2300000, rating: 4.7, images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80'], amenities: ['View sông Hàn', 'Rooftop Sky36', 'Bể bơi', 'WiFi'], link: 'https://www.booking.com/hotel/vn/novotel-danang-premier-han-river.vi.html' },
      { name: 'Pullman Danang Beach Resort', city: 'Đà Nẵng', address: '101 Võ Nguyên Giáp, Khuê Mỹ, Ngũ Hành Sơn', lat: 16.0385, lng: 108.2492, price: 3100000, rating: 4.7, images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'], amenities: ['Bãi biển Mỹ Khê', 'Hồ bơi vô cực', 'Spa', 'Tennis court', 'WiFi'], link: 'https://www.booking.com/hotel/vn/pullman-danang-beach-resort.vi.html' },

      // HỘI AN
      { name: 'Four Seasons Resort The Nam Hai', city: 'Hội An', address: 'Đường Hà My Bắc, Điện Dương, Quảng Nam', lat: 15.8756, lng: 108.2957, price: 12000000, rating: 5.0, images: ['https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800&q=80'], amenities: ['3 bể bơi', 'Bãi biển riêng', 'Spa', 'Butler service'], link: 'https://www.booking.com/hotel/vn/four-seasons-resort-the-nam-hai-hoi-an.vi.html' },
      { name: 'Anantara Hội An Resort', city: 'Hội An', address: '1 Phạm Hồng Thái, Cẩm Châu, Hội An', lat: 15.8779, lng: 108.3348, price: 4200000, rating: 4.8, images: ['https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80'], amenities: ['Bể bơi', 'Spa', 'Nhà hàng ven sông', 'Tour phố cổ'], link: 'https://www.booking.com/hotel/vn/life-heritage-resort-hoi-an.vi.html' },
      { name: 'Allegro Hoi An Luxury Hotel & Spa', city: 'Hội An', address: '86 Trần Hưng Đạo, Cẩm Phô, Hội An', lat: 15.8795, lng: 108.3245, price: 1700000, rating: 4.7, images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'], amenities: ['Gần phố cổ', 'Hồ bơi ngoài trời', 'Spa', 'Xe đạp miễn phí'], link: 'https://www.booking.com/hotel/vn/allegro-hoi-an.vi.html' },

      // PHÚ QUỐC
      { name: 'JW Marriott Phu Quoc Emerald Bay', city: 'Phú Quốc', address: 'Khu Bãi Khem, An Thới, Phú Quốc', lat: 10.0289, lng: 103.9931, price: 8000000, rating: 4.9, images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'], amenities: ['Bãi biển riêng', '5 bể bơi', 'Spa', 'Khu vui chơi trẻ em'], link: 'https://www.booking.com/hotel/vn/jw-marriott-phu-quoc-emerald-bay.vi.html' },
      { name: 'Premier Village Phu Quoc Resort', city: 'Phú Quốc', address: 'Mũi Ông Đội, An Thới, Phú Quốc', lat: 10.0192, lng: 103.9842, price: 5500000, rating: 4.8, images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80'], amenities: ['Villa riêng', 'Bãi biển', 'Bể bơi', 'Đảo riêng'], link: 'https://www.booking.com/hotel/vn/premier-village-phu-quoc-resort-managed-by-accorhotels.vi.html' },
      { name: 'Vinpearl Resort & Spa Phú Quốc', city: 'Phú Quốc', address: 'Khu Bãi Dài, Gành Dầu, Phú Quốc', lat: 10.3392, lng: 103.8564, price: 2900000, rating: 4.7, images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'], amenities: ['Sát biển', 'Hồ bơi cực lớn', 'Gần Safari & Grand World', 'Spa ngoài trời', 'WiFi'], link: 'https://www.booking.com/hotel/vn/vinpearl-resort-spa-phu-quoc.vi.html' },

      // NHA TRANG
      { name: 'Sheraton Nha Trang Hotel & Spa', city: 'Nha Trang', address: '26-28 Trần Phú, Nha Trang, Khánh Hoà', lat: 12.2437, lng: 109.1952, price: 3500000, rating: 4.7, images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80'], amenities: ['View biển', 'Rooftop pool', 'Spa', 'Gym'], link: 'https://www.booking.com/hotel/vn/sheraton-nha-trang.vi.html' },
      { name: 'Mia Resort Nha Trang', city: 'Nha Trang', address: 'Bãi Dài, Cam Lâm, Khánh Hoà', lat: 12.0657, lng: 109.1290, price: 4200000, rating: 4.8, images: ['https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80'], amenities: ['Bãi biển riêng', 'Bể bơi', 'Spa', 'Snorkeling'], link: 'https://www.booking.com/hotel/vn/mia-resort-nha-trang.vi.html' },
      { name: 'Amiana Resort Nha Trang', city: 'Nha Trang', address: 'Phạm Văn Đồng, Vĩnh Hòa, Nha Trang', lat: 12.3025, lng: 109.2147, price: 3300000, rating: 4.8, images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'], amenities: ['Hồ nước khoáng riêng', 'Bãi biển cát trắng', 'Hồ bơi nước biển', 'Spa', 'WiFi'], link: 'https://www.booking.com/hotel/vn/amiana-resort.vi.html' },

      // ĐÀ LẠT
      { name: 'Dalat Palace Heritage Hotel', city: 'Đà Lạt', address: '2 Trần Phú, Phường 3, Đà Lạt', lat: 11.9415, lng: 108.4384, price: 3200000, rating: 4.7, images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'], amenities: ['Lịch sử 1922', 'Golf', 'Spa', 'Nhà hàng cổ điển'], link: 'https://www.booking.com/hotel/vn/dalat-palace.vi.html' },
      { name: 'Ana Mandara Villas Dalat Resort', city: 'Đà Lạt', address: 'Lê Lai, Phường 5, Đà Lạt', lat: 11.9385, lng: 108.4360, price: 2800000, rating: 4.7, images: ['https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800&q=80'], amenities: ['Villa kiểu Pháp', 'Spa', 'Vườn hoa', 'WiFi'], link: 'https://www.booking.com/hotel/vn/ana-mandara-villas-dalat-resort-spa.vi.html' },

      // HUẾ
      { name: 'Azerai La Residence Hue', city: 'Huế', address: '5 Lê Lợi, Vĩnh Ninh, Huế', lat: 16.4651, lng: 107.5988, price: 3800000, rating: 4.8, images: ['https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=800&q=80'], amenities: ['Bể bơi ven sông Hương', 'Art Deco 1930', 'Spa', 'Nhà hàng'], link: 'https://www.booking.com/hotel/vn/la-residence-hotel-spa.vi.html' },
      { name: 'Imperial Hotel Hue', city: 'Huế', address: '8 Hùng Vương, Phú Hội, Huế', lat: 16.4687, lng: 107.5941, price: 1500000, rating: 4.6, images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'], amenities: ['Kiến trúc cung đình', 'Rooftop Bar', 'Bể bơi', 'Spa', 'WiFi'], link: 'https://www.booking.com/hotel/vn/imperial-hue.vi.html' },

      // HẠ LONG
      { name: 'Paradise Elegance Cruise', city: 'Hạ Long', address: 'Cảng Quốc tế Tuần Châu, Hạ Long', lat: 20.9131, lng: 107.0349, price: 5500000, rating: 4.9, images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], amenities: ['Du thuyền 5 sao', 'Kayak', 'Tắm hang động', 'Ẩm thực'], link: 'https://www.booking.com/hotel/vn/paradise-luxury-cruises.vi.html' },
      { name: 'Vinpearl Resort & Spa Hạ Long', city: 'Hạ Long', address: 'Đảo Rêu, Bãi Cháy, Hạ Long', lat: 20.9425, lng: 107.0452, price: 2800000, rating: 4.7, images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'], amenities: ['Nằm trên đảo riêng', 'Hồ bơi cực lớn', 'View vịnh Hạ Long', 'Spa', 'Bãi biển riêng'], link: 'https://www.booking.com/hotel/vn/vinpearl-ha-long-bay-resort.vi.html' },

      // SAPA
      { name: 'Hotel de la Coupole MGallery Sapa', city: 'Sapa', address: '1 Hoàng Diệu, Sapa, Lào Cai', lat: 22.3361, lng: 103.8443, price: 4500000, rating: 4.8, images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'], amenities: ['View Fansipan', 'Bể bơi trong nhà', 'Spa', 'Lò sưởi'], link: 'https://www.booking.com/hotel/vn/hotel-de-la-coupole-mgallery-by-sofitel.vi.html' },
      { name: 'Silk Path Grand Resort & Spa Sapa', city: 'Sapa', address: 'Đồi Quan Điểm, Tổ 10, Sapa', lat: 22.3412, lng: 103.8385, price: 2500000, rating: 4.8, images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'], amenities: ['Vườn hoa hồng lớn', 'Bể bơi bốn mùa', 'Spa', 'View dãy Hoàng Liên Sơn'], link: 'https://www.booking.com/hotel/vn/silk-path-grand-resort-spa-sapa.vi.html' },
    ].map(h => ({
      externalId: `vn_hotel_${h.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: h.name,
      description: `🏨 ${h.name} - Khách sạn sang trọng tại ${h.city}, Việt Nam. Đánh giá ${h.rating}/5 ⭐. Tiện nghi: ${h.amenities.join(', ')}.`,
      category: 'HOTEL',
      city: h.city,
      address: h.address,
      latitude: h.lat,
      longitude: h.lng,
      priceMin: Math.round(h.price * 0.85),
      priceMax: Math.round(h.price * 1.55),
      priceRange: `${Math.round(h.price).toLocaleString('vi-VN')}đ/đêm`,
      avgRating: h.rating,
      amenities: h.amenities,
      images: h.images,
      partnerPrice: h.price,
      partnerLink: h.link,
      source: 'BOOKING_COM',
      partnerName: 'BOOKING_COM',
    }));
  }

  getRestaurants(): any[] {
    return [
      // HÀ NỘI
      { name: 'Chả Cá Lã Vọng', city: 'Hà Nội', address: '14 Chả Cá, Hoàn Kiếm, Hà Nội', lat: 21.0360, lng: 105.8468, price: 250000, rating: 4.6, images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], amenities: ['Chả cá đặc sản', 'Lịch sử 100 năm', 'Ngồi bàn thấp'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1025181-Reviews-Cha_Ca_La_Vong-Hanoi.html' },
      { name: 'Bun Cha Huong Lien', city: 'Hà Nội', address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội', lat: 21.0211, lng: 105.8512, price: 100000, rating: 4.7, images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], amenities: ['Bún chả Obama nổi tiếng', 'Nem cuốn', 'Bia Hà Nội'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d8110284-Reviews-Bun_Cha_Huong_Lien-Hanoi.html' },
      { name: 'Quan An Ngon', city: 'Hà Nội', address: '18 Phan Bội Châu, Hoàn Kiếm, Hà Nội', lat: 21.0275, lng: 105.8426, price: 150000, rating: 4.5, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], amenities: ['100+ món ăn VN', 'Sân vườn', 'Phở', 'Bánh cuốn'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1524793-Reviews-Quan_An_Ngon-Hanoi.html' },
      { name: 'Pizza 4P\'s Hanoi', city: 'Hà Nội', address: '24 Lý Quốc Sư, Hoàn Kiếm, Hà Nội', lat: 21.0319, lng: 105.8491, price: 300000, rating: 4.7, images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'], amenities: ['Pizza lò củi', 'Phô mai tươi', 'Đặt bàn online'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d8559088-Reviews-Pizza_4P_s-Hanoi.html' },
      { name: 'Phở Gia Truyền Bát Đàn', city: 'Hà Nội', address: '49 Bát Đàn, Cửa Đông, Hoàn Kiếm, Hà Nội', lat: 21.0321, lng: 105.8475, price: 65000, rating: 4.6, images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], amenities: ['Phở bò gia truyền', 'Xếp hàng truyền thống', 'Lâu đời'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1154562-Reviews-Pho_Bat_Dan-Hanoi.html' },
      { name: 'Nhà hàng Sen Tây Hồ', city: 'Hà Nội', address: '614 Lạc Long Quân, Tây Hồ, Hà Nội', lat: 21.0768, lng: 105.8175, price: 380000, rating: 4.5, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], amenities: ['Buffet ẩm thực lớn nhất VN', 'Khu ẩm thực Sen Tây Hồ', 'View Hồ Tây'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d1112445-Reviews-Sen_Tay_Ho-Hanoi.html' },
      { name: 'Gia Restaurant', city: 'Hà Nội', address: '61 Văn Miếu, Đống Đa, Hà Nội', lat: 21.0289, lng: 105.8364, price: 1800000, rating: 4.9, images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], amenities: ['Nhà hàng đạt sao Michelin', 'Fine Dining hiện đại', 'Concept văn hoá Việt', 'Đặt bàn trước'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293924-d23821035-Reviews-GIA_Restaurant-Hanoi.html' },

      // TP. HỒ CHÍ MINH
      { name: 'Nhà Hàng Ngon', city: 'TP. Hồ Chí Minh', address: '160 Pasteur, Bến Nghé, Quận 1', lat: 10.7760, lng: 106.7007, price: 200000, rating: 4.6, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], amenities: ['Ẩm thực VN', 'Sân vườn thuộc địa', '100+ món'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1522940-Reviews-Nha_Hang_Ngon-Ho_Chi_Minh_City.html' },
      { name: 'The Deck Saigon', city: 'TP. Hồ Chí Minh', address: '38 Nguyễn Ư Dĩ, Thảo Điền, Quận 2', lat: 10.8023, lng: 106.7343, price: 500000, rating: 4.7, images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], amenities: ['Riverside dining', 'Cocktail bar', 'International cuisine'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1524776-Reviews-The_Deck_Saigon-Ho_Chi_Minh_City.html' },
      { name: 'Cục Gạch Quán', city: 'TP. Hồ Chí Minh', address: '10 Đặng Tất, Tân Định, Quận 1', lat: 10.7891, lng: 106.6989, price: 300000, rating: 4.7, images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], amenities: ['Nhà cổ 1930', 'Ẩm thực Nam Bộ', 'Vườn cây xanh'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1524786-Reviews-Cuc_Gach_Quan-Ho_Chi_Minh_City.html' },
      { name: 'Phở Lệ Sài Gòn', city: 'TP. Hồ Chí Minh', address: '415 Nguyễn Trãi, Phường 7, Quận 5', lat: 10.7538, lng: 106.6789, price: 90000, rating: 4.6, images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], amenities: ['Phở Nam Bộ chuẩn vị', 'Nước dùng đậm đà', 'Mở cửa khuya'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d1025176-Reviews-Pho_Le-Ho_Chi_Minh_City.html' },
      { name: 'Anan Saigon', city: 'TP. Hồ Chí Minh', address: '89 Tôn Thất Đạm, Bến Nghé, Quận 1', lat: 10.7712, lng: 106.7045, price: 1600000, rating: 4.8, images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], amenities: ['Sao Michelin danh giá', 'Street food nâng tầm', 'Rooftop Bar', 'View chợ cũ'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293925-d12345095-Reviews-Anan_Saigon-Ho_Chi_Minh_City.html' },

      // ĐÀ NẴNG
      { name: 'Madame Lân', city: 'Đà Nẵng', address: '4 Bạch Đằng, Hải Châu, Đà Nẵng', lat: 16.0712, lng: 108.2237, price: 180000, rating: 4.6, images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], amenities: ['Ẩm thực miền Trung', 'Mì Quảng', 'View sông Hàn'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298085-d1524739-Reviews-Madame_Lan-Da_Nang.html' },
      { name: 'Waterfront Restaurant Danang', city: 'Đà Nẵng', address: '150/11 Bạch Đằng, Hải Châu, Đà Nẵng', lat: 16.0698, lng: 108.2231, price: 350000, rating: 4.7, images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], amenities: ['View sông Hàn', 'Hải sản tươi sống', 'Bar', 'Live music'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298085-d1524768-Reviews-Waterfront_Restaurant_Bar-Da_Nang.html' },
      { name: 'Nhà hàng hải sản Bé Mặn', city: 'Đà Nẵng', address: 'Lô 11 Võ Nguyên Giáp, Mân Thái, Sơn Trà', lat: 16.0845, lng: 108.2487, price: 450000, rating: 4.5, images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], amenities: ['Hải sản tươi sống chọn tại bể', 'Không khí nhộn nhịp', 'Sát bãi biển Mỹ Khê'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298085-d7274092-Reviews-Nha_Hang_Be_Man-Da_Nang.html' },

      // HỘI AN
      { name: 'Mango Rooms', city: 'Hội An', address: '111 Nguyễn Thái Học, Hội An', lat: 15.8801, lng: 108.3354, price: 280000, rating: 4.7, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], amenities: ['Fusion Á-Âu', 'View phố cổ', 'Cocktail', 'Lãng mạn'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298082-d1024870-Reviews-Mango_Rooms-Hoi_An.html' },
      { name: 'White Rose Restaurant', city: 'Hội An', address: '533 Hai Bà Trưng, Hội An', lat: 15.8732, lng: 108.3267, price: 150000, rating: 4.7, images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], amenities: ['Bánh bao hoa hồng trắng đặc sản', 'Hoành thánh chiên', 'Gia đình 3 đời'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298082-d1025019-Reviews-White_Rose_Restaurant-Hoi_An.html' },
      { name: 'Bánh Mì Phượng Hội An', city: 'Hội An', address: '2b Phan Chu Trinh, Minh An, Hội An', lat: 15.8778, lng: 108.3312, price: 40000, rating: 4.6, images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'], amenities: ['Bánh mì ngon nhất thế giới', 'Đa dạng nhân', 'Xếp hàng mua'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g298082-d2243555-Reviews-Banh_Mi_Phuong-Hoi_An.html' },

      // NHA TRANG
      { name: 'Lanterns Restaurant', city: 'Nha Trang', address: '34/6 Nguyễn Thiện Thuật, Nha Trang', lat: 12.2429, lng: 109.1940, price: 200000, rating: 4.7, images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], amenities: ['Ẩm thực Việt', 'Cooking class', 'Lồng đèn', 'Rooftop'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293979-d1524804-Reviews-Lanterns_Restaurant-Nha_Trang.html' },
      { name: 'Nhà hàng hải sản Hạnh Xuân', city: 'Nha Trang', address: '36 Cù Huân, Vĩnh Thọ, Nha Trang', lat: 12.2612, lng: 109.1985, price: 300000, rating: 4.5, images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], amenities: ['View sông Cái & Tháp Bà', 'Hải sản tươi sống bình dân'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g293979-d3789542-Reviews-Hanh_Xuan_Restaurant-Nha_Trang.html' },

      // PHÚ QUỐC
      { name: 'Chez Carole Restaurant', city: 'Phú Quốc', address: 'Ấp 4, Dương Tơ, Phú Quốc', lat: 10.2899, lng: 103.9731, price: 350000, rating: 4.8, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'], amenities: ['Hải sản tươi sống', 'Pháp-Việt fusion', 'Bãi biển'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g469418-d1524819-Reviews-Chez_Carole-Phu_Quoc_Island.html' },
      { name: 'Nhà hàng Xin Chào Phú Quốc', city: 'Phú Quốc', address: '66 Trần Hưng Đạo, Dương Đông, Phú Quốc', lat: 10.2125, lng: 103.9592, price: 280000, rating: 4.6, images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'], amenities: ['View ngắm hoàng hôn cực đỉnh', 'Hải sản Phú Quốc', 'Không gian lộng gió'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g469418-d10834241-Reviews-Xin_Chao_Restaurant-Phu_Quoc_Island.html' },

      // SAPA
      { name: 'Nhà hàng A Phủ Sapa', city: 'Sapa', address: '15 Fansipan, Sapa, Lào Cai', lat: 22.3345, lng: 103.8428, price: 220000, rating: 4.7, images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'], amenities: ['Đặc sản Tây Bắc', 'Thắng cố', 'Gà nướng tiêu xanh', 'Lẩu cá hồi Sapa'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g303868-d12450892-Reviews-A_Phu_Restaurant-Sapa.html' },

      // ĐÀ LẠT
      { name: 'Nhà hàng Song May', city: 'Đà Lạt', address: '49 Trần Quang Khải, Phường 8, Đà Lạt', lat: 11.9542, lng: 108.4485, price: 320000, rating: 4.6, images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'], amenities: ['Biệt thự cổ kính ven đồi', 'Ẩm thực Việt cao cấp', 'Không gian lãng mạn'], link: 'https://www.tripadvisor.com.vn/Restaurant_Review-g303946-d2459082-Reviews-Song_May_Restaurant-Da_Lat.html' },
    ].map(r => ({
      externalId: `vn_rest_${r.name.toLowerCase().replace(/[\s']/g, '_')}`,
      name: r.name,
      description: `🍜 ${r.name} - Nhà hàng tại ${r.city}. Đánh giá ${r.rating}/5 ⭐. ${r.amenities.join(', ')}.`,
      category: 'RESTAURANT',
      city: r.city,
      address: r.address,
      latitude: r.lat,
      longitude: r.lng,
      priceMin: Math.round(r.price * 0.7),
      priceMax: Math.round(r.price * 2.5),
      priceRange: `${Math.round(r.price).toLocaleString('vi-VN')}đ/người`,
      avgRating: r.rating,
      amenities: r.amenities,
      images: r.images,
      partnerPrice: r.price,
      partnerLink: r.link,
      source: 'TRIPADVISOR',
      partnerName: 'TRIPADVISOR',
    }));
  }

  getAttractions(): any[] {
    return [
      { name: 'Vịnh Hạ Long', city: 'Hạ Long', address: 'Vịnh Hạ Long, Quảng Ninh', lat: 20.9101, lng: 107.1839, price: 0, rating: 4.9, images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], amenities: ['Di sản UNESCO', 'Hang động', 'Chèo kayak', 'Tắm hang'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g1371476-d311070-Reviews-Ha_Long_Bay-Ha_Long.html', category: 'ATTRACTION' },
      { name: 'Phố Cổ Hội An', city: 'Hội An', address: 'Khu phố cổ Hội An, Quảng Nam', lat: 15.8800, lng: 108.3380, price: 120000, rating: 4.9, images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], amenities: ['Di sản UNESCO', 'Đèn lồng', 'Kiến trúc cổ', 'Thủ công mỹ nghệ'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298082-d324325-Reviews-Ancient_Town-Hoi_An.html', category: 'ATTRACTION' },
      { name: 'Quần thể di tích Cố đô Huế', city: 'Huế', address: 'Khu Hoàng Thành, Thuận Hoá, Huế', lat: 16.4698, lng: 107.5796, price: 200000, rating: 4.8, images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80'], amenities: ['Di sản UNESCO', 'Đại Nội', 'Lăng tẩm', 'Ẩm thực cung đình'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303880-d311083-Reviews-Imperial_Enclosure-Hue.html', category: 'ATTRACTION' },
      { name: 'Thánh địa Mỹ Sơn', city: 'Đà Nẵng', address: 'Mỹ Sơn, Duy Xuyên, Quảng Nam', lat: 15.7694, lng: 108.1233, price: 150000, rating: 4.7, images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80'], amenities: ['Di sản UNESCO', 'Đền Chăm 4-14 thế kỷ', 'Hướng dẫn viên'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298085-d311080-Reviews-My_Son_Sanctuary-Da_Nang.html', category: 'ATTRACTION' },
      { name: 'Bà Nà Hills - Cầu Vàng', city: 'Đà Nẵng', address: 'Xã Hoà Ninh, Hoà Vang, Đà Nẵng', lat: 15.9974, lng: 107.9867, price: 750000, rating: 4.8, images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80'], amenities: ['Cầu Vàng nổi tiếng', 'Cable car', 'Fantasy Park', 'Village Pháp'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298085-d8396456-Reviews-Ba_Na_Hills-Da_Nang.html', category: 'ATTRACTION' },
      { name: 'Phong Nha - Kẻ Bàng', city: 'Đồng Hới', address: 'Xã Sơn Trạch, Bố Trạch, Quảng Bình', lat: 17.5425, lng: 106.2812, price: 250000, rating: 4.9, images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], amenities: ['Hang Sơn Đoòng', 'Di sản UNESCO', 'Trekking', 'Hang động ngầm'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303939-d311069-Reviews-Phong_Nha_Ke_Bang_National_Park-Phong_Nha.html', category: 'ATTRACTION' },
      { name: 'Thung Lũng Tình Yêu Đà Lạt', city: 'Đà Lạt', address: 'Phường 8, Đà Lạt, Lâm Đồng', lat: 11.9563, lng: 108.4255, price: 80000, rating: 4.5, images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'], amenities: ['Hoa rực rỡ', 'Hồ tình yêu', 'Cáp treo', 'Chụp ảnh'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303946-d461178-Reviews-Valley_of_Love-Da_Lat.html', category: 'ATTRACTION' },
      { name: 'Ruộng Bậc Thang Sapa', city: 'Sapa', address: 'Xã Tả Van, Sapa, Lào Cai', lat: 22.2839, lng: 103.8714, price: 0, rating: 4.9, images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'], amenities: ['Ruộng bậc thang đẹp nhất VN', 'Bản làng H\'Mông', 'Trekking', 'Homestay'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g303868-d3207047-Reviews-Ta_Van_Village-Sapa.html', category: 'ATTRACTION' },
      { name: 'Tour Ngắm San Hô Phú Quốc', city: 'Phú Quốc', address: 'Bãi Sao, An Thới, Phú Quốc', lat: 10.0482, lng: 103.9842, price: 450000, rating: 4.8, images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'], amenities: ['Lặn ngắm san hô', 'Câu cá', 'Vui chơi dưới nước', 'Ăn trưa trên thuyền'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g469418-d8563991-Reviews-Coral_Reef_Snorkeling-Phu_Quoc_Island.html', category: 'TOUR' },
      { name: 'Tour Du Thuyền Hạ Long 2N1Đ', city: 'Hạ Long', address: 'Cảng Tuần Châu, Hạ Long', lat: 20.9131, lng: 107.0500, price: 3500000, rating: 4.9, images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'], amenities: ['Du thuyền 4 sao', 'Kayak', 'Hang động', 'Ẩm thực hải sản', 'Ngủ trên vịnh'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g1371476-d3877543-Reviews-Paradise_Elegance_Cruise-Ha_Long.html', category: 'TOUR' },
      { name: 'Tour Phố Cổ Hội An Buổi Tối', city: 'Hội An', address: 'Phố Cổ Hội An, Quảng Nam', lat: 15.8800, lng: 108.3380, price: 100000, rating: 4.9, images: ['https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800&q=80'], amenities: ['Thả đèn hoa đăng', 'Phố đèn lồng', 'Ẩm thực đêm', 'Chụp ảnh'], link: 'https://www.tripadvisor.com.vn/Attraction_Review-g298082-d19280785-Reviews-Hoi_An_Evening_Lantern_Tour-Hoi_An.html', category: 'TOUR' },
    ].map(a => ({
      externalId: `vn_attr_${a.name.toLowerCase().replace(/[\s-]/g, '_').substring(0, 30)}`,
      name: a.name,
      description: `${a.category === 'TOUR' ? '🎭' : '🗺️'} ${a.name} - ${a.city}. Đánh giá ${a.rating}/5 ⭐. ${a.amenities.join(', ')}.`,
      category: a.category,
      city: a.city,
      address: a.address,
      latitude: a.lat,
      longitude: a.lng,
      priceMin: a.price > 0 ? Math.round(a.price * 0.8) : 0,
      priceMax: Math.round(a.price * 2.5) || 500000,
      priceRange: a.price > 0 ? `${a.price.toLocaleString('vi-VN')}đ/người` : 'Miễn phí',
      avgRating: a.rating,
      amenities: a.amenities,
      images: a.images,
      partnerPrice: a.price,
      partnerLink: a.link,
      source: 'TRIPADVISOR',
      partnerName: 'TRIPADVISOR',
    }));
  }

  getFlights(): any[] {
    const routes = [
      { from: 'Hà Nội (HAN)', to: 'TP. Hồ Chí Minh (SGN)', airline: 'Vietnam Airlines', price: 1200000, duration: '2h15m' },
      { from: 'TP. Hồ Chí Minh (SGN)', to: 'Hà Nội (HAN)', airline: 'VietJet Air', price: 899000, duration: '2h20m' },
      { from: 'Hà Nội (HAN)', to: 'Đà Nẵng (DAD)', airline: 'Bamboo Airways', price: 750000, duration: '1h15m' },
      { from: 'TP. Hồ Chí Minh (SGN)', to: 'Phú Quốc (PQC)', airline: 'VietJet Air', price: 650000, duration: '1h00m' },
      { from: 'Hà Nội (HAN)', to: 'Phú Quốc (PQC)', airline: 'Vietnam Airlines', price: 1500000, duration: '2h10m' },
      { from: 'TP. Hồ Chí Minh (SGN)', to: 'Đà Nẵng (DAD)', airline: 'Bamboo Airways', price: 700000, duration: '1h20m' },
      { from: 'Hà Nội (HAN)', to: 'Nha Trang (CXR)', airline: 'VietJet Air', price: 850000, duration: '1h45m' },
      { from: 'TP. Hồ Chí Minh (SGN)', to: 'Đà Lạt (DLI)', airline: 'Vietnam Airlines', price: 580000, duration: '0h55m' },
    ];

    return routes.map(r => ({
      externalId: `flight_${r.from.split(' ')[0]}_${r.to.split(' ')[0]}`.toLowerCase(),
      name: `✈️ ${r.from} → ${r.to}`,
      description: `Vé máy bay ${r.from} → ${r.to}. Hãng: ${r.airline}. Thời gian bay: ${r.duration}. Đặt vé ngay trên TripAdvisor để so sánh giá tốt nhất.`,
      category: 'TOUR',
      city: r.from.split(' ')[0],
      address: `${r.from} → ${r.to}`,
      latitude: 16.0,
      longitude: 108.0,
      priceMin: Math.round(r.price * 0.8),
      priceMax: Math.round(r.price * 2.5),
      priceRange: `Từ ${r.price.toLocaleString('vi-VN')}đ`,
      avgRating: 4.5,
      amenities: [r.airline, `Bay ${r.duration}`, 'Hành lý xách tay 7kg', 'Check-in online'],
      images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80'],
      partnerPrice: r.price,
      partnerLink: `https://www.tripadvisor.com.vn/CheapFlightsSearch?code=SF&d1=${encodeURIComponent(r.from)}&d2=${encodeURIComponent(r.to)}`,
      source: 'TRIPADVISOR',
      partnerName: 'TRIPADVISOR',
    }));
  }
}
