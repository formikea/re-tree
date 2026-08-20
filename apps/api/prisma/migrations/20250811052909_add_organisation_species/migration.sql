-- CreateTable
CREATE TABLE "organisation_species" (
    "id" SERIAL NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisation_species_organisationId_speciesId_key" ON "organisation_species"("organisationId", "speciesId");

-- AddForeignKey
ALTER TABLE "organisation_species" ADD CONSTRAINT "organisation_species_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_species" ADD CONSTRAINT "organisation_species_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
