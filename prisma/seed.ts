import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  await prisma.setting.upsert({
    where: { key: "admin_wa" },
    update: {},
    create: {
      key: "admin_wa",
      value: "081200000000",
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
    prisma.product.create({
      data: {
        name: "Es Cendol Durian",
        description: "Cendol segar dengan durian montong, santan kental.",
        price: 28000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sate Padang",
        description: "Sate Padang dengan kuah kuning khas, bumbu rempah penuh.",
        price: 38000,
        isActive: true,
      },
    }),
  ]);

  const now = new Date();

  // Saturday PO batch: ready Saturday 10am, close Friday 6pm
  const saturday = new Date(now);
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
  saturday.setDate(now.getDate() + daysUntilSat);
  saturday.setHours(10, 0, 0, 0);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() - 1);
  friday.setHours(18, 0, 0, 0);

  // Sunday PO batch: ready Sunday 10am, close Saturday 6pm
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(10, 0, 0, 0);

  const saturdayClose = new Date(saturday);
  saturdayClose.setHours(18, 0, 0, 0);

  const [satProducts, sunProducts] = [products.slice(0, 4), products.slice(4)];

  const satBatch = await prisma.poBatch.create({
    data: {
      readyDate: saturday,
      closeDate: friday,
      status: "OPEN",
      poItems: {
        create: satProducts.map((p) => ({ productId: p.id })),
      },
    },
  });

  const sunBatch = await prisma.poBatch.create({
    data: {
      readyDate: sunday,
      closeDate: saturdayClose,
      status: "OPEN",
      poItems: {
        create: sunProducts.map((p) => ({ productId: p.id })),
      },
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${process.env.ADMIN_EMAIL || "admin@rasarisa.id"}`);
  console.log(`Products: ${products.length}`);
  console.log(`Sat batch ${satBatch.id} (ready ${saturday.toISOString()})`);
  console.log(`Sun batch ${sunBatch.id} (ready ${sunday.toISOString()})`);
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
