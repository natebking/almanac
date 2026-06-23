-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "googleEmail" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiry" DATETIME,
    "scopes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "driveFolderId" TEXT,
    "driveFolderUrl" TEXT,
    "utilityNotes" TEXT NOT NULL,
    "accessCodes" TEXT NOT NULL,
    "applianceNotes" TEXT NOT NULL,
    "filterSize" TEXT NOT NULL,
    "warrantyNotes" TEXT NOT NULL,
    "hoaNotes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourceConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "googleFileId" TEXT,
    "googleFileUrl" TEXT,
    "status" TEXT NOT NULL,
    "lastSyncedAt" DATETIME,
    "metadataJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SourceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceConnectionId" TEXT,
    "sourceSpreadsheetId" TEXT NOT NULL,
    "sourceSheetName" TEXT NOT NULL,
    "sourceRowNumber" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "normalizedAddress" TEXT NOT NULL,
    "currentTenants" TEXT NOT NULL,
    "rentAmount" TEXT NOT NULL,
    "leaseStart" TEXT NOT NULL,
    "leaseEnd" TEXT NOT NULL,
    "tenantPhone" TEXT NOT NULL,
    "tenantEmail" TEXT NOT NULL,
    "tenantBirthdays" TEXT NOT NULL,
    "pets" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "brokerSplit" TEXT NOT NULL,
    "tenantNotes" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "driveFolderId" TEXT,
    "driveFolderUrl" TEXT,
    "rawJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyIndex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyIndex_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "SourceConnection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DriveFileIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceConnectionId" TEXT,
    "propertyIndexId" TEXT,
    "googleFileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "webViewLink" TEXT NOT NULL,
    "modifiedTime" DATETIME,
    "textExtract" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DriveFileIndex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DriveFileIndex_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "SourceConnection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DriveFileIndex_propertyIndexId_fkey" FOREIGN KEY ("propertyIndexId") REFERENCES "PropertyIndex" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "licenseStatus" TEXT NOT NULL,
    "insuranceStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorPropertyLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "propertyId" TEXT,
    "propertyIndexId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorPropertyLink_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VendorPropertyLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VendorPropertyLink_propertyIndexId_fkey" FOREIGN KEY ("propertyIndexId") REFERENCES "PropertyIndex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "googleDocId" TEXT,
    "googleDocUrl" TEXT,
    "localBody" TEXT NOT NULL,
    "placeholders" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "propertyIndexId" TEXT,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "renderedBody" TEXT NOT NULL,
    "fieldValuesJson" TEXT NOT NULL,
    "googleDocId" TEXT,
    "googleDocUrl" TEXT,
    "pdfUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocument_propertyIndexId_fkey" FOREIGN KEY ("propertyIndexId") REFERENCES "PropertyIndex" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citationsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PropertyIndex_userId_normalizedAddress_idx" ON "PropertyIndex"("userId", "normalizedAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyIndex_userId_sourceSpreadsheetId_sourceSheetName_sourceRowNumber_key" ON "PropertyIndex"("userId", "sourceSpreadsheetId", "sourceSheetName", "sourceRowNumber");

-- CreateIndex
CREATE INDEX "DriveFileIndex_userId_category_idx" ON "DriveFileIndex"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFileIndex_userId_googleFileId_key" ON "DriveFileIndex"("userId", "googleFileId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPropertyLink_vendorId_propertyId_key" ON "VendorPropertyLink"("vendorId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPropertyLink_vendorId_propertyIndexId_key" ON "VendorPropertyLink"("vendorId", "propertyIndexId");
