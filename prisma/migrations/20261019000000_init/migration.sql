-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PoStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "Fulfillment" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('WAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoBatch" (
    "id" TEXT NOT NULL,
    "readyDate" TIMESTAMP(3) NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "status" "PoStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "poBatchId" TEXT NOT NULL,
    "priceOverride" INTEGER,

    CONSTRAINT "PoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerWa" TEXT NOT NULL,
    "fulfillment" "Fulfillment" NOT NULL,
    "address" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'WAITING_PAYMENT',
    "receiptImage" TEXT,
    "receiptUploadedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "poBatchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "PoBatch_status_idx" ON "PoBatch"("status");

-- CreateIndex
CREATE INDEX "PoBatch_readyDate_idx" ON "PoBatch"("readyDate");

-- CreateIndex
CREATE INDEX "PoBatch_closeDate_idx" ON "PoBatch"("closeDate");

-- CreateIndex
CREATE UNIQUE INDEX "PoItem_productId_poBatchId_key" ON "PoItem"("productId", "poBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingId_key" ON "Order"("trackingId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_buyerWa_idx" ON "Order"("buyerWa");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_poBatchId_idx" ON "OrderItem"("poBatchId");

-- CreateIndex
CREATE INDEX "StatusHistory_orderId_idx" ON "StatusHistory"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "PoItem" ADD CONSTRAINT "PoItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoItem" ADD CONSTRAINT "PoItem_poBatchId_fkey" FOREIGN KEY ("poBatchId") REFERENCES "PoBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_poBatchId_fkey" FOREIGN KEY ("poBatchId") REFERENCES "PoBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
