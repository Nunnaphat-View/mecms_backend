# รายละเอียดเพิ่มเติมด้านเทคนิคและสถาปัตยกรรม (Technical Addendum)

เอกสารฉบับนี้เก็บข้อมูลการตัดสินใจด้านสถาปัตยกรรมซอฟต์แวร์ เทคโนโลยี และกลไกทางเทคนิคที่ใช้ในระบบสอบเทียบและบำรุงรักษาเครื่องมือแพทย์ระดับโรงพยาบาล

---

## 1. เทคโนโลยีหลักของระบบ (Technology Stack)

### 1.1 Backend Service (`cal_backend`)
* **Framework:** NestJS (v11) พร้อมการรองรับ TypeScript (Strict mode)
* **ORM:** TypeORM (v0.3.x)
* **Database:** PostgreSQL (`pg` driver)
* **Authentication & Security:** Passport.js, JWT (`@nestjs/jwt`), และการเข้ารหัสรหัสผ่านด้วย `bcrypt`
* **Validation:** `class-validator` และ `class-transformer` ในการตรวจสอบ Payload (DTOs)
* **API Documentation:** OpenAPI / Swagger (`@nestjs/swagger`)

### 1.2 Frontend Application (`cal_frontend`)
* **Framework:** Vue 3 (Composition API เท่านั้น โดยใช้ `<script setup lang="ts">`)
* **UI Component Library:** Quasar Framework (v2) - แสดงผลในรูปแบบ Light Mode เท่านั้น และใช้ฟอนต์ Sarabun
* **State Management:** Pinia (v3)
* **Routing:** Vue Router (v5)
* **HTTP Client:** Axios (มีการใช้ Interceptor ในการแนบ JWT Token และการดักจับข้อผิดพลาด 401 เพื่อความปลอดภัย)
* **Localization:** Vue I18n (รองรับภาษาไทย TH และอังกฤษ EN โดยไม่มีการเขียนข้อความดิบในโค้ด UI)

---

## 2. การจัดการฐานข้อมูลและสถาปัตยกรรมความถูกต้องของข้อมูล (Database & Data Integrity)

### 2.1 ความปลอดภัยของข้อมูลธุรกรรม (TypeORM Transaction Safety)
เพื่อรับประกันความถูกต้องและความเป็นเอกภาพของข้อมูล (ACID Properties) ในกรณีที่มีการดำเนินการบันทึกผลงานที่มีผลต่อข้อมูลหลายส่วน (เช่น การบันทึกผลการทำ PM/Calibration ซึ่งต้องอัปเดตสถานะของเครื่องมือแพทย์ บันทึกเช็คลิสต์งาน บันทึกผลสอบเทียบ และสร้างประวัติ Log ย้อนหลังพร้อมกัน) ระบบจะใช้ **TypeORM Transaction** ในการประมวลผล:
```typescript
await this.dataSource.transaction(async (entityManager) => {
  // 1. บันทึกผลสอบเทียบและผล PM
  await entityManager.save(calibrationResultEntity);
  // 2. อัปเดตสถานะของเครื่องมือแพทย์ (Equipment Status)
  await entityManager.save(equipmentEntity);
  // 3. บันทึกประวัติกิจกรรมแบบแก้ไขไม่ได้ (Immutable Activity Log)
  await entityManager.save(activityLogEntity);
});
```

### 2.2 การเพิ่มประสิทธิภาพการสืบค้น (Database Indexing)
ระบบจะทำการเพิ่มดัชนี (Indexes) บนคอลัมน์ที่เป็นเป้าหมายการค้นหาหลักและหนาแน่น เพื่อประสิทธิภาพสูงสุดของระบบในระดับโรงพยาบาล:
* คอลัมน์รหัสเครื่องมือแพทย์ (`equipment_code` / `serial_number`)
* คอลัมน์สถานะการทำงาน (`status`)
* คอลัมน์รหัสใบงานและรหัสอ้างอิงของงานตรวจสอบ (`task_status`, `section_id`)

---

## 3. สิทธิ์การใช้งานและความปลอดภัย (Access Control & Security)

### 3.1 การตรวจสอบสิทธิ์ในฝั่งเซิร์ฟเวอร์ (Backend RBAC)
* การใช้ `@UseGuards(JwtAuthGuard, RolesGuard)` บน Controller endpoints
* การจำกัดบทบาทผู้ใช้งานด้วยการใช้ `@Roles(Role.Technician, Role.Supervisor, Role.Director)` เพื่อควบคุมการอนุมัติและการปรับสถานะเครื่องมือให้ปลอดภัย
* ห้ามไม่ให้มีการส่งรหัสผ่าน (Password Hash) กลับไปใน JSON API responses เป็นอันขาด

### 3.2 การจำกัดการมองเห็นและการควบคุมในฝั่งหน้าบ้าน (Frontend Security)
* การควบคุมด้วย Vue Router Navigation Guards ร่วมกับโทเค็นความปลอดภัย
* การใช้ Composable `useRoleAccess()` เพื่อสลับเปิด-ปิด หรือซ่อนปุ่มการกระทำที่สำคัญตามสิทธิ์จริงของผู้ใช้ (เช่น ซ่อนปุ่ม "อนุมัติ" หรือปุ่ม "จำหน่ายเครื่องมือ" หากเป็นระดับบัญชีช่างธรรมดา)
