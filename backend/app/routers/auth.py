import httpx
from fastapi import APIRouter, HTTPException
from app.core.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from app.core.database import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def _call_supabase_admin_users(method: str, body: dict = None) -> dict:
    """Call Supabase Auth Admin API using service_role key."""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
    }
    async with httpx.AsyncClient() as client:
        if method == "POST":
            resp = await client.post(url, headers=headers, json=body)
        else:
            raise ValueError(f"Unsupported method: {method}")
        return {"status_code": resp.status_code, "data": resp.json()}


@router.post("/register")
async def auth_register(req: dict):
    """
    Create a new user via Supabase Auth Admin API (service_role).
    Bypasses email confirmation — no emails sent, no rate limits.
    """
    email = req.get("email")
    password = req.get("password")
    full_name = req.get("full_name")
    role = req.get("role")

    if not email or not password or not role:
        raise HTTPException(status_code=400, detail="Missing email, password, or role")

    try:
        supabase = get_supabase()
        
        result = await _call_supabase_admin_users("POST", {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name, "role": role},
        })

        if result["status_code"] >= 400:
            msg = result["data"].get("msg") or result["data"].get("message") or str(result["data"])
            print(f"Auth admin error: {msg}")
            return {"status": "error", "message": msg}

        user = result["data"]
        user_id = user.get("id")

        # Ensure profiles row has basic info
        try:
            supabase.table("profiles").update({
                "full_name": full_name,
                "email": email,
                "role": role,
            }).eq("id", user_id).execute()
        except Exception as e:
            print(f"Warning: profiles update failed: {e}")

        # Auto-create community_profiles for community users
        if role == "community":
            try:
                supabase.table("community_profiles").insert({
                    "user_id": user_id,
                    "community_name": full_name,
                }).execute()
                print(f"Auto-created community_profiles for {user_id}")
            except Exception as e:
                print(f"Warning: community_profiles auto-creation failed: {e}")

        return {"status": "success", "user_id": user_id, "email": user.get("email")}
    except Exception as e:
        print(f"Error in auth_register: {e}")
        return {"status": "error", "message": str(e)}
