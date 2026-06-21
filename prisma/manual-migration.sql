-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "businessType" TEXT NOT NULL DEFAULT 'CLOTHING';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "targetStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackExpiry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unit" TEXT;

