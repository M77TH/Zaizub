'use client'

import { useState, useRef } from 'react'

// กำหนดโครงสร้างข้อมูลซับไตเติ้ล
interface Subtitle {
  id: number
  start: string
  end: string
  text: string
}

export default function EditorPage() {
  // State สำหรับจัดการวิดีโอและซับไตเติ้ล
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  
  // State สำหรับสถานะและการตั้งค่า
  const [status, setStatus] = useState<'Idle' | 'Processing' | 'Ready' | 'Failed'>('Idle')
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9')
  const [language, setLanguage] = useState('th')
  const [styleParams, setStyleParams] = useState({ color: '#ffffff' })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. ฟังก์ชันรับไฟล์วิดีโอและส่งไปถอดเสียง (Extract Audio)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file)) // สร้าง URL ให้เล่นวิดีโอได้ทันที
    setStatus('Processing')

    // สร้าง FormData เพื่อส่งไป Backend
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)

    try {
      /* 
        TODO: ปลดคอมเมนต์เมื่อ Backend (/extract-audio) พร้อมใช้งาน
        const response = await fetch('http://localhost:8000/api/v1/extract-audio', {
          method: 'POST',
          body: formData
        })
        const data = await response.json()
        setSubtitles(data.subtitles) // ข้อมูลควรเป็น JSON Array
      */

      // จำลองข้อมูลตอบกลับจาก Backend เพื่อให้ทดสอบ UI ได้
      setTimeout(() => {
        setSubtitles([
          { id: 1, start: '00:00:01,000', end: '00:00:04,000', text: 'สวัสดีครับ ยินดีต้อนรับเข้าสู่ระบบ' },
          { id: 2, start: '00:00:05,000', end: '00:00:08,000', text: 'วันนี้เราจะมาทดสอบ AI Subtitle' },
        ])
        setStatus('Ready')
      }, 2000)

    } catch (error) {
      console.error(error)
      setStatus('Failed')
    }
  }

  // 2. ฟังก์ชันอัปเดตข้อความซับไตเติ้ล
  const handleTextChange = (id: number, newText: string) => {
    setSubtitles(prev => prev.map(sub => sub.id === id ? { ...sub, text: newText } : sub))
  }

  // 3. ฟังก์ชันลบซับไตเติ้ล
  const handleDelete = (id: number) => {
    setSubtitles(prev => prev.filter(sub => sub.id !== id))
  }

  // 4. ฟังก์ชันส่งข้อมูลไป Render วิดีโอไฟล์สุดท้าย
  const handleExportVideo = async () => {
    if (!videoFile || subtitles.length === 0) return
    setStatus('Processing')

    const formData = new FormData()
    formData.append('file', videoFile)
    formData.append('subtitles', JSON.stringify(subtitles)) // ส่งซับไตเติ้ลที่แก้ไขแล้ว
    formData.append('ratio', videoRatio)
    formData.append('color', styleParams.color)

    try {
      /*
        TODO: ปลดคอมเมนต์เมื่อ Backend (/render-video) พร้อมใช้งาน
        const response = await fetch('http://localhost:8000/api/v1/render-video', {
          method: 'POST',
          body: formData
        })
        
        // รับไฟล์กลับมาและสั่งเบราว์เซอร์ดาวน์โหลด
        const blob = await response.blob()
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = 'final_video.mp4'
        a.click()
      */
      
      // จำลองการ Export
      setTimeout(() => {
        alert('ส่งออกวิดีโอสำเร็จ (Mock)')
        setStatus('Ready')
      }, 3000)

    } catch (error) {
      console.error(error)
      setStatus('Failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-6 flex flex-col md:flex-row gap-6 selection:bg-purple-500/30">
      
      {/* 1. ฝั่งซ้าย: Preview และ Export */}
      <div className="w-full md:w-5/12 flex flex-col gap-4">
        
        {/* สถานะงาน */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center shadow-lg backdrop-blur-sm">
          <span className="font-semibold text-gray-300">สถานะงาน:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            status === 'Ready' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
            status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse' : 
            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* Video Player / Upload Area */}
        <div className={`bg-black border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 relative ${
            !videoUrl ? 'aspect-video' : (videoRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] w-2/3 mx-auto')
        }`}>
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6">
              <p className="text-gray-500 mb-4">อัปโหลดวิดีโอเพื่อเริ่มต้น (MP4, MOV)</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                เลือกไฟล์วิดีโอ
              </button>
              <input 
                type="file" 
                accept="video/*" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </div>
          )}
        </div>

        {/* ปุ่ม Export */}
        <div className="grid grid-cols-3 gap-3 mt-auto">
          <button 
            onClick={handleExportVideo}
            disabled={status !== 'Ready' || !videoUrl}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 disabled:cursor-not-allowed py-3 rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            Export .MP4
          </button>
          <button 
            disabled={status !== 'Ready'}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/5 py-3 rounded-xl font-medium transition-colors"
          >
            Export .SRT
          </button>
          <button 
            disabled={status !== 'Ready'}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/5 py-3 rounded-xl font-medium transition-colors"
          >
            Export .VTT
          </button>
        </div>
      </div>

      {/* 2. ฝั่งขวา: Editor และ Settings */}
      <div className="w-full md:w-7/12 flex flex-col gap-6">
        
        {/* แผงควบคุมการตั้งค่า */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-sm grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">ภาษาหลัก (Language)</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-2 outline-none focus:border-purple-500">
              <option value="th">ภาษาไทย (Thai)</option>
              <option value="en">ภาษาอังกฤษ (English)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">อัตราส่วนภาพออก (Output Ratio)</label>
            <select value={videoRatio} onChange={e => setVideoRatio(e.target.value as '16:9' | '9:16')} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-2 outline-none focus:border-purple-500">
              <option value="16:9">แนวนอน (16:9)</option>
              <option value="9:16">แนวตั้ง (9:16)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">สีข้อความ (Font Color)</label>
            <input type="color" value={styleParams.color} onChange={e => setStyleParams({color: e.target.value})} className="w-full h-10 bg-[#0a0a0a] border border-gray-700 rounded-lg outline-none cursor-pointer" />
          </div>
          <div className="flex items-end">
             {/* ปุ่มเลือกไฟล์ใหม่กรณีที่อัปโหลดไปแล้ว */}
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/10 hover:bg-white/20 p-2 rounded-lg font-medium transition-colors border border-white/10"
              >
                เปลี่ยนวิดีโอ
              </button>
          </div>
        </div>

        {/* รายการซับไตเติ้ล */}
        <div className="bg-white/5 border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-lg backdrop-blur-sm max-h-[500px]">
          <div className="p-4 border-b border-white/10 bg-white/5 font-semibold text-purple-300 flex justify-between items-center">
            <span>ตัวแก้ไขซับไตเติ้ล (Subtitle Editor)</span>
            <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">{subtitles.length} บรรทัด</span>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
            {subtitles.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                ไม่มีข้อมูลซับไตเติ้ล อัปโหลดวิดีโอเพื่อแยกเสียง
              </div>
            ) : (
              subtitles.map((sub) => (
                <div key={sub.id} className="flex gap-3 bg-[#0a0a0a] border border-gray-800 p-3 rounded-xl hover:border-purple-500/50 transition-colors group">
                  <div className="flex flex-col text-[10px] text-gray-500 justify-center gap-1 font-mono w-24">
                    <span className="bg-gray-800/50 px-1 py-1 rounded text-center">{sub.start}</span>
                    <span className="bg-gray-800/50 px-1 py-1 rounded text-center">{sub.end}</span>
                  </div>
                  <textarea 
                    value={sub.text}
                    onChange={(e) => handleTextChange(sub.id, e.target.value)}
                    className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-200"
                    rows={2}
                  />
                  <button onClick={() => handleDelete(sub.id)} className="text-gray-600 hover:text-red-400 px-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}