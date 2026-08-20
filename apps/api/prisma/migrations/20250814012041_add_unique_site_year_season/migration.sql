/*
  Warnings:

  - A unique constraint covering the columns `[siteId,year,season]` on the table `seasons` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "seasons_siteId_year_season_key" ON "seasons"("siteId", "year", "season");
