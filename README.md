
# Whisper AI Subtitle Project 🎬

โปรเจกต์ใส่ซับไตเติ้ลอัตโนมัติจากไฟล์วิดีโอและ ลิงค์YouTube โดยใช้โมเดล Whisper

## 🛠 Prerequisites (สิ่งที่ต้องติดตั้งในเครื่องก่อน)

ระบบนี้ต้องการเครื่องมือพื้นฐานในการจัดการวิดีโอและเครือข่าย กรุณาเปิด PowerShell และรันคำสั่งต่อไปนี้ (แนะนำให้ปิดแล้วเปิด Terminal ใหม่หลังติดตั้งเสร็จ):

**1. ติดตั้ง FFmpeg(สำหรับจัดการภาพและเสียง)**
``` powershell
winget install ffmpeg
```
**2. ติดตั้ง ngrok (สำหรับทำ Public URL ให้หน้าเว็บ)**

เลือกใช้เครื่องมือติดตั้งอย่างใดอย่างหนึ่ง:
``` powershell
winget install ngrok -s msstore
```
หรือ
``` powershell
scoop install ngrok
```
**3. ตั้งค่า Authtoken สำหรับ ngrok (ทำแค่ครั้งแรกครั้งเดียว)**

สมัครใช้งานใน https://ngrok.com/
``` powershell
ngrok config add-authtoken <ใส่_YOUR_AUTHTOKEN_ของคุณที่นี่>
```

## 📦 Installation (การตั้งค่าและติดตั้งไลบรารี Python)
**1. สร้างและเปิดใช้งาน Virtual Environment (venv)** 
เปิด Terminal ขึ้นมา โดยให้แน่ใจว่าอยู่ในโฟลเดอร์ของโปรเจกต์ แล้วรันคำสั่งเพื่อสร้างพื้นที่จำลอง:
``` bash
python -m venv venv
```
จากนั้นเปิดใช้งาน venv (สำหรับ Windows):
``` bash
venv\Scripts\activate
```

## 🚀 How to Run (วิธีรันระบบ)
ในการเปิดใช้งานระบบให้สมบูรณ์ จะต้องเปิด Terminal ทำงานพร้อมกัน 2 หน้าต่าง ดังนี้:

**Terminal 1: เปิดเซิร์ฟเวอร์ AI (Backend)**
เข้าสู่ Virtual Environment (ถ้ามี) ตรวจสอบให้อยู่ในโฟลเดอร์ที่มีไฟล์ main.py จากนั้นรันคำสั่ง:
``` bash
uvicorn main:app --reload
```
(เซิร์ฟเวอร์จะรันอยู่ที่ http://localhost:8000)

**Terminal 2: เปิดอุโมงค์เชื่อมต่อ (ngrok)**
เปิด Terminal หน้าต่างใหม่ แล้วรันคำสั่งเพื่อเปิดพอร์ต:
``` bash
ngrok http 8000
```
Note: เมื่อ ngrok ทำงานสำเร็จ ให้นำลิงก์ที่ขึ้นต้นด้วย https://...ngrok-free.app ไปใส่เป็น API URL ในโค้ดหน้าเว็บ (Frontend) ของคุณเพื่อเริ่มทดสอบระบบได้เลย!