import os
from supabase import create_client, Client
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "https://ywjfwxuvrzgefuuncapt.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[Supabase Init Warning] {e}")


def upload_to_supabase_storage(file_path: str, destination_path: str, bucket_name: str = "videos", content_type: str = "video/mp4") -> str:
    """
    Uploads a local file to Supabase Storage bucket and returns its permanent public URL.
    """
    if not supabase:
        raise RuntimeError("Supabase client is not initialized. Please verify SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env")
    
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    
    # Upsert to prevent duplicate conflicts
    res = supabase.storage.from_(bucket_name).upload(
        path=destination_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"}
    )
    if hasattr(res, 'error') and res.error:
        raise RuntimeError(f"Supabase Storage error: {res.error}")
        
    public_url = supabase.storage.from_(bucket_name).get_public_url(destination_path)
    return public_url


def delete_from_supabase_storage(paths: list[str], bucket_name: str = "videos"):
    """
    Deletes files from Supabase Storage bucket to free up space.
    """
    if not supabase or not paths:
        return []
    try:
        res = supabase.storage.from_(bucket_name).remove(paths)
        print(f"[Supabase Storage] Removed {paths}: {res}")
        return res
    except Exception as e:
        print(f"[Supabase Storage Remove Warning] {e}")
        return []

