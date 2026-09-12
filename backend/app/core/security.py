import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings # หรือ os.getenv หากตั้งค่าผ่าน os โดยตรง

# ตั้งค่า Schema รับ Bearer Token จาก Header
security = HTTPBearer()

# ดึงค่า JWT Secret ของ Supabase (ตรวจสอบให้แน่ใจว่ามี SUPABASE_JWT_SECRET ใน .env / config)
SUPABASE_JWT_SECRET = getattr(settings, "SUPABASE_JWT_SECRET", os.getenv("SUPABASE_JWT_SECRET"))

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    ตรวจสอบความถูกต้องของ JWT Token จาก Supabase
    และส่งคืนข้อมูล Payload ของ User (เช่น user_id, email)
    """
    token = credentials.credentials

    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured on server"
        )

    try:
        # ถอดรหัสและตรวจสอบความถูกต้องของ Token
        # Supabase ใช้ algorithm HS256 โดยค่าเริ่มต้น
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """
    Helper ดึงเฉพาะ user_id (sub) ออกมาใช้งานโดยตรง
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing user ID"
        )
    return user_id