/*
  Warnings:

  - The values [RESIZE_IMAGE,RESIZE_VIDEO,GENERATE_ALT_TEXT] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('IMAGE_RESIZE', 'IMAGE_TRANSCODE', 'IMAGE_ALTTEXT');
ALTER TABLE "Job" ALTER COLUMN "type" TYPE "JobType_new" USING ("type"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "public"."JobType_old";
COMMIT;
