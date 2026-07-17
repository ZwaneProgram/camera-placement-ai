-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "warrantyUnit" TEXT,
ADD COLUMN     "warrantyValue" INTEGER;
