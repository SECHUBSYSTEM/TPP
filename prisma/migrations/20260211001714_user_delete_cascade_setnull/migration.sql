-- DropForeignKey
ALTER TABLE "LocationManagerAssignment" DROP CONSTRAINT "LocationManagerAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductManagerAssignment" DROP CONSTRAINT "ProductManagerAssignment_userId_fkey";

-- AddForeignKey
ALTER TABLE "LocationManagerAssignment" ADD CONSTRAINT "LocationManagerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductManagerAssignment" ADD CONSTRAINT "ProductManagerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
