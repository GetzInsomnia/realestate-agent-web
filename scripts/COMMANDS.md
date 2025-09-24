# COMMANDS (มือใหม่ก็ทำตามได้)

> ครั้งแรกหลังโคลนโปรเจ็กต์ ให้รัน:  
> **`npm install`**  
> แนะนำให้ใช้ Node.js เวอร์ชัน ≥ 18

---

## สรุปคำสั่งหลัก (Cheat Sheet)

| งาน                                                  | คำสั่ง                     | ผลลัพธ์โดยย่อ                                        |
| ---------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| เริ่มเซิร์ฟเวอร์พัฒนา (Dev)                          | `npm run dev`              | เปิดเว็บได้ที่ `http://localhost:3000` มี Hot Reload |
| สร้าง Production build                               | `npm run build`            | คอมไพล์/ prerender หน้าเว็บไว้ใน `.next/`            |
| รันเซิร์ฟเวอร์ Production จาก build                  | `npm run start`            | รันจากผลลัพธ์ build ที่สร้างไว้                      |
| ตรวจโค้ด (ESLint)                                    | `npm run lint`             | รายงานปัญหาโค้ดสไตล์/กฎ ESLint                       |
| รันเทสทั้งหมด (Vitest)                               | `npm run test`             | รันเทสแบบจบแล้วออก                                   |
| รันเทสแบบดูผลสด                                      | `npm run test:watch`       | เฝ้าดูไฟล์ เปลี่ยนปุ๊บ เทสอัตโนมัติ                  |
| สแกน i18n และสรุปคีย์                                | `npm run i18n:audit`       | บอกว่ามีคีย์ไหนที่ใช้ในโค้ดแต่ขาดในไฟล์ข้อความ       |
| เติมคีย์ i18n ที่ขาด                                 | `npm run i18n:fill`        | เติมคีย์ที่ขาดด้วยค่าจาก `en.json` (กัน build พัง)   |
| รายงานโครงสร้างโปรเจ็กต์ (ย่อ/ไฟล์เดียว)             | `npm run xray:single`      | สร้าง `reports/PROJECT-REPORT.md`                    |
| ดึง “โครงสร้าง + โค้ดทุกไฟล์ข้อความ” (ไฟล์เดียว)     | `npm run repo:dump:single` | สร้าง `reports/REPO-DUMP.md`                         |
| ดึง “โครงสร้าง + โค้ดทุกไฟล์ข้อความ” (แยกไฟล์)       | `npm run repo:dump:split`  | สร้างรายงานหลายไฟล์ใน `reports/`                     |
| ดึงทุกอย่างจริงๆ (รวม dotfiles, .env, ไบนารี base64) | `npm run repo:dump:all`    | สร้าง `reports/REPO-ALL.md` (ไฟล์ใหญ่มาก)            |
| ติดตั้ง Husky (ครั้งเดียว)                           | `npm run prepare`          | เปิดใช้งาน Git hooks จาก Husky                       |

> หมายเหตุ: โฟลเดอร์รายงานคือ `reports/` (ควรใส่ใน `.gitignore` แล้ว)

---

## การพัฒนาในเครื่อง (Dev)

1. รัน: **`npm run dev`**
2. เปิดเว็บ: **`http://localhost:3000`**
3. หยุดเซิร์ฟเวอร์: กด **Ctrl + C** ในเทอร์มินัล

**ผลลัพธ์ที่คาดหวัง**

- เทอร์มินัลแสดง “✓ Ready in Xs”
- แก้โค้ดไฟล์ใน `src/` หน้าเว็บจะรีโหลดอัตโนมัติ (Hot Reload)

---

## สร้างไฟล์สำหรับโปรดักชัน (Build) และรันจริง

1. รัน build: **`npm run build`**
   - ถ้ามี error ให้ดูหัวข้อ **Troubleshooting** ด้านล่าง
2. รันจาก build: **`npm run start`** (เปิดพอร์ตเริ่มต้น 3000)

**ผลลัพธ์ที่คาดหวัง**

- เห็นข้อความ `Compiled successfully` และขึ้นขั้นตอน `Generating static pages` จนครบ
- โฟลเดอร์ `.next/` ถูกสร้าง/อัปเดต

---

## ตรวจโค้ดและรันเทส

- เช็กกฎโค้ด (ESLint): **`npm run lint`**
  - ถ้าเงียบๆ แปลว่าไม่พบปัญหา
- รันเทสทั้งหมด (Vitest): **`npm run test`**
  - ถ้าผ่านจะสรุป `X passed`
- เปิดโหมดดูผลสด: **`npm run test:watch`**

---

## ระบบแปลภาษา (i18n)

ไฟล์ข้อความอยู่ที่ `src/messages/*.json` โดย **`en.json`** เป็นฐานหลัก

- ตรวจหาคีย์ข้อความที่ใช้ในโค้ด (รวมที่ยังไม่มีในไฟล์):  
  **`npm run i18n:audit`**
  - แสดงจำนวนคีย์ที่ระบบใช้งานจริง และสรุปแต่ละ locale ขาดคีย์หรือไม่
- เติมคีย์ที่ “ขาด/ว่าง” โดยใช้ค่าจาก `en.json` ชั่วคราว:  
  **`npm run i18n:fill`**
  - ป้องกัน build พังจากคีย์หาย
  - **ไม่แก้ค่าที่มีอยู่แล้ว** (จะแตะเฉพาะคีย์ที่ไม่มี/ว่าง)

> เคล็ดลับ: ถ้าเพิ่มหน้าหรือคอมโพเนนต์ใหม่ที่เรียก `t('some.key')` ให้รัน `i18n:audit` → `i18n:fill` เพื่อให้ไฟล์ locale ครบก่อน

---

## รายงานโครงสร้างโปรเจ็กต์ (XRAY)

- **ย่อ/ไฟล์เดียว:** `npm run xray:single`  
  สร้าง `reports/PROJECT-REPORT.md` สรุปเพจ, เลย์เอาต์, ไฟล์ข้อความ i18n ฯลฯ

---

## ดึง “โครงสร้าง + โค้ดทุกไฟล์ข้อความ” เป็น Markdown

> ใช้เมื่ออยากส่งให้ทีมตรวจทั้งหมด (หรือแนบใน issue)  
> ค่าเริ่มต้นจะ **ไม่ใส่เนื้อหา** ของไฟล์ `.env*` และไฟล์ไบนารี เพื่อความปลอดภัย

- **ไฟล์เดียว:** `npm run repo:dump:single`
  - ผลลัพธ์: `reports/REPO-DUMP.md`
  - มี 3 ส่วน: Tree (แผนผังไฟล์), Inventory (ตารางไฟล์ทั้งหมด), Files (โค้ดเต็มของไฟล์ข้อความ)
- **แยกไฟล์รายซอร์ส:** `npm run repo:dump:split`
  - ผลลัพธ์: รายงานหลายไฟล์ใน `reports/` และโฟลเดอร์ `reports/files/**.md`
- **รวมทุกอย่างจริงๆ (ระวังความลับ!):** `npm run repo:dump:all`
  - รวม dotfiles + `.env*` + ไบนารี (แปลง base64) → `reports/REPO-ALL.md`

---

## ทดสอบฟอร์มติดต่อ (Contact API)

1. สร้างไฟล์ `.env.local` ในรากโปรเจ็กต์ และตั้งค่าคีย์ SMTP / Turnstile (ตัวอย่าง)

   ```ini
   # อีเมลผู้รับปลายทาง (ดูผล)
   CONTACT_RECIPIENT_EMAIL=your@email.com

   # ค่าจากผู้ให้บริการ SMTP (เช่น Mailtrap, Gmail SMTP ฯลฯ)
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=xxxxxxxxxxxxxx
   SMTP_PASS=xxxxxxxxxxxxxx

   # Cloudflare Turnstile (โหมดทดสอบ)
   TURNSTILE_SITE_KEY=1x00000000000000000000AA
   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
   ```
