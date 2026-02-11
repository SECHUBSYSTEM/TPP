/* eslint-disable @typescript-eslint/no-unused-vars -- seed file: many vars exist for side effects only */
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "password123";

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Locations (5)
  const nigeria = await prisma.location.upsert({
    where: { name: "Nigeria" },
    update: {},
    create: { name: "Nigeria" },
  });
  const usa = await prisma.location.upsert({
    where: { name: "United States" },
    update: {},
    create: { name: "United States" },
  });
  const uk = await prisma.location.upsert({
    where: { name: "United Kingdom" },
    update: {},
    create: { name: "United Kingdom" },
  });
  const southAfrica = await prisma.location.upsert({
    where: { name: "South Africa" },
    update: {},
    create: { name: "South Africa" },
  });
  const india = await prisma.location.upsert({
    where: { name: "India" },
    update: {},
    create: { name: "India" },
  });
  const _locations = [nigeria, usa, uk, southAfrica, india];

  // Product lines (5)
  const electronics = await prisma.productLine.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  });
  const clothing = await prisma.productLine.upsert({
    where: { name: "Clothing" },
    update: {},
    create: { name: "Clothing" },
  });
  const home = await prisma.productLine.upsert({
    where: { name: "Home & Kitchen" },
    update: {},
    create: { name: "Home & Kitchen" },
  });
  const sports = await prisma.productLine.upsert({
    where: { name: "Sports & Outdoors" },
    update: {},
    create: { name: "Sports & Outdoors" },
  });
  const accessories = await prisma.productLine.upsert({
    where: { name: "Accessories" },
    update: {},
    create: { name: "Accessories" },
  });
  const _productLines = { electronics, clothing, home, sports, accessories };

  // Products (10 - Mockaroo style)
  const productData = [
    { name: "Wireless Headphones", category: "electronics", price: 79.99, line: electronics },
    { name: "Cotton T-Shirt", category: "clothing", price: 19.99, line: clothing },
    { name: "Smart Watch", category: "electronics", price: 249.99, line: electronics },
    { name: "Jeans", category: "clothing", price: 49.99, line: clothing },
    { name: "Laptop Stand", category: "electronics", price: 39.99, line: electronics },
    { name: "Winter Jacket", category: "clothing", price: 89.99, line: clothing },
    { name: "Bluetooth Speaker", category: "electronics", price: 59.99, line: electronics },
    { name: "Sneakers", category: "clothing", price: 69.99, line: clothing },
    { name: "USB-C Hub", category: "electronics", price: 34.99, line: electronics },
    { name: "Hoodie", category: "clothing", price: 44.99, line: clothing },
  ];
  const existingProducts = await prisma.product.findMany();
  if (existingProducts.length === 0) {
    for (const p of productData) {
      await prisma.product.create({
        data: {
          name: p.name,
          category: p.category,
          price: p.price,
          productLineId: p.line.id,
        },
      });
    }
  }
  const products = await prisma.product.findMany();

  // 2 Admins
  const _admin1 = await prisma.user.upsert({
    where: { username: "admin1" },
    update: { name: "Jane Admin" },
    create: { username: "admin1", name: "Jane Admin", passwordHash: hash, role: Role.ADMIN },
  });
  const _admin2 = await prisma.user.upsert({
    where: { username: "admin2" },
    update: { name: "John Admin" },
    create: { username: "admin2", name: "John Admin", passwordHash: hash, role: Role.ADMIN },
  });

  // 3 Product Managers (assign to product lines)
  const pm1 = await prisma.user.upsert({
    where: { username: "pm_electronics" },
    update: { name: "Tunde Okafor" },
    create: { username: "pm_electronics", name: "Tunde Okafor", passwordHash: hash, role: Role.PRODUCT_MANAGER },
  });
  const pm2 = await prisma.user.upsert({
    where: { username: "pm_clothing" },
    update: { name: "Amara Nwosu" },
    create: { username: "pm_clothing", name: "Amara Nwosu", passwordHash: hash, role: Role.PRODUCT_MANAGER },
  });
  const pm3 = await prisma.user.upsert({
    where: { username: "pm_mixed" },
    update: { name: "Chioma Eze" },
    create: { username: "pm_mixed", name: "Chioma Eze", passwordHash: hash, role: Role.PRODUCT_MANAGER },
  });
  await prisma.productManagerAssignment.upsert({
    where: { userId_productLineId: { userId: pm1.id, productLineId: electronics.id } },
    update: {},
    create: { userId: pm1.id, productLineId: electronics.id },
  });
  await prisma.productManagerAssignment.upsert({
    where: { userId_productLineId: { userId: pm2.id, productLineId: clothing.id } },
    update: {},
    create: { userId: pm2.id, productLineId: clothing.id },
  });
  await prisma.productManagerAssignment.upsert({
    where: { userId_productLineId: { userId: pm3.id, productLineId: electronics.id } },
    update: {},
    create: { userId: pm3.id, productLineId: electronics.id },
  });
  await prisma.productManagerAssignment.upsert({
    where: { userId_productLineId: { userId: pm3.id, productLineId: clothing.id } },
    update: {},
    create: { userId: pm3.id, productLineId: clothing.id },
  });

  // 2 Location Managers
  const lm1 = await prisma.user.upsert({
    where: { username: "lm_nigeria" },
    update: { name: "Ngozi Okeke" },
    create: { username: "lm_nigeria", name: "Ngozi Okeke", passwordHash: hash, role: Role.LOCATION_MANAGER },
  });
  const lm2 = await prisma.user.upsert({
    where: { username: "lm_uk_us" },
    update: { name: "James Wilson" },
    create: { username: "lm_uk_us", name: "James Wilson", passwordHash: hash, role: Role.LOCATION_MANAGER },
  });
  await prisma.locationManagerAssignment.upsert({
    where: { userId_locationId: { userId: lm1.id, locationId: nigeria.id } },
    update: {},
    create: { userId: lm1.id, locationId: nigeria.id },
  });
  await prisma.locationManagerAssignment.upsert({
    where: { userId_locationId: { userId: lm2.id, locationId: uk.id } },
    update: {},
    create: { userId: lm2.id, locationId: uk.id },
  });
  await prisma.locationManagerAssignment.upsert({
    where: { userId_locationId: { userId: lm2.id, locationId: usa.id } },
    update: {},
    create: { userId: lm2.id, locationId: usa.id },
  });

  // 4 Customers (User + Customer profile)
  const cust1User = await prisma.user.upsert({
    where: { username: "customer1" },
    update: {},
    create: { username: "customer1", passwordHash: hash, role: Role.CUSTOMER },
  });
  const cust2User = await prisma.user.upsert({
    where: { username: "customer2" },
    update: {},
    create: { username: "customer2", passwordHash: hash, role: Role.CUSTOMER },
  });
  const cust3User = await prisma.user.upsert({
    where: { username: "customer3" },
    update: {},
    create: { username: "customer3", passwordHash: hash, role: Role.CUSTOMER },
  });
  const cust4User = await prisma.user.upsert({
    where: { username: "customer4" },
    update: {},
    create: { username: "customer4", passwordHash: hash, role: Role.CUSTOMER },
  });

  // Upsert by userId so we never duplicate userId (unique on Customer)
  const cust1 = await prisma.customer.upsert({
    where: { userId: cust1User.id },
    update: { name: "Alice Okonkwo", email: "alice@peoplepractice.com", locationId: nigeria.id },
    create: { name: "Alice Okonkwo", email: "alice@peoplepractice.com", locationId: nigeria.id, userId: cust1User.id },
  });
  const cust2 = await prisma.customer.upsert({
    where: { userId: cust2User.id },
    update: { name: "Bob Smith", email: "bob@peoplepractice.com", locationId: uk.id },
    create: { name: "Bob Smith", email: "bob@peoplepractice.com", locationId: uk.id, userId: cust2User.id },
  });
  const cust3 = await prisma.customer.upsert({
    where: { userId: cust3User.id },
    update: { name: "Chidi Nnamdi", email: "chidi@peoplepractice.com", locationId: nigeria.id },
    create: { name: "Chidi Nnamdi", email: "chidi@peoplepractice.com", locationId: nigeria.id, userId: cust3User.id },
  });
  const _cust4 = await prisma.customer.upsert({
    where: { userId: cust4User.id },
    update: { name: "Dave Jones", email: "dave@peoplepractice.com", locationId: usa.id },
    create: { name: "Dave Jones", email: "dave@peoplepractice.com", locationId: usa.id, userId: cust4User.id },
  });

  // Orders with items (so location/product managers see data) - only if none exist
  const existingOrders = await prisma.order.count();
  if (existingOrders > 0) {
    console.log("Seed complete (orders already exist). Default password for all users:", DEFAULT_PASSWORD);
    return;
  }
  await prisma.order.create({
    data: {
      customerId: cust1.id,
      totalAmount: 79.99 + 19.99,
      status: "PENDING",
      items: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: 79.99 },
          { productId: products[1].id, quantity: 1, unitPrice: 19.99 },
        ],
      },
    },
  });
  await prisma.order.create({
    data: {
      customerId: cust2.id,
      totalAmount: 249.99,
      status: "PENDING",
      items: {
        create: [{ productId: products[2].id, quantity: 1, unitPrice: 249.99 }],
      },
    },
  });
  await prisma.order.create({
    data: {
      customerId: cust3.id,
      totalAmount: 49.99 + 44.99,
      status: "SHIPPED",
      items: {
        create: [
          { productId: products[3].id, quantity: 1, unitPrice: 49.99 },
          { productId: products[9].id, quantity: 1, unitPrice: 44.99 },
        ],
      },
    },
  });

  console.log("Seed complete. Default password for all users:", DEFAULT_PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
