-- CreateEnum
CREATE TYPE "FulfillmentGroupStatus" AS ENUM ('PROCESSING', 'READY_FOR_DELIVERY', 'COMPLETED');

-- CreateTable
CREATE TABLE "FulfillmentGroup" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "poBatchId" TEXT NOT NULL,
    "status" "FulfillmentGroupStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfillmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FulfillmentGroup_orderId_idx" ON "FulfillmentGroup"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "FulfillmentGroup_orderId_poBatchId_key" ON "FulfillmentGroup"("orderId", "poBatchId");

-- AddForeignKey
ALTER TABLE "FulfillmentGroup" ADD CONSTRAINT "FulfillmentGroup_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentGroup" ADD CONSTRAINT "FulfillmentGroup_poBatchId_fkey" FOREIGN KEY ("poBatchId") REFERENCES "PoBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
