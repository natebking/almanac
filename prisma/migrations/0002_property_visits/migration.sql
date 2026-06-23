-- CreateTable
CREATE TABLE "PropertyVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyIndexId" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyVisit_propertyIndexId_fkey" FOREIGN KEY ("propertyIndexId") REFERENCES "PropertyIndex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PropertyVisit_userId_openedAt_idx" ON "PropertyVisit"("userId", "openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyVisit_userId_propertyIndexId_key" ON "PropertyVisit"("userId", "propertyIndexId");
