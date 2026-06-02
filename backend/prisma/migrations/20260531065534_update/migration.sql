/*
  Warnings:

  - Made the column `full_name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "experience_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reset_password_token" TEXT,
ADD COLUMN     "user_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "verification_token" TEXT,
ALTER COLUMN "full_name" SET NOT NULL;
