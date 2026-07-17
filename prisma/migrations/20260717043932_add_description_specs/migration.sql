-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT,
ADD COLUMN     "specs" JSONB NOT NULL DEFAULT '[]';
