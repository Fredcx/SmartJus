-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "autoCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documentAnalysis" JSONB,
ADD COLUMN     "originalDocumentType" TEXT,
ADD COLUMN     "originalDocumentUrl" TEXT;

-- CreateIndex
CREATE INDEX "Case_autoCreated_idx" ON "Case"("autoCreated");
