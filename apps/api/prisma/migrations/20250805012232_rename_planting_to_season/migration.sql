/*
  Warnings:

  - You are about to drop the column `plantingId` on the `allotments` table. All the data in the column will be lost.
  - You are about to drop the `plantings` table. If the table is not empty, all the data it contains will be lost.

*/
-- Create the new seasons table first
CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "SeasonEnum" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- Migrate data from plantings to seasons
INSERT INTO "seasons" ("id", "siteId", "organisationId", "year", "season", "notes", "createdAt", "updatedAt")
SELECT "id", "siteId", "organisationId", "year", "season", "notes", "createdAt", "updatedAt"
FROM "plantings";

-- Add the new seasonId column to allotments (nullable initially)
ALTER TABLE "allotments" ADD COLUMN "seasonId" INTEGER;

-- Update allotments to reference the new seasons table
UPDATE "allotments" 
SET "seasonId" = "plantingId";

-- Make seasonId NOT NULL
ALTER TABLE "allotments" ALTER COLUMN "seasonId" SET NOT NULL;

-- Drop the old foreign key constraints
ALTER TABLE "allotments" DROP CONSTRAINT "allotments_plantingId_fkey";
ALTER TABLE "plantings" DROP CONSTRAINT "plantings_organisationId_fkey";
ALTER TABLE "plantings" DROP CONSTRAINT "plantings_siteId_fkey";

-- Drop the old plantingId column
ALTER TABLE "allotments" DROP COLUMN "plantingId";

-- Drop the old plantings table
DROP TABLE "plantings";

-- Add the new foreign key constraints
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
