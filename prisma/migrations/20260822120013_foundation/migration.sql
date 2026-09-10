-- CreateTable
CREATE TABLE "DatabaseHeartbeat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseHeartbeat_pkey" PRIMARY KEY ("id")
);
