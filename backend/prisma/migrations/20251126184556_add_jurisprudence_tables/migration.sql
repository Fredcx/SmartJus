/*
  Warnings:

  - You are about to drop the column `defendant` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `plaintiff` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `thesis` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HistoryEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Jurisprudence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimelineEvent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `caseType` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientName` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_userId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_caseId_fkey";

-- DropForeignKey
ALTER TABLE "HistoryEntry" DROP CONSTRAINT "HistoryEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "Jurisprudence" DROP CONSTRAINT "Jurisprudence_caseId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_caseId_fkey";

-- DropIndex
DROP INDEX "Case_number_key";

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "defendant",
DROP COLUMN "number",
DROP COLUMN "plaintiff",
DROP COLUMN "subject",
DROP COLUMN "thesis",
ADD COLUMN     "caseNumber" TEXT,
ADD COLUMN     "caseType" TEXT NOT NULL,
ADD COLUMN     "clientName" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "filingDate" TIMESTAMP(3),
ADD COLUMN     "judge" TEXT,
ADD COLUMN     "nextHearingDate" TIMESTAMP(3),
ADD COLUMN     "opposingParty" TEXT,
ADD COLUMN     "statute" TEXT,
ALTER COLUMN "court" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- DropTable
DROP TABLE "ChatMessage";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "HistoryEntry";

-- DropTable
DROP TABLE "Jurisprudence";

-- DropTable
DROP TABLE "TimelineEvent";

-- CreateTable
CREATE TABLE "SavedJurisprudence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "understanding" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedJurisprudence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "query" TEXT NOT NULL,
    "court" TEXT,
    "resultsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedJurisprudence_caseId_idx" ON "SavedJurisprudence"("caseId");

-- CreateIndex
CREATE INDEX "SavedJurisprudence_isFavorite_idx" ON "SavedJurisprudence"("isFavorite");

-- CreateIndex
CREATE INDEX "SearchHistory_caseId_idx" ON "SearchHistory"("caseId");

-- CreateIndex
CREATE INDEX "SearchHistory_createdAt_idx" ON "SearchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Case_userId_idx" ON "Case"("userId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJurisprudence" ADD CONSTRAINT "SavedJurisprudence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
