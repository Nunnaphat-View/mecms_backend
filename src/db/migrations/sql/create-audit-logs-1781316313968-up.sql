CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" integer,
    "actorName" character varying(255) NOT NULL,
    "actorRole" character varying(100) NOT NULL,
    "action" character varying(100) NOT NULL,
    "resourceName" character varying(100) NOT NULL,
    "resourceId" character varying(100) NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" character varying(45),
    "userAgent" character varying(500),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_audit_logs_resource" ON "audit_logs" ("resourceName", "resourceId");
CREATE INDEX IF NOT EXISTS "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt");
