# ZaiZub Backend

API ของ [ZaiZub](https://zaizub.vercel.app/) เขียนด้วย FastAPI ทำหน้าที่

- ดาวน์โหลดคลิปจากลิงก์ (yt-dlp) หรือรับไฟล์อัปโหลด
- ถอดเสียงเป็นซับ ภาษาไทยและอังกฤษ (ตรวจภาษาให้อัตโนมัติ) ด้วย faster-whisper
- ทำวิดีโอพรีวิวและภาพปกด้วย FFmpeg
- เรนเดอร์ซับลงบนวิดีโอ (FFmpeg + libass)

README นี้สำหรับคนที่อยากรัน backend บนเครื่องตัวเอง ภาพรวมของระบบอยู่ที่ [README หลัก](../README.md)

---

## สิ่งที่ต้องมี

| รายการ | รายละเอียด |
|---|---|
| Python | 3.11 ขึ้นไป (ทดสอบกับ 3.13) |
| FFmpeg | ต้องมีฟิลเตอร์ **libass** ตรวจด้วย `ffmpeg -filters \| grep " ass "` (Windows ใช้ `winget install Gyan.FFmpeg`, macOS ใช้ `brew install ffmpeg`, Linux ใช้ `apt install ffmpeg` / `dnf install ffmpeg`) |
| GPU (ไม่บังคับ แต่แนะนำ) | NVIDIA ที่มีไดรเวอร์รองรับ CUDA 12 ทดสอบกับ GTX 1060 6 GB และ RTX 5050 |
| พื้นที่ดิสก์ | ประมาณ 6 GB สำหรับโมเดล (ดาวน์โหลดอัตโนมัติครั้งแรก) |
| RAM | แนะนำ 6 GB ขึ้นไป (โมเดลทั้งสองตัวถูกโหลดค้างไว้ ตัวแอปใช้ราว 2–3 GB) |

> ⚠️ ทดสอบบน **Linux** เท่านั้น Windows และ macOS ยังไม่ได้ทดสอบ โดยเฉพาะการใช้ GPU บน Windows ที่อาจต้องติดตั้ง CUDA Toolkit 12 เอง
>
> ⚠️ **ถ้าไม่มี GPU** ระบบจะใช้โมเดล `small` ทุกภาษา ซึ่งเร็วพอใช้ แต่ **ภาษาไทยแม่นยำน้อยกว่าบน GPU มาก**

---

## ติดตั้ง

```bash
cd backend

# สร้างและเปิดใช้ virtual environment
python -m venv venv
source venv/bin/activate            # Linux / macOS
# venv\Scripts\Activate.ps1         # Windows (PowerShell)

pip install -r requirements.txt
```

**เครื่องที่ไม่มี GPU NVIDIA** (เช่น macOS) ให้ลบสองบรรทัด `nvidia-cublas-cu12` และ `nvidia-cudnn-cu12` ออกจาก `requirements.txt` ก่อนติดตั้ง เพราะแพ็กเกจนี้มีเฉพาะ Linux/Windows

---

## ตั้งค่า (`backend/.env`)

ทุกอย่างเป็น **ตัวเลือก** ถ้าไม่สร้างไฟล์นี้ระบบก็รันได้ด้วยค่าเริ่มต้น สร้างไฟล์ `backend/.env` เมื่อต้องการปรับ:

```env
# --- โมเดลถอดเสียง ---
# โมเดลภาษาไทย: repo id จาก Hugging Face หรือ path ในเครื่อง (ดู "โมเดล" ด้านล่าง)
WHISPER_MODEL=Vinxscribe/biodatlab-whisper-th-large-v3-faster
# โมเดลสำหรับภาษาอื่นและใช้ตรวจภาษา
WHISPER_MODEL_GENERAL=mobiuslabsgmbh/faster-whisper-large-v3-turbo
# ข้อความนำทาง (ช่วยเรื่องการสะกดและคำทับศัพท์) มีค่าเริ่มต้นอยู่แล้ว ไม่ต้องตั้งก็ได้
# ถ้าอยากเพิ่มชื่อ/ศัพท์เฉพาะของช่อง ให้เอา # ออกแล้วแก้ข้อความ ส่วนการใส่ค่าว่าง ("") คือปิดฟีเจอร์นี้
# WHISPER_PROMPT=สวัสดีครับ วันนี้เรามาคุยกันเรื่องอนิเมะและเกม ด้วยภาษาไทยที่ถูกต้อง
# WHISPER_PROMPT_EN=Hello, and welcome. Today we're going to talk about anime and games.

# --- Supabase (ไม่บังคับ) ---
# ถ้าไม่ตั้ง วิดีโอพรีวิวจะถูกเสิร์ฟจากเครื่องที่ /temp_storage แทนการอัปโหลดขึ้นคลาวด์
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# --- อื่น ๆ ---
# คุกกี้ YouTube (ไฟล์ cookies.txt) ใช้เป็นทางสำรองเมื่อโดนบล็อก ค่าเริ่มต้นคือ ~/cookies.txt
YTDLP_COOKIES=~/cookies.txt
# ใช้ Groq (คลาวด์) แทนโมเดลในเครื่อง: MODEL=groq แล้วใส่ GROQ_API_KEY
MODEL=whisperx
GROQ_API_KEY=
```

หมายเหตุ: ค่า `MODEL=whisperx` เป็นชื่อเดิมที่ยังเก็บไว้ ตอนนี้เอนจินนี้คือ faster-whisper ไม่ใช่ WhisperX แล้ว

---

## รัน

ต้องรันจากโฟลเดอร์ `backend/` เพราะระบบหาไฟล์ `.env` จากตรงนี้:

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- เอกสารและหน้าลองยิง API (Swagger): http://localhost:8000/docs

**ครั้งแรกจะช้า** เพราะต้องดาวน์โหลดโมเดลจาก Hugging Face (ภาษาไทย ~3 GB, ทั่วไป ~1.6 GB) หลังจากนั้นจะถูกแคชไว้ และโหลดครั้งเดียวต่อการรัน

เช็กเบื้องต้นว่าโค้ดถอดเสียงทำงาน (ไม่ต้องใช้ GPU หรือโมเดล):

```bash
python -m app.services.ai_services      # ควรพิมพ์ ok
```

---

## ลองเรียก API

พาธทั้งหมดขึ้นต้นด้วย `/api/v1`

**ถอดเสียงจากไฟล์วิดีโอ** (ตรวจภาษาให้เอง)

```bash
curl -F "file=@clip.mp4" http://localhost:8000/api/v1/extract-audio
# กำหนดภาษาเองได้: -F "language=th"  หรือ  -F "language=en"
```

**ถอดเสียงจากลิงก์**

```bash
curl -X POST http://localhost:8000/api/v1/process-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=...", "language": "auto"}'
```

ผลลัพธ์ (ย่อ):

```json
{
  "success": true,
  "video_url": "/temp_storage/prev_....mp4",
  "thumbnail_url": "/temp_storage/thumb_....jpg",
  "video_filename": "in_....mp4",
  "subtitles": [
    { "id": 1, "start": 0.0, "end": 2.7, "text": "สวัสดีครับ",
      "words": [{ "word": "สวัสดี", "start": 0.0, "end": 0.9 }, { "word": "ครับ", "start": 0.9, "end": 1.4 }] }
  ]
}
```

| Endpoint | หน้าที่ |
|---|---|
| `POST /extract-audio` | อัปโหลดไฟล์ (`file`) พร้อม `language` และ `engine` ถ้าต้องการ |
| `POST /process-link` | ส่ง JSON `{url, language?, engine?}` ระบบดาวน์โหลดแล้วถอดเสียง |
| `POST /render-video` | ส่ง JSON (`video_filename`, `video_url`, `subtitles`, `styles`, `aspect_ratio`, ...) ได้ไฟล์ MP4 ที่ฝังซับ |
| `POST /delete-media` | ลบไฟล์ใน storage (`urls` / `paths`) |

`language` ใช้ได้กับ `th`, `en` หรือรหัสภาษาอื่น ถ้าไม่ใส่หรือใส่ `auto` ระบบตรวจเอง **คลิปสั้นมาก (2–5 วินาที) ตรวจภาษาอาจพลาด ให้ระบุ `language` เอง**

---

## โมเดล

| ภาษา | โมเดล | ตั้งค่าด้วย |
|---|---|---|
| ไทย | [Biodatlab large-v3](https://huggingface.co/Vinxscribe/biodatlab-whisper-th-large-v3-faster) (ค่าเริ่มต้น) หรือ [Typhoon turbo](https://huggingface.co/typhoon-ai/typhoon-whisper-turbo) (แม่นและเร็วกว่า ดูด้านล่าง) | `WHISPER_MODEL` |
| อื่น ๆ + ตรวจภาษา | [large-v3-turbo](https://huggingface.co/mobiuslabsgmbh/faster-whisper-large-v3-turbo) | `WHISPER_MODEL_GENERAL` |

**ใช้ Typhoon turbo (แนะนำสำหรับภาษาไทย)** ทดสอบกับ 200 คลิปไทย: CER ≈ 1.9% เทียบกับ ≈ 2.9% ของ Biodatlab และเร็วกว่าประมาณ 1.8 เท่าบน GTX 1060 Typhoon ยังไม่มีไฟล์พร้อมใช้ ต้องแปลงเองครั้งเดียว:

```bash
pip install torch transformers          # ใช้เฉพาะตอนแปลง ลบทิ้งได้หลังเสร็จ
./scripts/convert_typhoon.sh            # ได้โฟลเดอร์ ~/models/typhoon-whisper-turbo-ct2 (~800 MB)
```

(สคริปต์เป็น bash ใช้บน Linux/macOS ส่วน Windows ให้รันผ่าน WSL หรือ Git Bash)

แล้วใส่ใน `.env` (ใช้ path เต็มที่สคริปต์พิมพ์ให้):

```env
WHISPER_MODEL=/home/ชื่อคุณ/models/typhoon-whisper-turbo-ct2
```

---

## ต่อกับ Frontend

1. รัน backend ตามข้างบน (พอร์ต 8000)
2. สร้าง Supabase project ของตัวเอง แล้วรันไฟล์ใน `frontend/supabase/migrations/` ตามลำดับ `001` → `004` ใน SQL Editor และสร้าง Storage bucket ชื่อ `videos` (public)
3. สร้าง `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# ไม่บังคับ
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...
```

4. ใส่ `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` ใน `backend/.env` ด้วย ถ้าอยากให้พรีวิวอัปโหลดขึ้น Storage (ไม่ใส่ก็ใช้ได้ วิดีโอจะเสิร์ฟจากเครื่อง)
5. รันเว็บ: `cd frontend && npm install && npm run dev` แล้วเปิด http://localhost:3000

เว็บต้องล็อกอินจึงเข้าตัวตัดต่อได้ ดังนั้นต้องมี Supabase Auth แม้จะรัน backend ในเครื่อง ถ้าแค่อยากลองถอดเสียง ใช้ Swagger ที่ `/docs` โดยไม่ต้องมี frontend ได้เลย

---

## โครงสร้าง

```
backend/
├── app/
│   ├── main.py               # สร้างแอป FastAPI, CORS, เสิร์ฟ /temp_storage
│   ├── api/video_routes.py   # endpoint ทั้งหมด, ขั้นตอนดาวน์โหลด/พรีวิว/เรนเดอร์
│   ├── services/ai_services.py   # ตรวจภาษา + ถอดเสียง + จัดคำเป็นซับ
│   ├── utils/ass_generator.py    # แปลงซับ + สไตล์ เป็นไฟล์ .ass ให้ FFmpeg
│   └── core/                 # config (.env), supabase client
├── fonts/                    # ฟอนต์ที่ใช้ฝังซับ + metrics.json (ปรับขนาดให้ตรงพรีวิว)
├── scripts/convert_typhoon.sh    # แปลงโมเดล Typhoon เป็นรูปแบบ CTranslate2
└── temp_storage/             # ไฟล์ชั่วคราว (สร้างเอง)
```

---

## ข้อควรรู้

- **ถอดเสียงทีละคลิป** คำขออื่นจะรอคิว เพื่อไม่ให้ GPU/RAM เต็ม
- **ไฟล์ต้นฉบับถูกเก็บไว้ใน `temp_storage/` นาน 6 ชั่วโมง** เพื่อให้เรนเดอร์ได้คุณภาพเต็ม ระบบล้างไฟล์เก่าให้เองหลังมีการอัปโหลดหรือเรนเดอร์ครั้งถัดไป
- **ฟอนต์**: เพิ่มฟอนต์ใหม่ที่เมนูในเว็บ ต้องเพิ่มไฟล์ `.ttf` (Regular + Bold) ใน `fonts/` และค่าใน `fonts/metrics.json` ด้วย (อธิบายใน `fonts/README.md`) ไม่เช่นนั้นตอนเรนเดอร์จะใช้ฟอนต์สำรอง ขนาดจะไม่ตรงพรีวิว

---

## แก้ปัญหาเบื้องต้น

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `libcublas.so.12 is not found` | ยังไม่ได้ติดตั้ง `nvidia-cublas-cu12` และ `nvidia-cudnn-cu12` (อยู่ใน requirements.txt) หรือใช้ Python venv คนละตัวกับที่ติดตั้ง |
| `CUDA failed with error out of memory` | การ์ดจอมี VRAM ไม่พอ ปิดโปรแกรมอื่นที่ใช้ GPU หรือเช็กว่าไม่มี uvicorn ตัวเก่าค้างอยู่ (โมเดลทั้งสองถูกโหลดค้างไว้) |
| รีเควสต์แรกช้ามาก | กำลังดาวน์โหลดโมเดล รอจนเสร็จ ครั้งต่อไปจะเร็ว |
| ภาษาไทยผิดเยอะ ทั้งที่มีโมเดลดี | เช็กว่าไม่ได้รันบน CPU (CPU ใช้โมเดล `small`) และลองตั้ง `language=th` ตรง ๆ |
| ดาวน์โหลดลิงก์ YouTube ไม่ได้ / ได้ภาพ 360p | YouTube บล็อก IP หรือเปลี่ยนระบบ ลอง `pip install -U yt-dlp` ก่อนเป็นอย่างแรก หรือใส่ไฟล์ `~/cookies.txt` |
| ซับตอนเรนเดอร์ใช้ฟอนต์ไม่ตรงกับพรีวิว | ฟอนต์นั้นไม่อยู่ใน `fonts/` (เช่นฟอนต์ที่อัปโหลดเองในเว็บ) |
| `ffmpeg` เรนเดอร์ไม่ได้ / ไม่มีซับ | FFmpeg ของเครื่องไม่มี libass ติดตั้งเวอร์ชันเต็ม (full build) |
