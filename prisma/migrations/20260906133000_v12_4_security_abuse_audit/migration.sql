CREATE TABLE "AuthenticationAuditEvent" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthenticationAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthenticationAuditEvent_action_createdAt_idx" ON "AuthenticationAuditEvent"("action", "createdAt");
CREATE INDEX "AuthenticationAuditEvent_actorUserId_createdAt_idx" ON "AuthenticationAuditEvent"("actorUserId", "createdAt");
CREATE INDEX "AuthenticationAuditEvent_targetUserId_createdAt_idx" ON "AuthenticationAuditEvent"("targetUserId", "createdAt");

ALTER TABLE "AuthenticationAuditEvent" ADD CONSTRAINT "AuthenticationAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthenticationAuditEvent" ADD CONSTRAINT "AuthenticationAuditEvent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
