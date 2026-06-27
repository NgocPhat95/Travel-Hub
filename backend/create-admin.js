/**
 * Script tạo tài khoản admin và reset password
 * Chạy: node create-admin.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@travelhub.com';
const ADMIN_PASSWORD = 'Admin@2026';

async function main() {
  console.log('🔧 Đang thiết lập tài khoản admin...');

  // Tạo hash mật khẩu thực tế
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  console.log('✅ Đã tạo password hash:', passwordHash);

  // Tìm hoặc tạo admin
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    // Update password hash thực tế
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        passwordHash,
        status: 'ACTIVE',
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`✅ Đã cập nhật mật khẩu cho admin: ${ADMIN_EMAIL}`);
  } else {
    // Tạo mới
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        fullName: 'Hệ thống Quản trị viên',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        authProvider: 'EMAIL',
        userLevel: 99,
        experiencePoints: 9999,
        bio: 'Trang quản trị cấp cao của TravelHub.',
      },
    });
    console.log(`✅ Đã tạo admin mới: ${ADMIN_EMAIL}`);
  }

  // Tìm hoặc tạo user thử nghiệm
  const testUserHash = await bcrypt.hash('Test@2026', 10);
  const testExisting = await prisma.user.findUnique({
    where: { email: 'test_user@travelhub.com' },
  });

  if (testExisting) {
    await prisma.user.update({
      where: { email: 'test_user@travelhub.com' },
      data: { passwordHash: testUserHash, status: 'ACTIVE' },
    });
    console.log('✅ Đã cập nhật mật khẩu test user');
  }

  // Hiển thị danh sách tài khoản
  console.log('\n📋 Danh sách tài khoản:');
  const allUsers = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'USER'] },
      email: { not: { contains: 'travelhub.local' } },
    },
    select: { id: true, email: true, fullName: true, role: true, status: true },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  allUsers.forEach(u => {
    console.log(`  - ${u.role}: ${u.email} | Status: ${u.status} | ID: ${u.id}`);
  });

  console.log('\n🔑 Thông tin đăng nhập:');
  console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('  Test user: test_user@travelhub.com / Test@2026');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
