# COMMANDS (มือใหม่ก็ทำตามได้)

> ถ้ายังไม่ได้ติดตั้ง dependency:  
> **ครั้งแรกเท่านั้น** รัน: `npm install`

## พัฒนาในเครื่อง (Dev)

- เริ่มเซิร์ฟเวอร์พัฒนา:  
  `npm run dev`  
  เสร็จแล้วเปิดเว็บที่ http://localhost:3000

## สร้างไฟล์สำหรับโปรดักชัน (Build)

- สร้าง build โปรดักชัน:  
  `npm run build`  
  หากมี error เรื่อง **Suspense / useSearchParams** หรือ i18n, ทำตามหัวข้อ “Troubleshooting” ด้านล่าง

## ตรวจโค้ดพื้นฐาน

- Lint (ESLint):  
  `npm run lint`
- เทส (Vitest):  
  `npm run test`

## การแปลภาษา (i18n)

- สแกนโค้ดทั้งหมดเพื่อหาคีย์ข้อความที่ใช้งาน แล้วเติมให้แต่ละไฟล์ข้อความ:  
  `npm run i18n:audit`  
  แสดงผลว่าแต่ละ locale ขาดคีย์ไหม
- เติมข้อความที่ขาดโดยดึงค่าจาก en.json (กัน build พัง):  
  `npm run i18n:fill`

> หมายเหตุ: ทั้งสองคำสั่งไม่แปลภาษาให้อัตโนมัติ แต่จะทำให้ไฟล์ locale ครบคีย์ก่อน (ใช้ข้อความภาษาอังกฤษชั่วคราว)

## รายงานโครงสร้างโปรเจ็กต์ (XRAY)

- สร้างรายงานสรุปไฟล์/เพจ/โครงสร้าง i18n:  
  `npm run xray:single`  
  ไฟล์รายงานจะอยู่ในโฟลเดอร์ `reports/` (เช่น `reports/PROJECT-XRAY.md`)

## ทดสอบฟอร์มติดต่อ (Contact API)

1. ตั้งค่า `.env.local` ให้ครบ (SMTP + Turnstile test keys)
2. รัน `npm run dev` แล้วเปิดหน้า `/en/contact` ส่งฟอร์มทดสอบ
3. เช็คอินบ็อกซ์ปลายทาง (ค่าจาก `CONTACT_RECIPIENT_EMAIL`) หรือดู log ของ Mailtrap

## Troubleshooting (ที่พบบ่อย)

- **useSearchParams ต้องอยู่ใน Client Component และถูกครอบด้วย `<Suspense>`**  
  ถ้า build ขึ้น error ประมาณ “useSearchParams() should be wrapped in a suspense boundary”:  
  ให้เอาคอมโพเนนต์ที่ใช้ `useSearchParams()` ไปแยกเป็นไฟล์/คอมโพเนนต์ `use client` และเวลานำไปใช้ในเพจ ให้ครอบด้วย
  ```tsx
  import { Suspense } from 'react';
  <Suspense fallback={null}>
    <YourClientComponent />
  </Suspense>;
  ```
