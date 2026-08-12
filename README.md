# Whisper


winget install ffmpeg
-----------
winget install ngrok.ngrok
scoop install ngrok

ngrok config add-authtoken $YOUR_AUTHTOKEN
----------------------

pip install faster-whisper firebase-admin uvicorn python-multipart yt-dlp fastapi
  ===
python -m pip install fastapi uvicorn python-multipart faster-whisper yt-dlp

--------------------------------
รันเหล่านี้นะจ๊ะ
Terminal => uvicorn main:app --reload
Terminal อีกหน้าต่าง => ngrok http 8000