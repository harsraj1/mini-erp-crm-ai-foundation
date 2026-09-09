CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');
CREATE TABLE "Product" (
  "id" TEXT NOT NULL, "productName" TEXT NOT NULL, "sku" TEXT NOT NULL, "category" TEXT NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL, "currentStock" INTEGER NOT NULL DEFAULT 0,
  "minimumStockAlertQuantity" INTEGER NOT NULL DEFAULT 0, "warehouseLocation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantityChanged" INTEGER NOT NULL,
  "movementType" "MovementType" NOT NULL, "reason" TEXT NOT NULL, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockMovement_productId_createdAt_id_idx" ON "StockMovement"("productId", "createdAt", "id");
CREATE INDEX "StockMovement_createdById_createdAt_idx" ON "StockMovement"("createdById", "createdAt");
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
