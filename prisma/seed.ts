import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hyderabad = await prisma.city.upsert({
    where: { name: 'Hyderabad' },
    update: {},
    create: { name: 'Hyderabad', state: 'Telangana', isLive: true },
  });
  const bengaluru = await prisma.city.upsert({
    where: { name: 'Bengaluru' },
    update: {},
    create: { name: 'Bengaluru', state: 'Karnataka', isLive: true },
  });

  const categoryDefs: [string, string][] = [
    ['RC Cars', 'rc-cars'],
    ['RC Trucks', 'rc-trucks'],
    ['Drones', 'drones'],
    ['Cameras', 'cameras'],
    ['Lenses', 'lenses'],
    ['Gaming Gadgets', 'gaming-gadgets'],
    ['VR Headsets', 'vr-headsets'],
    ['Electronics', 'electronics'],
  ];
  const categories: Record<string, { id: string }> = {};
  for (const [name, slug] of categoryDefs) {
    categories[slug] = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const ownerUser = await prisma.user.upsert({
    where: { email: 'rahul@orbit.demo' },
    update: {},
    create: {
      email: 'rahul@orbit.demo',
      phone: '+919800000001',
      passwordHash,
      roles: ['OWNER', 'RENTER'],
      profile: { create: { fullName: 'Rahul Kapoor' } },
      ownerProfile: { create: { payoutAccountRef: 'HDFC ****4417' } },
      customerProfile: { create: {} },
      verification: { create: { status: 'VERIFIED' } },
    },
    include: { ownerProfile: true },
  });

  await prisma.user.upsert({
    where: { email: 'ananya@orbit.demo' },
    update: {},
    create: {
      email: 'ananya@orbit.demo',
      phone: '+919800000002',
      passwordHash,
      roles: ['RENTER'],
      profile: { create: { fullName: 'Ananya Rao' } },
      customerProfile: { create: {} },
      verification: { create: { status: 'VERIFIED' } },
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@orbit.demo' },
    update: {},
    create: {
      email: 'admin@orbit.demo',
      phone: '+919800000003',
      passwordHash,
      roles: ['ADMIN'],
      profile: { create: { fullName: 'Orbit Admin' } },
    },
  });

  const ownerProfileId = ownerUser.ownerProfile?.id;
  if (!ownerProfileId) throw new Error('Owner profile was not created as expected');

  const items: {
    title: string;
    cat: string;
    city: string;
    day: number;
    hour?: number;
    deposit: number;
    status?: 'LIVE' | 'IN_REVIEW';
  }[] = [
    { title: '4WD Off-Road RC Buggy', cat: 'rc-cars', city: hyderabad.id, day: 799, hour: 149, deposit: 3000 },
    { title: 'Premium RC Sports Car', cat: 'rc-cars', city: bengaluru.id, day: 899, hour: 179, deposit: 3500 },
    { title: 'Mini Camera Drone 4K', cat: 'drones', city: hyderabad.id, day: 1499, hour: 299, deposit: 6000, status: 'IN_REVIEW' },
    { title: 'Full-Frame Mirrorless Body', cat: 'cameras', city: hyderabad.id, day: 1999, deposit: 15000 },
    { title: '85mm f/1.4 Portrait Lens', cat: 'lenses', city: bengaluru.id, day: 499, deposit: 8000 },
    { title: 'Standalone VR Headset', cat: 'vr-headsets', city: hyderabad.id, day: 399, hour: 99, deposit: 6000 },
  ];

  for (const it of items) {
    await prisma.item.create({
      data: {
        ownerId: ownerProfileId,
        categoryId: categories[it.cat].id,
        cityId: it.city,
        title: it.title,
        status: it.status || 'LIVE',
        rules: 'Return with battery charged above 30%. No unauthorized modifications.',
        pricing: {
          create: [
            { unit: 'DAY', amount: it.day, depositAmount: it.deposit },
            ...(it.hour ? [{ unit: 'HOUR' as const, amount: it.hour, depositAmount: it.deposit }] : []),
          ],
        },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: 2 cities, 8 categories, 3 users, 6 items (1 pending review).');
  // eslint-disable-next-line no-console
  console.log('Demo logins (all password123):');
  // eslint-disable-next-line no-console
  console.log('  rahul@orbit.demo   - owner + renter');
  // eslint-disable-next-line no-console
  console.log('  ananya@orbit.demo  - renter');
  // eslint-disable-next-line no-console
  console.log('  admin@orbit.demo   - admin');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
