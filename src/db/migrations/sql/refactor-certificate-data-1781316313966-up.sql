-- 1. Create task_certificates table if it doesn't exist
CREATE TABLE IF NOT EXISTS "task_certificates" (
    "id" SERIAL NOT NULL,
    "task_id" integer NOT NULL,
    "hospital_name" character varying(255),
    "hospital_logo_url" character varying(500),
    "hospital_address" text,
    "hospital_district" character varying(100),
    "hospital_province" character varying(100),
    "hospital_zip_code" character varying(20),
    "department_name" character varying(255),
    "technician_name" character varying(255),
    "technician_signature_url" character varying(500),
    "approver_name" character varying(255),
    "approver_signature_url" character varying(500),
    "pm_checklist" jsonb,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "UQ_task_certificates_task_id" UNIQUE ("task_id"),
    CONSTRAINT "PK_task_certificates_id" PRIMARY KEY ("id")
);

-- 2. Add Foreign Key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_task_certificates_task_id'
    ) THEN
        ALTER TABLE "task_certificates"
        ADD CONSTRAINT "FK_task_certificates_task_id"
        FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Data Migration: Extract data from tasks.certificate_data into task_certificates
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'certificate_data'
    ) THEN
        INSERT INTO "task_certificates" (
            "task_id",
            "hospital_name",
            "hospital_logo_url",
            "hospital_address",
            "hospital_district",
            "hospital_province",
            "hospital_zip_code",
            "department_name",
            "technician_name",
            "technician_signature_url",
            "approver_name",
            "approver_signature_url",
            "pm_checklist"
        )
        SELECT 
            id AS task_id,
            (certificate_data->'hospital'->>'name')::varchar(255) AS hospital_name,
            (certificate_data->'hospital'->>'logoUrl')::varchar(500) AS hospital_logo_url,
            (certificate_data->'hospital'->>'address')::text AS hospital_address,
            (certificate_data->'hospital'->>'district')::varchar(100) AS hospital_district,
            (certificate_data->'hospital'->>'province')::varchar(100) AS hospital_province,
            (certificate_data->'hospital'->>'zipCode')::varchar(20) AS hospital_zip_code,
            (certificate_data->'department'->>'name')::varchar(255) AS department_name,
            (certificate_data->'technician'->>'name')::varchar(255) AS technician_name,
            (certificate_data->'technician'->>'signatureUrl')::varchar(500) AS technician_signature_url,
            (certificate_data->'approver'->>'name')::varchar(255) AS approver_name,
            (certificate_data->'approver'->>'signatureUrl')::varchar(500) AS approver_signature_url,
            (certificate_data->'pmChecklist')::jsonb AS pm_checklist
        FROM "tasks"
        WHERE "certificate_data" IS NOT NULL
        ON CONFLICT (task_id) DO NOTHING;

        -- 4. Drop legacy certificate_data column
        ALTER TABLE "tasks" DROP COLUMN "certificate_data";
    END IF;
END $$;
