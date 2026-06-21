-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BDT',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "invoiceFooter" TEXT,
ADD COLUMN     "invoicePrefix" TEXT NOT NULL DEFAULT 'SO',
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "taxLabel" TEXT NOT NULL DEFAULT 'VAT',
ADD COLUMN     "taxRatePct" INTEGER NOT NULL DEFAULT 0;

