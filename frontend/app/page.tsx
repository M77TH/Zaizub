'use client'; // บังคับให้เป็น Client Component เพราะมีการจัดการ State

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000'); // เปลี่ยนเป็น ngrok URL ตอนเทสเครื่องคนอื่น
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    setVideoUrl(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // ยิง Request ไปที่ FastAPI Backend
      const response = await fetch(`${apiUrl}/api/v1/process-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการประมวลผล');

      // รับไฟล์วิดีโอกลับมาเป็น Blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🎬 AI Subtitle Generator
        </h1>

        <div className="space-y-6">
          {/* ช่องใส่ API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL (Localhost หรือ ngrok)
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* อัปโหลดไฟล์ */}
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
            {loading ? 'กำลังให้ AI ประมวลผล... (อาจใช้เวลาสักครู่)' : 'เริ่มสร้างซับไตเติ้ล'}
          </button>

          {/* แสดงแจ้งเตือน Error */}
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          {/* แสดงผลลัพธ์วิดีโอ */}
          {videoUrl && (
            <div className="mt-8 space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">ผลลัพธ์วิดีโอ</h2>
              <video src={videoUrl} controls className="w-full rounded-lg shadow-sm" />
              <a
                href={videoUrl}
                download="subtitled_video.mp4"
                className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl shadow-md transition-all"
              >
                ดาวน์โหลดวิดีโอ
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}