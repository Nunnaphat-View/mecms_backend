import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CalibrationSettingService } from './src/calibration-setting/calibration-setting.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(CalibrationSettingService);
  const result = await service.findByEquipment("PATIENT MONITOR");
  console.log("RESULT_DATA:", JSON.stringify(result, null, 2));
  await app.close();
}
run().catch(console.error);
