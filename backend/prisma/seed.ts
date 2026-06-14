import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

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

  console.log('Khởi tạo người dùng thử nghiệm nếu chưa có...');
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

  console.log('Khởi tạo quản trị viên nếu chưa có...');
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

  console.log('Khởi tạo tài khoản đối tác Booking.com...');
  let partnerUser = await prisma.user.findFirst({
    where: { email: 'booking-partner@travelhub.com' },
  });

  if (!partnerUser) {
    partnerUser = await prisma.user.create({
      data: {
        email: 'booking-partner@travelhub.com',
        fullName: 'Booking.com Partner',
        avatarUrl: 'https://logos-world.net/wp-content/uploads/2021/02/Booking-Logo-700x394.png',
        role: 'BUSINESS_OWNER',
        status: 'ACTIVE',
      },
    });
  }

  // Load feed dynamically from URL or local file
  let deals: any[] = [];
  const feedUrl = process.env.BOOKING_COM_FEED_URL;

  if (feedUrl) {
    try {
      console.log(`[Seed] Đang tải feed từ URL: ${feedUrl}`);
      const response = await fetch(feedUrl);
      if (response.ok) {
        deals = await response.json() as any[];
        console.log(`[Seed] Tải thành công ${deals.length} deals từ feed.`);
      } else {
        console.warn(`[Seed] Không thể tải từ URL. Status: ${response.status}`);
      }
    } catch (e: any) {
      console.warn(`[Seed] Lỗi tải từ URL: ${e.message}`);
    }
  }

  if (deals.length === 0) {
    try {
      const localPath = path.join(process.cwd(), 'booking_partner_feed.json');
      console.log(`[Seed] Đang tải feed từ file cục bộ: ${localPath}`);
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, 'utf-8');
        deals = JSON.parse(fileContent);
        console.log(`[Seed] Tải thành công ${deals.length} deals từ file cục bộ.`);
      } else {
        console.warn(`[Seed] Không tìm thấy file cục bộ tại ${localPath}`);
      }
    } catch (e: any) {
      console.error(`[Seed] Lỗi đọc file cục bộ:`, e.message);
    }
  }

  if (deals.length === 0) {
    console.warn('[Seed] Không nạp được dữ liệu Booking.com. Tiến trình kết thúc.');
    return;
  }

  console.log('Đang đồng bộ dữ liệu Booking.com vào cơ sở dữ liệu...');
  let count = 0;
  for (const deal of deals) {
    // 1. Tạo địa điểm du lịch
    const place = await prisma.place.create({
      data: {
        name: deal.name,
        description: deal.description,
        category: deal.category,
        address: deal.address,
        latitude: deal.latitude,
        longitude: deal.longitude,
        priceMin: deal.priceMin,
        priceMax: deal.priceMax,
        priceRange: deal.priceRange,
        avgRating: deal.avgRating,
        ratingAverage: deal.avgRating,
        amenities: deal.amenities,
        images: deal.images,
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    // 2. Tạo giá phòng đối tác Booking.com
    await prisma.partnerPrice.create({
      data: {
        placeId: place.id,
        partnerName: 'BOOKING_COM',
        price: deal.partnerPrice,
        currency: 'VND',
        deepLink: deal.partnerLink,
      },
    });

    // 3. Tạo bài viết quảng bá (Post) của Booking.com Partner
    const post = await prisma.post.create({
      data: {
        userId: partnerUser.id,
        content: deal.postContent,
        placeId: place.id,
      },
    });

    // 4. Thêm ảnh bài viết
    if (deal.images && deal.images.length > 0) {
      await prisma.postImage.create({
        data: {
          postId: post.id,
          url: deal.images[0],
        },
      });
    }

    // 5. Gieo một vài Q&A và review mẫu cho địa điểm Booking này để giao diện sinh động
    if (deal.category === 'HOTEL') {
      const q = await prisma.question.create({
        data: {
          placeId: place.id,
          userId: user.id,
          content: 'Khách sạn này có cho phép mang theo thú cưng không và có tính thêm phí không?',
        },
      });

      await prisma.answer.create({
        data: {
          questionId: q.id,
          userId: admin.id,
          content: 'Chào bạn, theo thông tin từ Booking.com, khách sạn có tiếp nhận thú cưng theo yêu cầu, có thể có tính phí phụ thu nhé.',
        },
      });

      await prisma.review.create({
        data: {
          placeId: place.id,
          userId: user.id,
          ratingOverall: 5,
          ratingCleanliness: 5,
          ratingService: 5,
          title: 'Dịch vụ xuất sắc, phòng ốc rất sạch đẹp!',
          content: 'Gia đình tôi đã có một kỳ nghỉ vô cùng thoải mái tại đây. Đặt phòng qua Booking.com thanh toán nhanh chóng và nhận phòng rất dễ dàng.',
        },
      });
    }

    count++;
  }

  console.log(`Đồng bộ thành công ${count} địa điểm & deals từ Booking.com.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
