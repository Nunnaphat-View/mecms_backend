-- 1. Re-create tasks.certificate_data column if it was dropped
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'certificate_data'
    ) THEN
        ALTER TABLE "tasks" ADD COLUMN "certificate_data" jsonb;
    END IF;
END $$;

-- 2. Data Migration: Reverse mapping from task_certificates back to tasks.certificate_data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'task_certificates'
    ) THEN
        UPDATE "tasks" t
        SET "certificate_data" = json_build_object(
            'hospital', CASE WHEN tc.hospital_name IS NOT NULL THEN json_build_object(
                'name', tc.hospital_name,
                'logoUrl', tc.hospital_logo_url,
                'address', tc.hospital_address,
                'district', tc.hospital_district,
                'province', tc.hospital_province,
                'zipCode', tc.hospital_zip_code
            ) ELSE null END,
            'department', json_build_object(
                'name', tc.department_name
            ),
            'technician', CASE WHEN tc.technician_name IS NOT NULL THEN json_build_object(
                'name', tc.technician_name,
                'signatureUrl', tc.technician_signature_url
            ) ELSE null END,
            'approver', CASE WHEN tc.approver_name IS NOT NULL THEN json_build_object(
                'name', tc.approver_name,
                'signatureUrl', tc.approver_signature_url
            ) ELSE null END,
            'pmChecklist', tc.pm_checklist
        )::jsonb
        FROM "task_certificates" tc
        WHERE t.id = tc.task_id;

        -- 3. Drop task_certificates table
        DROP TABLE "task_certificates" CASCADE;
    END IF;
END $$;
