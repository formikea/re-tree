/*
  Warnings:

  - A unique constraint covering the columns `[invitationToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invitationExpires" TIMESTAMP(3),
ADD COLUMN     "invitationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_invitationToken_key" ON "users"("invitationToken");
