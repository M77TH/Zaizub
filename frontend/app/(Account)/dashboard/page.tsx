'use client'; 

import { useState } from 'react';
// 1. นำเข้า Supabase Client ที่เราสร้างไว้ในเฟสที่แล้ว
import { createClient } from '../../lib/supabase/client'; // ตรวจสอบ path ให้ตรงกับโฟลเดอร์ของคุณด้วยนะครับ

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || '');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // เรียกใช้งาน Supabase
  const supabase = createClient();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    setVideoUrl(null);

    try {
      // --- ส่วนที่ 1: อัปโหลดขึ้น Supabase Storage ---
      console.log("กำลังอัปโหลดวิดีโอขึ้น Supabase...");
      
      // สร้างชื่อไฟล์ใหม่ให้ไม่ซ้ำกันด้วย Timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // อัปโหลดไฟล์เข้า Bucket ที่ชื่อว่า 'videos'
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw new Error(`อัปโหลดล้มเหลว: ${uploadError.message}`);

      // ดึง URL สาธารณะของไฟล์ที่เพิ่งอัปโหลดเสร็จ
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      const publicVideoUrl = publicUrlData.publicUrl;
      console.log("อัปโหลดสำเร็จ! ได้ลิงก์:", publicVideoUrl);

      // (ชั่วคราว) นำลิงก์มาแสดงผลบนหน้าเว็บดูก่อนว่าอัปโหลดเข้าจริงไหม
      setVideoUrl(publicVideoUrl);


      // --- ส่วนที่ 2: เดี๋ยวเราจะเอา publicVideoUrl ส่งไปให้ FastAPI ที่ตรงนี้ในขั้นตอนต่อไป ---
      

    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* ... (ส่วน UI ด้านล่างปล่อยไว้เหมือนเดิมได้เลยครับ) ... */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🎬 AI Subtitle Generator
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL (Localhost หรือ Render)
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition">
            <input
              type="file"
              accept="video/mp4"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full py-3 rounded-xl text-white font-semibold shadow-md transition-all ${
              !file || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {loading ? 'กำลังอัปโหลดวิดีโอขึ้น Cloud...' : 'อัปโหลดวิดีโอ'}
          </button>

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          {videoUrl && (
            <div className="mt-8 space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">ทดสอบผลลัพธ์จาก Supabase</h2>
              <video src={videoUrl} controls className="w-full rounded-lg shadow-sm" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}