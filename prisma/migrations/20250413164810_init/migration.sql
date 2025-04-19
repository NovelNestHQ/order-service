/*
  Warnings:

  - Added the required column `seller_id` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_name` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "seller_id" TEXT NOT NULL,
ADD COLUMN     "seller_name" TEXT NOT NULL;
