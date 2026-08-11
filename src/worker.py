import firebase_admin
from firebase_admin import credentials, firestore, storage
import time

print("กำลังเชื่อมต่อ Firebase...")
cred = credentials.Certificate("/key/subtitle-ai-project-firebase-adminsdk-fbsvc-febf77081d.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'subtitle-ai-project.appspot.com' 
})

db = firestore.client()
print("เชื่อมต่อ Firebase สำเร็จ! กำลังรอคำสั่ง...")

# 2. ฟังก์ชันตรวจสอบงานใหม่
def check_new_jobs():

    # ค้นหาเอกสารในคอลเลกชัน 'transcription_jobs' ที่ status เป็น 'pending'
    jobs_ref = db.collection('transcription_jobs').where('status', '==', 'pending').limit(1).get()
    
    for job in jobs_ref:
        job_id = job.id
        print(f"\n[เจอวิดีโอใหม่!] รหัสงาน: {job_id}")
        
        # อัปเดตสถานะเป็น 'processing' ทันที
        db.collection('transcription_jobs').document(job_id).update({'status': 'processing'})
        
        # --- เดี๋ยวเราจะเอาโค้ด Whisper และดาวน์โหลดไฟล์มาใส่ตรงนี้ ---
        print("กำลังจำลองการแปลภาษา (3 วินาที)...")
        time.sleep(3)
        
        # อัปเดตสถานะกลับเป็นเสร็จสิ้น (จำลองว่าทำเสร็จแล้ว)
        db.collection('transcription_jobs').document(job_id).update({'status': 'completed'})
        print(f"[เสร็จสิ้น!] รหัสงาน: {job_id}")

# 3. ลูปวนเช็คงานทุกๆ 3 วินาที
try:
    while True:
        check_new_jobs()
        time.sleep(3)
except KeyboardInterrupt:
    print("\nปิดระบบ AI Worker")