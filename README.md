
# Whisper AI Subtitle Project 🎬

โปรเจกต์ประมวลผลและสร้างซับไตเติ้ลอัตโนมัติจากไฟล์วิดีโอและ YouTube โดยใช้โมเดล Faster-Whisper ร่วมกับ FastAPI

---

## 🛠 Prerequisites (สิ่งที่ต้องติดตั้งในเครื่องก่อน)

ระบบนี้ต้องการเครื่องมือพื้นฐานในการจัดการวิดีโอและเครือข่าย กรุณาเปิด PowerShell และรันคำสั่งต่อไปนี้ (แนะนำให้ปิดแล้วเปิด Terminal ใหม่หลังติดตั้งเสร็จ):

1. ติดตั้ง FFmpeg(สำหรับจัดการภาพและเสียง)
```winget install ffmpeg```

2. ติดตั้ง ngrok (สำหรับทำ Public URL ให้หน้าเว็บ)
เลือกใช้เครื่องมือติดตั้งอย่างใดอย่างหนึ่ง:

winget install ngrok -s msstore```
# หรือ
```scoop install ngrok```

3. ตั้งค่า Authtoken สำหรับ ngrok (ทำแค่ครั้งแรกครั้งเดียว)

```ngrok config add-authtoken <ใส่_YOUR_AUTHTOKEN_ของคุณที่นี่>```

📦 Installation (การติดตั้งไลบรารี Python)
แนะนำให้สร้างและเปิดใช้งาน Virtual Environment (venv)

เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่งเพื่อติดตั้งแพ็กเกจที่จำเป็นทั้งหมด:

```pip install fastapi uvicorn python-multipart faster-whisper yt-dlp firebase-admin```

🚀 How to Run (วิธีรันระบบ)
ในการเปิดใช้งานระบบให้สมบูรณ์ จะต้องเปิด Terminal ทำงานพร้อมกัน 2 หน้าต่าง ดังนี้:

Terminal 1: เปิดเซิร์ฟเวอร์ AI (Backend)
เข้าสู่ Virtual Environment (ถ้ามี) ตรวจสอบให้อยู่ในโฟลเดอร์ที่มีไฟล์ main.py จากนั้นรันคำสั่ง:

```uvicorn main:app --reload```
(เซิร์ฟเวอร์จะรันอยู่ที่ http://localhost:8000)

Terminal 2: เปิดอุโมงค์เชื่อมต่อ (ngrok)
เปิด Terminal หน้าต่างใหม่ แล้วรันคำสั่งเพื่อเปิดพอร์ต:

```ngrok http 8000```

Note: เมื่อ ngrok ทำงานสำเร็จ ให้นำลิงก์ที่ขึ้นต้นด้วย https://...ngrok-free.app ไปใส่เป็น API URL ในโค้ดหน้าเว็บ (Frontend) ของคุณเพื่อเริ่มทดสอบระบบได้เลย!