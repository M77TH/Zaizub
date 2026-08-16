import os
import ffmpeg

def download_youtube(url: str, output_filename: str):
    """ดาวน์โหลดวิดีโอจาก YouTube ด้วย yt-dlp"""
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_filename,
        'quiet': False
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])