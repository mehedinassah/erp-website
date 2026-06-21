-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "periodMonths" INTEGER NOT NULL DEFAULT 1,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "gatewaySessionId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

