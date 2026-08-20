/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `organisations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "organisations_name_key" ON "organisations"("name");
