const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { status: 'INACTIVE' },
    data: { status: 'ACTIVE' },
  });
  console.log(`Activated ${result.count} inactive users!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
