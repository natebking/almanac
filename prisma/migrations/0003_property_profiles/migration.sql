-- CreateTable
CREATE TABLE "PropertyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyIndexId" TEXT NOT NULL,
    "applianceInfo" TEXT NOT NULL,
    "filterSize" TEXT NOT NULL,
    "homeWarranty" TEXT NOT NULL,
    "hoaInfo" TEXT NOT NULL,
    "utilityProviders" TEXT NOT NULL,
    "accessCodes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyProfile_propertyIndexId_fkey" FOREIGN KEY ("propertyIndexId") REFERENCES "PropertyIndex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PropertyProfile_userId_idx" ON "PropertyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyProfile_propertyIndexId_key" ON "PropertyProfile"("propertyIndexId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyProfile_userId_propertyIndexId_key" ON "PropertyProfile"("userId", "propertyIndexId");
