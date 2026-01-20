-- Rename table SavedJurisprudence to Jurisprudence
ALTER TABLE "SavedJurisprudence" RENAME TO "Jurisprudence";

-- Rename columns in Case table to match schema @map directives
ALTER TABLE "Case" RENAME COLUMN "caseNumber" TO "number";
ALTER TABLE "Case" RENAME COLUMN "clientName" TO "plaintiff";
ALTER TABLE "Case" RENAME COLUMN "opposingParty" TO "defendant";
ALTER TABLE "Case" RENAME COLUMN "caseType" TO "subject";
