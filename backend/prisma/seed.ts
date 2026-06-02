import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Xóa dữ liệu cũ để gieo mới...');
  await prisma.postComment.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.postImage.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.businessResponse.deleteMany({});
  await prisma.businessClaim.deleteMany({});
  await prisma.reviewReport.deleteMany({});
  await prisma.reviewLike.deleteMany({});
  await prisma.reviewMedia.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.partnerPrice.deleteMany({});
  await prisma.affiliateClickLog.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.editSuggestion.deleteMany({});
  await prisma.place.deleteMany({});

  console.log('Khởi tạo mock user nếu chưa có...');
  let user = await prisma.user.findUnique({ where: { email: 'test_user@travelhub.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test_user@travelhub.com',
        fullName: 'Nguyễn Văn A',
        passwordHash: '$2b$10$mRz4T2Y.HqO79hJ1r3p5Qe/3cW4U4Jm9d/4k7j5H3D2Z6N8o9p0q2', // Mock bcrypt hash
        role: 'USER',
        status: 'ACTIVE',
        userLevel: 3,
        experiencePoints: 240,
        bio: 'Tôi yêu du lịch và trải nghiệm ẩm thực đường phố.',
      },
    });
  }

  console.log('Khởi tạo mock admin nếu chưa có...');
  let admin = await prisma.user.findUnique({ where: { email: 'admin@travelhub.com' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@travelhub.com',
        fullName: 'Hệ thống Quản trị viên',
        passwordHash: '$2b$10$mRz4T2Y.HqO79hJ1r3p5Qe/3cW4U4Jm9d/4k7j5H3D2Z6N8o9p0q2', // Mat khau giong test_user
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        userLevel: 99,
        experiencePoints: 9999,
        bio: 'Trang quản trị cấp cao của TravelHub.',
      },
    });
  }

  console.log('Gieo dữ liệu địa điểm du lịch mẫu (Seed)...');

  const placesData = [
    {
      name: 'Hồ Hoàn Kiếm (Hồ Gươm)',
      description: 'Trái tim của thủ đô Hà Nội, địa danh văn hóa lịch sử nổi tiếng với Tháp Rùa và Đền Ngọc Sơn.',
      category: 'ATTRACTION',
      address: 'Hồ Hoàn Kiếm, Hàng Trống, Hoàn Kiếm, Hà Nội',
      latitude: 21.0285,
      longitude: 105.8521,
      priceMin: 0,
      priceMax: 0,
      priceRange: 'Miễn phí',
      avgRating: 4.8,
      ratingAverage: 4.8,
      isVerified: true,
      amenities: ['parking', 'walking_street', 'photography'],
      images: [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509060464153-44667396260f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sofitel Legend Metropole Hà Nội',
      description: 'Khách sạn 5 sao cổ điển sang trọng bậc nhất Hà Nội với lối kiến trúc Pháp lãng mạn.',
      category: 'HOTEL',
      address: '15 Ngô Quyền, Tràng Tiền, Hoàn Kiếm, Hà Nội',
      latitude: 21.0253,
      longitude: 105.8553,
      priceMin: 4000000,
      priceMax: 15000000,
      priceRange: '4.000.000 đ - 15.000.000 đ',
      avgRating: 4.7,
      ratingAverage: 4.7,
      isVerified: true,
      amenities: ['wifi', 'parking', 'pool', 'restaurant', 'gym', 'spa'],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Nhà Hàng Quán Ăn Ngon - Phan Bội Châu',
      description: 'Nơi hội tụ tinh hoa ẩm thực đường phố ba miền Việt Nam trong không gian biệt thự cổ kính.',
      category: 'RESTAURANT',
      address: '18 Phan Bội Châu, Cửa Nam, Hoàn Kiếm, Hà Nội',
      latitude: 21.0278,
      longitude: 105.8458,
      priceMin: 100000,
      priceMax: 500000,
      priceRange: '100.000 đ - 500.000 đ',
      avgRating: 4.2,
      ratingAverage: 4.2,
      isVerified: false,
      amenities: ['wifi', 'parking', 'air_conditioning', 'restaurant'],
      images: [
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Nhà thờ Đức Bà Sài Gòn',
      description: 'Kiệt tác kiến trúc Gothic cổ kính, biểu tượng lịch sử văn hóa lâu đời của Thành phố Hồ Chí Minh.',
      category: 'ATTRACTION',
      address: '01 Công xã Paris, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
      latitude: 10.7798,
      longitude: 106.6990,
      priceMin: 0,
      priceMax: 0,
      priceRange: 'Miễn phí',
      avgRating: 4.6,
      ratingAverage: 4.6,
      isVerified: true,
      amenities: ['parking', 'photography'],
      images: [
        'https://images.unsplash.com/photo-1596422846543-75c6fc18a52b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a52b?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'The Reverie Saigon Hotel',
      description: 'Khách sạn 6 sao siêu sang trọng tọa lạc tại trung tâm đại lộ Nguyễn Huệ sôi động.',
      category: 'HOTEL',
      address: '22-36 Nguyễn Huệ, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
      latitude: 10.7753,
      longitude: 106.7021,
      priceMin: 5000000,
      priceMax: 20000000,
      priceRange: '5.000.000 đ - 20.000.000 đ',
      avgRating: 4.9,
      ratingAverage: 4.9,
      isVerified: true,
      amenities: ['wifi', 'parking', 'pool', 'spa', 'restaurant', 'gym'],
      images: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Nhà Hàng Ngon - Pasteur',
      description: 'Địa điểm ẩm thực nổi tiếng phục vụ đa dạng các món ăn Việt Nam truyền thống trong không gian mở sân vườn.',
      category: 'RESTAURANT',
      address: '160 Pasteur, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
      latitude: 10.7781,
      longitude: 106.6972,
      priceMin: 150000,
      priceMax: 800000,
      priceRange: '150.000 đ - 800.000 đ',
      avgRating: 4.4,
      ratingAverage: 4.4,
      isVerified: false,
      amenities: ['wifi', 'parking', 'air_conditioning', 'restaurant'],
      images: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
  ];

  for (const item of placesData) {
    const createdPlace = await prisma.place.create({
      data: item,
    });
    console.log(`Đã tạo địa điểm: ${createdPlace.name}`);

    // Gieo Q&A mẫu cho địa điểm
    if (createdPlace.category === 'ATTRACTION' && createdPlace.name.includes('Hồ Hoàn Kiếm')) {
      const q = await prisma.question.create({
        data: {
          placeId: createdPlace.id,
          userId: user.id,
          content: 'Gửi xe máy ở đâu tiện nhất khi đi dạo phố đi bộ Hồ Gươm cuối tuần vậy mọi người?',
        },
      });

      await prisma.answer.create({
        data: {
          questionId: q.id,
          userId: user.id,
          content: 'Bạn có thể gửi ở khu vực gầm cầu Chương Dương hoặc bãi xe Tràng Tiền Plaza nhé, đi bộ ra rất gần.',
        },
      });

      await prisma.answer.create({
        data: {
          questionId: q.id,
          userId: user.id,
          content: 'Mình hay gửi xe ở phố Bảo Khánh, giá vé 10k gửi rất yên tâm.',
        },
      });
    }

    if (createdPlace.category === 'HOTEL' && createdPlace.name.includes('Metropole')) {
      const q = await prisma.question.create({
        data: {
          placeId: createdPlace.id,
          userId: user.id,
          content: 'Khách sạn có dịch vụ đưa đón sân bay bằng xe riêng không?',
        },
      });

      await prisma.answer.create({
        data: {
          questionId: q.id,
          userId: user.id,
          content: 'Có dịch vụ đưa đón sân bay bằng xe hạng sang (Mercedes/BMW), phí tầm 1.200.000đ/lượt. Bạn nên đặt trước khi check-in.',
        },
      });
    }

    // Gieo giá đối tác liên kết mẫu (PartnerPrice)
    const basePrice = createdPlace.priceMin || 50000;
    await prisma.partnerPrice.createMany({
      data: [
        {
          placeId: createdPlace.id,
          partnerName: 'AGODA',
          price: Math.round(basePrice * 1.05),
          currency: 'VND',
          deepLink: `https://www.agoda.com/partners/partnerlink.html?placeId=${createdPlace.id}`,
        },
        {
          placeId: createdPlace.id,
          partnerName: 'BOOKING_COM',
          price: basePrice, // Best deal
          currency: 'VND',
          deepLink: `https://www.booking.com/affiliate/redirect.html?placeId=${createdPlace.id}`,
        },
        {
          placeId: createdPlace.id,
          partnerName: 'EXPEDIA',
          price: Math.round(basePrice * 1.1),
          currency: 'VND',
          deepLink: `https://www.expedia.com/affiliate/redirect.html?placeId=${createdPlace.id}`,
        },
      ]
    });

    // Gieo một số review và báo cáo review để kiểm duyệt
    if (createdPlace.name.includes('Metropole')) {
      const review1 = await prisma.review.create({
        data: {
          placeId: createdPlace.id,
          userId: user.id,
          ratingOverall: 5,
          ratingCleanliness: 5,
          ratingService: 5,
          title: 'Trải nghiệm tuyệt vời tại Metropole',
          content: 'Không gian sang trọng, dịch vụ chuyên nghiệp, đồ ăn rất ngon. Rất đáng tiền!',
        },
      });

      const review2 = await prisma.review.create({
        data: {
          placeId: createdPlace.id,
          userId: user.id,
          ratingOverall: 2,
          ratingCleanliness: 2,
          ratingService: 1,
          title: 'Review spam - Quảng cáo bán hàng trái phép',
          content: 'Vào đây mua sắm và truy cập trang web cá nhân tại: https://spam-link.com để nhận voucher giảm giá cực lớn 90% ngay hôm nay!!!',
        },
      });

      // Tạo báo cáo cho review2
      await prisma.reviewReport.create({
        data: {
          reviewId: review2.id,
          reporterId: user.id,
          reason: 'Spam quảng cáo và chứa liên kết độc hại, vi phạm tiêu chuẩn cộng đồng.',
        },
      });
    }
  }

  console.log('Gieo dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
