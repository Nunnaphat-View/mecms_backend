/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

export class RefactorCertificateData1781316313966 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(
      process.cwd(),
      'src/db/migrations/sql/refactor-certificate-data-1781316313966-up.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(
      process.cwd(),
      'src/db/migrations/sql/refactor-certificate-data-1781316313966-down.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }
}
