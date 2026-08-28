-- V7 L17: immutable admin review/content operations audit trail
CREATE TABLE "AdminContentAuditEvent" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorUserId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminContentAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminContentAuditEvent_entityType_entityId_createdAt_idx"
ON "AdminContentAuditEvent"("entityType","entityId","createdAt");
CREATE INDEX "AdminContentAuditEvent_actorUserId_createdAt_idx"
ON "AdminContentAuditEvent"("actorUserId","createdAt");
CREATE INDEX "AdminContentAuditEvent_action_createdAt_idx"
ON "AdminContentAuditEvent"("action","createdAt");

ALTER TABLE "AdminContentAuditEvent"
ADD CONSTRAINT "AdminContentAuditEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
