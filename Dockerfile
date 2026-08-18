# 1. ใช้ระบบปฏิบัติการ Linux ที่มี Python 3.10 ขนาดเล็ก (slim)
FROM python:3.10-slim

# 2. ติดตั้ง FFmpeg บนระบบ Linux ของเซิร์ฟเวอร์
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

# 3. กำหนดโฟลเดอร์หลักสำหรับทำงานในเซิร์ฟเวอร์
WORKDIR /app

# 4. คัดลอกไฟล์ requirements เข้าไปและสั่งติดตั้งไลบรารี
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. คัดลอกโค้ดทั้งหมดของเรา (เช่น โฟลเดอร์ app/) เข้าไปในเซิร์ฟเวอร์
COPY . .

# 6. บอกให้ Render รู้ว่าจะมีการเปิดใช้งานพอร์ต 10000
EXPOSE 10000

# 7. คำสั่งสำหรับรัน FastAPI เมื่อเซิร์ฟเวอร์เปิดขึ้นมา
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]