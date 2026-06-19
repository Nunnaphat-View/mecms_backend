import { NestFactory } from '@nestjs/core';
import { AppModule } from './dist/src/app.module.js';
import { DataSource } from 'typeorm';
import { NotificationService } from './dist/src/notification/notification.service.js';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const notificationService = app.get(NotificationService);

  console.log("--- Cleaning existing test data ---");
  await dataSource.query(`DELETE FROM "tasks" WHERE "cal_no" LIKE 'CAL-TEST-LINE-%'`);
  await dataSource.query(`
    DELETE FROM "notification_logs" 
    WHERE "equipmentId" IN (SELECT id FROM "equipment" WHERE "asset_code" LIKE 'IP-LINE-TEST-%')
  `);
  await dataSource.query(`DELETE FROM "equipment" WHERE "asset_code" LIKE 'IP-LINE-TEST-%'`);
  console.log("Cleanup finished.");

  console.log("--- Inserting 10 Infusion Pumps and tasks for User 5 ---");
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const dateStr = targetDate.toISOString().split('T')[0];
  console.log(`Target calibration due date: ${dateStr}`);

  const equipments = [];
  for (let i = 1; i <= 10; i++) {
    const indexStr = String(i).padStart(3, '0');
    const assetCode = `IP-LINE-TEST-${indexStr}`;
    const serialNumber = `SN-LINE-TEST-${indexStr}`;
    
    // Insert equipment
    const [eq] = await dataSource.query(`
      INSERT INTO "equipment" (
        "name", "asset_code", "serial_number", "manufacturer", "model", 
        "status", "risk_level", "equipment_type_id", "sectionId", "calibration_due_date", 
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING id, name
    `, [
      'Infusion Pump', assetCode, serialNumber, 'B. Braun', 'Infusomat Space',
      'ready', 'high', 1, 1, dateStr
    ]);
    
    equipments.push(eq);
    
    // Insert task
    const calNo = `CAL-TEST-LINE-${eq.id}`;
    await dataSource.query(`
      INSERT INTO "tasks" (
        "equipment_id", "cal_no", "status", "technician_id", "createdAt"
      ) VALUES (
        $1, $2, $3, $4, NOW()
      )
    `, [
      eq.id, calNo, 'Pending', 5
    ]);
  }
  console.log(`Inserted ${equipments.length} equipments and corresponding tasks.`);

  console.log("--- Triggering LINE Notifications ---");
  await notificationService.handleCalibrationDueNotifications();
  console.log("Notifications processing finished.");

  await app.close();
}

run().catch(console.error);
