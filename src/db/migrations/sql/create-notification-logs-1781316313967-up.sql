DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_logs_channel_enum') THEN
        CREATE TYPE "notification_logs_channel_enum" AS ENUM('line', 'email', 'in_app');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_logs_status_enum') THEN
        CREATE TYPE "notification_logs_status_enum" AS ENUM('pending', 'sent', 'failed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" SERIAL NOT NULL,
    "channel" "notification_logs_channel_enum" NOT NULL DEFAULT 'line',
    "notificationType" character varying(100) NOT NULL,
    "equipmentId" integer,
    "recipientId" integer,
    "status" "notification_logs_status_enum" NOT NULL DEFAULT 'pending',
    "errorMessage" text,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "sentAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "PK_notification_logs_id" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_notification_logs_lookup" ON "notification_logs" ("notificationType", "equipmentId", "recipientId");
