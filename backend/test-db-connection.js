const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔄 Đang kiểm tra kết nối CSDL và truy vấn danh sách người dùng...');
    
    // 1. Kiểm tra bảng User
    const userCount = await prisma.user.count();
    console.log(`✅ Kết nối CSDL thành công! Tìm thấy ${userCount} người dùng.`);

    // 2. Kiểm tra xem bảng AdminWarning có tồn tại không
    try {
      const warningCount = await prisma.adminWarning.count();
      console.log(`✅ Bảng AdminWarning tồn tại! Hiện có ${warningCount} cảnh báo.`);
    } catch (e) {
      console.error('❌ LỖI: Bảng AdminWarning chưa được tạo trong CSDL.');
      console.error('👉 Vui lòng chạy lệnh: npx prisma db push');
      return;
    }

    // 3. Test logic giống hệt API getAllUsers
    const users = await prisma.user.findMany({
      where: {
        NOT: { email: { contains: 'travelhub.local' } },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
      take: 5
    });

    console.log('✅ Đọc thử danh sách người dùng thành công:');
    users.forEach(u => console.log(`  - [${u.role}] ${u.fullName} (${u.email}) | Trạng thái: ${u.status}`));

  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
