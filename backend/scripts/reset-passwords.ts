import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'TravelHub@2026';
  const hash = await bcrypt.hash(newPassword, 10);

  // Reset password cho admin user
  const updated = await prisma.user.updateMany({
    where: { email: 'admin@travelhub.com' },
    data: { passwordHash: hash, status: 'ACTIVE' },
  });

  console.log(`Updated ${updated.count} user(s).`);

  // Tạo thêm user test nếu chưa có
  const testEmail = 'user@travelhub.com';
  const existing = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: testEmail,
        fullName: 'Travel User',
        passwordHash: hash,
        authProvider: 'EMAIL',
        status: 'ACTIVE',
        role: 'USER',
      },
    });
    console.log(`Created test user: ${testEmail}`);
  } else {
    await prisma.user.update({
      where: { email: testEmail },
      data: { passwordHash: hash, status: 'ACTIVE' },
    });
    console.log(`Reset password for: ${testEmail}`);
  }

  console.log('\n✅ Credentials sẵn sàng:');
  console.log('   Email: admin@travelhub.com | Password: TravelHub@2026');
  console.log('   Email: user@travelhub.com  | Password: TravelHub@2026');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
