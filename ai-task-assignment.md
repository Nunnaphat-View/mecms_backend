# แผนการพัฒนา: ระบบจัดการความเชี่ยวชาญของช่างและหน้าจัดการงานสอบเทียบประจำเดือน

## ภาพรวม (Overview)
เรากำลังสร้างระบบจัดการความเชี่ยวชาญของช่างสอบเทียบ (Specialties) เพื่อให้หัวหน้าแผนกสามารถบันทึกได้ว่าช่างคนใดเชี่ยวชาญเครื่องมือยี่ห้อ/ชื่ออะไร และพัฒนาระบบแดชบอร์ด **จัดการงานสอบเทียบ** ในหน้าปฏิทินที่มีระบบจัดแบ่งงานอัตโนมัติด้วย AI (Auto-Assign), ระบบยืนยันแจกงาน (Publish), ตัวกรองเดือน/ปี และปฏิทินแสดงงานแยกสีตามตัวช่างเทคนิคที่รับผิดชอบ

## ประเภทโครงการ (Project Type)
WEB/BACKEND (NestJS + React)

## เกณฑ์ความสำเร็จ (Success Criteria)
- หัวหน้าแผนกสามารถบันทึกความเชี่ยวชาญของช่างได้ผ่าน Checkbox หน้า User List
- หน้าปฏิทิน `/schedule` จะแสดงผลต่างกันตาม Role: ช่างจะเห็นงานส่วนตัว หัวหน้าจะเห็นหน้าจัดการงานทั้งหมดแยกสีตามช่าง
- **โฟลว์ปฏิทินเปล่า:** ตอนเริ่มแรกเปิดหน้าจอ เลือกเดือน/ปีที่ยังไม่มีการจัดตารางสอบเทียบ จะขึ้นปฏิทินว่างๆ (ตารางเปล่า) จนกว่าหัวหน้าแผนกจะกดปุ่ม `Auto-Assign`
- หัวหน้าสามารถกด `Auto-Assign` เพื่อแจกงานด้วย AI ซึ่งงานสอบเทียบชิปสีต่างๆ จะแสดงขึ้นบนปฏิทินทันที จากนั้นสามารถกดเปลี่ยนช่างเทคนิคได้ตามเครื่องมือ (Override) และกดยืนยันแจกงานจริง (`Publish`)

## โครงสร้างเทคโนโลยี (Tech Stack)
- Backend: NestJS, TypeORM, PostgreSQL
- Frontend: React 19, Tailwind CSS v4, Shadcn UI

## โครงสร้างไฟล์ที่จะแก้ไข/สร้างใหม่ (File Structure)
- `cal_backend/src/user/user-specialty.entity.ts` [NEW] (ตารางกลางเก็บทักษะช่าง)
- `cal_backend/src/user/user.entity.ts` [MODIFY] (เพิ่มความสัมพันธ์ OneToMany)
- `cal_backend/src/user/user.service.ts` [MODIFY] (เพิ่มฟังก์ชันทักษะช่างและการดึงข้อมูล)
- `cal_backend/src/user/user.controller.ts` [MODIFY] (API ทักษะช่าง)
- `cal_backend/src/task/task.service.ts` [MODIFY] (ตรรกะ AI จัดสรรงาน, การจัดกลุ่มแผนก และการเปลี่ยนช่าง)
- `cal_backend/src/task/task.controller.ts` [MODIFY] (API Auto-Assign, Publish, Override)
- `mecms_frontend/src/services/userService.ts` [MODIFY] (เพิ่ม API ทักษะช่าง)
- `mecms_frontend/src/services/pmService.ts` [MODIFY] (เพิ่ม API จัดการงาน Auto-Assign / Publish)
- `mecms_frontend/src/components/users/SpecialtyDialog.tsx` [NEW] (Dialog ตั้งค่าทักษะช่าง)
- `mecms_frontend/src/pages/UsersPage.tsx` [MODIFY] (เพิ่มปุ่มตั้งค่าทักษะช่าง)
- `mecms_frontend/src/components/schedule/ManageScheduleView.tsx` [NEW] (หน้าจอจัดการปฏิทินของหัวหน้าแผนก)
- `mecms_frontend/src/pages/SchedulePage.tsx` [MODIFY] (แยกหน้าจอผู้ใช้งานตามบทบาทช่าง/หัวหน้า)

## ขั้นตอนการแบ่งงาน (Task Breakdown)

### งานที่ 1: ตั้งค่าโครงสร้างฐานข้อมูลและโมเดล TypeORM (เสร็จสิ้นแล้ว)
- ทำการสร้างตาราง `UserSpecialty` และผูกความสัมพันธ์ One-to-Many / Many-to-One เรียบร้อยแล้ว

### งานที่ 2: พัฒนา API สำหรับจัดการทักษะช่าง (เสร็จสิ้นแล้ว)
- สร้างและตรวจทาน Endpoint `GET /users/:id/specialties` และ `PUT /users/:id/specialties` เรียบร้อยแล้ว

### งานที่ 3: สร้างหน้าจอตั้งค่าทักษะช่างในตาราง User (เสร็จสิ้นแล้ว)
- สร้าง `SpecialtyDialog.tsx` และปุ่มเรียกตั้งค่าใน `UsersPage.tsx` เรียบร้อยแล้ว

### งานที่ 4: พัฒนาตรรกะ AI Auto-Assign และ API จ่ายงานใน Backend
- **ผู้รับผิดชอบ (Agent)**: `backend-specialist`
- **เป้าหมาย**: เพิ่ม API `POST /pm-task/auto-assign`, `POST /pm-task/publish` และ `PATCH /pm-task/:id/assign` พร้อมตรรกะการจัดกลุ่มตามแผนกในเดือนนั้น
- **ข้อมูลนำเข้า (INPUT)**: `task.service.ts` และ `task.controller.ts`
- **ผลลัพธ์ (OUTPUT)**: API มอบหมายงานกลุ่ม
- **การทวนสอบ (VERIFY)**: ทดสอบเรียกใช้ API และเช็คการบันทึกช่างเทคนิคลงในตารางงาน

### งานที่ 5: พัฒนา UI หน้าจอจัดการงานสอบเทียบประจำเดือน (ManageScheduleView)
- **ผู้รับผิดชอบ (Agent)**: `frontend-specialist`
- **เป้าหมาย**: สร้างคอมโพเนนต์ `ManageScheduleView.tsx` แผนภาพปฏิทินงานรายเดือนแยกสีตามตัวช่างพร้อมชุดตัวกรอง (ไม่รวมการเลือกสถานะงานและสรุปรายงาน)
- **โฟลว์ปฏิทินเปล่า**: ปฏิทินแสดงเป็นตารางเปล่าๆ ก่อนในตอนแรก และเมื่อรันระบบ Auto-Assign หรือมีงานจัดสรรแล้ว งานชิปสีจึงจะแสดงขึ้นมา
- **ข้อมูลนำเข้า (INPUT)**: `SchedulePage.tsx`
- **ผลลัพธ์ (OUTPUT)**: หน้าจัดการตารางงานสอบเทียบสมบูรณ์แบบ
- **การทวนสอบ (VERIFY)**: ตรวจสอบการจัดเรียงวันบนปฏิทิน การแยกกลุ่มชิปสีตามชื่อช่าง และการใช้สีตามธีมระบบ

### งานที่ 6: เชื่อมต่อและกรองหน้าจอตามสิทธิ์ผู้ใช้งาน (RBAC)
- **ผู้รับผิดชอบ (Agent)**: `frontend-specialist`
- **เป้าหมาย**: แก้ไข `SchedulePage.tsx` ให้แยกแสดงผลระหว่างช่างเทคนิคและหัวหน้าแผนก
- **ข้อมูลนำเข้า (INPUT)**: `SchedulePage.tsx`
- **การทวนสอบ (VERIFY)**: ล็อกอินบัญชีทดสอบประเภทช่างเทคนิคและแอดมิน เพื่อตรวจสอบความถูกต้องของการนำทางและการควบคุมสิทธิ์

## ขั้นตอนที่ X: ตรวจสอบความถูกต้องรอบสุดท้าย (Phase X)
- [ ] ห้ามใช้รหัสสีม่วง (purple/violet) ใน UI ตามมาตรฐาน Clean Industrial UI ของเรา
- [ ] รัน `npm run build` ทั้งในโปรเจกต์ Backend และ Frontend สำเร็จไม่มีข้อผิดพลาด
- [ ] รันการตรวจสอบ Lint และ Type ทั้งหมดผ่าน
