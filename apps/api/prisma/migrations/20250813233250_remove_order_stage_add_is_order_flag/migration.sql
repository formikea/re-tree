/*
  Warnings:

  - The values [order] on the enum `BatchStageEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BatchStageEnum_new" AS ENUM ('seed', 'prick', 'pot', 'plant');
ALTER TABLE "batches" ALTER COLUMN "stage" TYPE "BatchStageEnum_new" USING ("stage"::text::"BatchStageEnum_new");
ALTER TYPE "BatchStageEnum" RENAME TO "BatchStageEnum_old";
ALTER TYPE "BatchStageEnum_new" RENAME TO "BatchStageEnum";
DROP TYPE "BatchStageEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "isOrder" BOOLEAN NOT NULL DEFAULT false;
