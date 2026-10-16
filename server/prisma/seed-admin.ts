import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@platform.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  console.log(`Checking for root platform admin: ${adminEmail}...`);

  const existing = await prisma.platformAdmin.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`✓ Platform admin already exists: ${adminEmail} (id: ${existing.id})`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.platformAdmin.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Platform',
        lastName: 'SuperAdmin',
        isSuper: true,
        status: 'active',
      },
    });
    console.log(`✓ Created platform super-admin: ${admin.email} (id: ${admin.id})`);
    console.log(`  Initial password: ${adminPassword}`);
  }

  const planMapSetting = await prisma.platformSetting.findUnique({
    where: { key: 'razorpay.plan_map' },
  });
  if (!planMapSetting) {
    await prisma.platformSetting.create({
      data: {
        key: 'razorpay.plan_map',
        value: {},
      },
    });
    console.log(`✓ Initialized platform_settings: razorpay.plan_map`);
  }

  console.log('✅ Platform admin seeding complete.');
}

seedAdmin()
  .catch((err) => {
    console.error('Failed to seed platform admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });