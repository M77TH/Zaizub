from faster_whisper import WhisperModel
import time

print("กำลังโหลดโมเดล...")
start_time = time.time()

# โหลดโมเดลขนาด "base" (รันบน CPU ก่อนเพื่อทดสอบ)
model = WhisperModel("base", device="cpu", compute_type="int8")
print(f"โหลดโมเดลเสร็จสิ้น! ใช้เวลา {time.time() - start_time:.2f} วินาที")

model.transcribe("my_video.mp4")
# --- สร้างไฟล์เสียงจำลองเพื่อทดสอบ (ถ้าคุณมีไฟล์วิดีโอ .mp4 สั้นๆ ให้เปลี่ยนชื่อตรงนี้) ---
# ตัวอย่าง: model.transcribe("my_video.mp4")