import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

export class CreateNotificationLogs1781316313967 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(
      process.cwd(),
      'src/db/migrations/sql/create-notification-logs-1781316313967-up.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(
      process.cwd(),
      'src/db/migrations/sql/create-notification-logs-1781316313967-down.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }
}
