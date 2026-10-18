import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "change-me-now",
    12,
  );
  await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@rasarisa.id" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@rasarisa.id",
      passwordHash,
    },
  });

  // Default settings
  await prisma.setting.upsert({
    where: { key: "bank_account" },
    update: {},
    create: {
      key: "bank_account",
      value: "BCA 1234567890 a.n. Rasa Risa",
    },
  });

  await prisma.setting.upsert({
    where: { key: "delivery_note" },
    update: {},
    create: {
      key: "delivery_note",
      value: "Antar gratis area sekitar. Hubungi WA untuk jangkauan.",
    },
  });

  // Sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Rendang Daging Sapi",
        description: "Rendang autentik Minang, 12 jam masak, bumbu rempah pilihan.",
        price: 85000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Ayam Bakar Bumbu Rica",
        description: "Ayam kampung bakar, bumbu rica khas Manado.",
        price: 45000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sayur Asem Komplit",
        description: "Sayur asem Betawi dengan ikan asin dan melinjo.",
        price: 30000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Kue Lapis Legit",
        description: "Lapis legit klasik, kuning telur, tekstur padat.",
        price: 65000,
        isActive: true,
      },
    }),
  ]);

  // Sample PO batch: ready Saturday, close Friday evening
  const now = new Date();
  const saturday = new Date(now);
  // Find next Saturday (day 6)
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
  saturday.setDate(now.getDate() + daysUntilSat);
  saturday.setHours(10, 0, 0, 0);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() - 1);
  friday.setHours(18, 0, 0, 0);

  const poBatch = await prisma.poBatch.create({
    data: {
      readyDate: saturday,
      closeDate: friday,
      status: "OPEN",
      poItems: {
        create: products.map((p) => ({
          productId: p.id,
        })),
      },
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${process.env.ADMIN_EMAIL || "admin@rasarisa.id"}`);
  console.log(`Products: ${products.length}`);
  console.log(`PO Batch: ${poBatch.id} (ready ${saturday.toISOString()})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
