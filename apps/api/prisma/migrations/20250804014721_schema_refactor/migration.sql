/*
  Warnings:

  - You are about to drop the column `allocateDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `collectionDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `organisationId` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `potDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `prickDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `seedDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `sourceLocation` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `batchId` on the `plantings` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `plantings` table. All the data in the column will be lost.
  - You are about to drop the column `plantingDate` on the `plantings` table. All the data in the column will be lost.
  - You are about to drop the column `seasonId` on the `plantings` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seasons` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nurseryId` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `season` to the `plantings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `plantings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `plantings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BatchStageEnum" AS ENUM ('seed', 'prick', 'pot', 'plant');

-- DropForeignKey
ALTER TABLE "batches" DROP CONSTRAINT "batches_organisationId_fkey";

-- DropForeignKey
ALTER TABLE "locations" DROP CONSTRAINT "locations_organisationId_fkey";

-- DropForeignKey
ALTER TABLE "plantings" DROP CONSTRAINT "plantings_batchId_fkey";

-- DropForeignKey
ALTER TABLE "plantings" DROP CONSTRAINT "plantings_locationId_fkey";

-- DropForeignKey
ALTER TABLE "plantings" DROP CONSTRAINT "plantings_seasonId_fkey";

-- AlterTable
ALTER TABLE "batches" DROP COLUMN "allocateDate",
DROP COLUMN "collectionDate",
DROP COLUMN "organisationId",
DROP COLUMN "potDate",
DROP COLUMN "prickDate",
DROP COLUMN "seedDate",
DROP COLUMN "sourceLocation",
DROP COLUMN "status",
ADD COLUMN     "nurseryId" INTEGER NOT NULL,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "stage" "BatchStageEnum";

-- AlterTable
ALTER TABLE "plantings" DROP COLUMN "batchId",
DROP COLUMN "locationId",
DROP COLUMN "plantingDate",
DROP COLUMN "seasonId",
ADD COLUMN     "season" "SeasonEnum" NOT NULL,
ADD COLUMN     "siteId" INTEGER NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- DropTable
DROP TABLE "locations";

-- DropTable
DROP TABLE "seasons";

-- DropEnum
DROP TYPE "BatchStatusEnum";

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "coordinates" TEXT,
    "area" DECIMAL(10,2),
    "owner" TEXT,
    "type" TEXT,
    "notes" TEXT,
    "organisationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allotments" (
    "id" SERIAL NOT NULL,
    "plantingId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allotments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurseries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurseries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "nurseries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "plantings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurseries" ADD CONSTRAINT "nurseries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
