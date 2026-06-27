import { PrismaClient, Role, TableStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clear existing orders, tables, products, categories
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const pinHash = await bcrypt.hash("1234", 10);
  const passwordHash = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "andi@gundaling.com" },
    update: {},
    create: {
      name: "Andi Pratama",
      role: Role.Server,
      pinHash,
      email: "andi@gundaling.com",
      password: passwordHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "siti@gundaling.com" },
    update: {},
    create: {
      name: "Siti Aminah",
      role: Role.Server,
      pinHash,
      email: "siti@gundaling.com",
      password: passwordHash,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "budi@gundaling.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      role: Role.Server,
      pinHash,
      email: "budi@gundaling.com",
      password: passwordHash,
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: "david@gundaling.com" },
    update: {},
    create: {
      name: "David Lee",
      role: Role.Manager,
      pinHash,
      email: "david@gundaling.com",
      password: passwordHash,
    },
  });

  const user5 = await prisma.user.upsert({
    where: { email: "juna@gundaling.com" },
    update: {},
    create: {
      name: "Chef Juna",
      role: Role.Chef,
      pinHash,
      email: "juna@gundaling.com",
      password: passwordHash,
    },
  });

  const meals = await prisma.category.create({
    data: { name: "Meals", sortOrder: 1 },
  });

  const dairy = await prisma.category.create({
    data: { name: "Milk & Dairy", sortOrder: 2 },
  });

  const coffee = await prisma.category.create({
    data: { name: "Coffee", sortOrder: 3 },
  });

  const desserts = await prisma.category.create({
    data: { name: "Desserts", sortOrder: 4 },
  });

  const p1 = await prisma.product.create({
    data: {
      name: "Truffle Tagliatelle",
      price: 260000,
      categoryId: meals.id,
      image: "/images/truffle_tagliatelle.png",
      desc: "Handmade pasta tossed in premium shaved black truffle butter, finished with freshly grated dry-aged Parmigiano.",
      badge: "Best Seller",
      details: { temp: "HOT", time: "12 min", calories: "640 kcal" },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: true },
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Crispy Skin Salmon",
      price: 285000,
      categoryId: meals.id,
      image: "/images/crispy_skin_salmon.png",
      desc: "Pan-seared Atlantic salmon on a bed of fresh garlic butter asparagus and creamy mashed mountain potatoes.",
      badge: "Signature",
      details: { temp: "HOT", time: "15 min", calories: "580 kcal" },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: false },
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: "Heirloom Tomato Salad",
      price: 160000,
      categoryId: meals.id,
      image: "/images/heirloom_tomato_salad.png",
      desc: "Fresh heirloom garden tomatoes, artisan buffalo mozzarella, farm basil, drizzled in premium aged balsamic vinegar.",
      badge: "Vegan",
      details: { temp: "COLD", time: "5 min", calories: "220 kcal" },
      standards: { organicCert: true, tempControlled: false, allergenWarning: false, garnishAdded: true },
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: "Fresh Gundaling Cow Milk",
      price: 65000,
      categoryId: dairy.id,
      image: "/images/gundaling_milk.png",
      desc: "Organic raw milk harvested daily from our high-altitude Berastagi dairy farm, pasteurized and flash chilled.",
      badge: "Farmstead Fresh",
      details: { temp: "COLD", time: "1 min", calories: "150 kcal" },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: false },
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: "Single Origin Latte",
      price: 55000,
      categoryId: coffee.id,
      image: "/images/single_origin_latte.png",
      desc: "Premium espresso pulled from organic Sumatra Mandheling beans, combined with steamed Gundaling farm milk.",
      badge: "Artisan",
      details: { temp: "HOT", time: "3 min", calories: "120 kcal" },
      standards: { organicCert: false, tempControlled: true, allergenWarning: false, garnishAdded: true },
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: "Organic Strawberry Gelato",
      price: 85000,
      categoryId: desserts.id,
      image: "/images/strawberry_gelato.png",
      desc: "High-altitude organic strawberries churned with fresh Gundaling farm pasteurized cow milk cream.",
      badge: "Sold Out",
      outOfStock: true,
      details: { temp: "COLD", time: "2 min", calories: "180 kcal" },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: true },
    },
  });

  const t1 = await prisma.table.create({
    data: { name: "Table 01", seats: 4, shape: "circle", posX: 10, posY: 15, status: TableStatus.Available },
  });
  const t2 = await prisma.table.create({
    data: { name: "Table 02", seats: 2, shape: "square", posX: 30, posY: 15, status: TableStatus.Available },
  });
  const t3 = await prisma.table.create({
    data: { name: "Table 03", seats: 4, shape: "square", posX: 50, posY: 15, status: TableStatus.Available },
  });
  const t4 = await prisma.table.create({
    data: { name: "Table 04", seats: 4, shape: "square", posX: 70, posY: 15, status: TableStatus.Available },
  });
  const t5 = await prisma.table.create({
    data: { name: "Table 05", seats: 6, shape: "rectangle", posX: 10, posY: 45, status: TableStatus.Available },
  });
  const t6 = await prisma.table.create({
    data: { name: "Table 06", seats: 2, shape: "circle", posX: 30, posY: 45, status: TableStatus.Available },
  });
  const t7 = await prisma.table.create({
    data: { name: "Table 07", seats: 8, shape: "rectangle", posX: 50, posY: 45, status: TableStatus.Available },
  });
  const t8 = await prisma.table.create({
    data: { name: "Table 08", seats: 6, shape: "rectangle", posX: 70, posY: 45, status: TableStatus.Available },
  });
  const t12 = await prisma.table.create({
    data: { name: "Table 12", seats: 4, shape: "circle", posX: 90, posY: 45, status: TableStatus.Available },
  });

  // Print created user IDs for the user/frontend use
  console.log("Users seeded successfully. Credentials:");
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`- Role: ${u.role}, Name: ${u.name}, ID: ${u.id}, PIN: 1234`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
