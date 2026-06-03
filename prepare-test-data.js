const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'calibration',
  });

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const dateStr = targetDate.toISOString().split('T')[0];

  console.log('--- Preparing Test Data for 7-Day Notification ---');
  console.log(`Target Date (7 days from now): ${dateStr}`);

  // 1. Find or create a test equipment
  const [equipments] = await connection.execute('SELECT id, name FROM equipment LIMIT 1');
  
  if (equipments.length === 0) {
    console.log('No equipment found. Please add at least one equipment first.');
    process.exit(1);
  }

  const eqId = equipments[0].id;
  const eqName = equipments[0].name;

  // 2. Update equipment to High Risk and set Due Date
  await connection.execute(
    'UPDATE equipment SET risk_level = ?, calibration_due_date = ? WHERE id = ?',
    ['high', dateStr, eqId]
  );
  console.log(`Updated Equipment [ID: ${eqId}, Name: ${eqName}] to HIGH RISK and Due Date: ${dateStr}`);

  // 3. Ensure there is a task for this equipment to identify a technician
  const [tasks] = await connection.execute(
    'SELECT id, technician_id FROM tasks WHERE equipment_id = ? ORDER BY id DESC LIMIT 1',
    [eqId]
  );

  if (tasks.length > 0) {
    console.log(`✅ Found existing task. Notification will be sent to Technician ID: ${tasks[0].technician_id}`);
  } else {
    // Optional: Create a dummy task if none exists, or just explain it will broadcast
    console.log('ℹ️ No previous task found for this equipment. Notification will be BROADCASTED to the main channel.');
  }

  console.log('\nDone! Now you can test by calling:');
  console.log('curl -X POST http://localhost:3000/notification/test-due-7-days');

  await connection.end();
}

run().catch(console.error);
