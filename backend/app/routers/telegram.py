import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.core.database import get_supabase, get_telegram_bot, telegram_bot

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/generate-link-code")
async def generate_telegram_link_code(req: dict):
    """
    Generate an 8-character activation code for community user to link Telegram group.
    Stores code in profiles.activation_code (reusing existing field).
    """
    user_id = req.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    try:
        supabase = get_supabase()
        
        # Verify user is community role
        profile = supabase.table("profiles").select("role").eq("id", user_id).execute()
        if not profile.data or profile.data[0].get("role") != "community":
            raise HTTPException(status_code=403, detail="Only community users can link Telegram groups")
        
        # Generate 8-character hex code
        code = secrets.token_hex(4).upper()  # 4 bytes = 8 hex chars
        
        # Store in profiles.activation_code
        supabase.table("profiles").update({"activation_code": code}).eq("id", user_id).execute()
        
        return {"status": "success", "code": code}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating link code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-code")
async def verify_telegram_code(req: dict):
    """
    Verify activation code for Telegram linking.
    Called by n8n to validate code before linking group.
    Returns user_id if valid, error if invalid.
    """
    code = req.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
    
    try:
        supabase = get_supabase()
        
        # Verify code exists and belongs to community user
        profile = supabase.table("profiles").select("id, role").eq("activation_code", code.upper()).execute()
        if not profile.data:
            return {"status": "error", "message": "Kode aktivasi tidak valid atau sudah digunakan"}
        
        user = profile.data[0]
        if user.get("role") != "community":
            return {"status": "error", "message": "Kode ini bukan untuk akun komunitas"}
        
        return {"status": "success", "user_id": user["id"]}
    
    except Exception as e:
        print(f"Error verifying code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/link-group")
async def link_telegram_group(req: dict):
    """
    Link Telegram group to community profile.
    Called by n8n after processing /link command.
    """
    user_id = req.get("user_id")
    chat_id = req.get("chat_id")
    chat_title = req.get("chat_title")
    
    if not user_id or not chat_id:
        raise HTTPException(status_code=400, detail="Missing user_id or chat_id")
    
    try:
        supabase = get_supabase()
        
        # Update community_profiles with group info
        supabase.table("community_profiles").update({
            "telegram_group_id": str(chat_id),
            "telegram_group_title": chat_title or "Unknown Group",
            "telegram_linked_at": datetime.now(timezone.utc).isoformat()
        }).eq("user_id", user_id).execute()
        
        # Clear activation code (single-use)
        supabase.table("profiles").update({"activation_code": None}).eq("id", user_id).execute()
        
        # Log notification
        supabase.table("notification_log").insert({
            "user_id": user_id,
            "message_text": "Telegram group linked successfully",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "channel": "telegram_channel",
            "warning_level": 0
        }).execute()
        
        return {"status": "success", "message": "Group linked successfully"}
    
    except Exception as e:
        print(f"Error linking group: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcast")
async def telegram_broadcast(req: dict):
    """
    Send manual broadcast message to community Telegram groups.
    """
    if telegram_bot is None:
        raise HTTPException(status_code=503, detail="Telegram bot not configured")
    
    user_id = req.get("user_id")
    message = req.get("message")
    
    if not user_id or not message:
        raise HTTPException(status_code=400, detail="Missing user_id or message")
    
    try:
        supabase = get_supabase()
        bot = get_telegram_bot()
        
        # Get community profile with telegram_group_id
        profile = supabase.table("community_profiles").select("telegram_group_id, telegram_group_title").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("telegram_group_id"):
            raise HTTPException(status_code=400, detail="Telegram group not linked yet")
        
        group_id = profile.data[0]["telegram_group_id"]
        group_title = profile.data[0].get("telegram_group_title", "Unknown Group")
        
        # Send message
        await bot.send_message(
            chat_id=int(group_id),
            text=f"📢 **Pesan dari Dashboard Majalaya**\n\n{message}",
            parse_mode="Markdown"
        )
        
        # Log notification
        supabase.table("notification_log").insert({
            "user_id": user_id,
            "message_text": message,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "channel": "telegram_channel",
            "warning_level": 0
        }).execute()
        
        return {"status": "success", "message": f"Broadcast sent to {group_title}"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-broadcast")
async def test_telegram_broadcast(req: dict):
    """
    Send test message to verify Telegram integration.
    """
    if telegram_bot is None:
        raise HTTPException(status_code=503, detail="Telegram bot not configured")
    
    user_id = req.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    try:
        supabase = get_supabase()
        bot = get_telegram_bot()
        
        # Get community profile
        profile = supabase.table("community_profiles").select("telegram_group_id").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("telegram_group_id"):
            raise HTTPException(status_code=400, detail="Telegram group not linked yet")
        
        group_id = profile.data[0]["telegram_group_id"]
        
        # Send test message
        await bot.send_message(
            chat_id=int(group_id),
            text="🔔 Test notifikasi dari Dashboard Majalaya. Koneksi berhasil!"
        )
        
        return {"status": "success", "message": "Test message sent"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending test broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unlink")
async def telegram_unlink(req: dict):
    """
    Unlink Telegram group from community profile.
    """
    user_id = req.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    try:
        supabase = get_supabase()
        
        # Clear Telegram group info and disable auto alert
        supabase.table("community_profiles").update({
            "telegram_group_id": None,
            "telegram_group_title": None,
            "telegram_linked_at": None,
            "auto_alert_enabled": False
        }).eq("user_id", user_id).execute()
        
        return {"status": "success", "message": "Telegram group unlinked"}
    
    except Exception as e:
        print(f"Error unlinking Telegram: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/toggle-auto-alert")
async def toggle_auto_alert(req: dict):
    """
    Toggle automatic alert notifications for community.
    Only works if Telegram group is already linked.
    """
    user_id = req.get("user_id")
    enabled = req.get("enabled")
    
    if not user_id or enabled is None:
        raise HTTPException(status_code=400, detail="Missing user_id or enabled")
    
    try:
        supabase = get_supabase()
        
        # Verify Telegram is linked
        profile = supabase.table("community_profiles").select("telegram_group_id").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("telegram_group_id"):
            raise HTTPException(status_code=400, detail="Telegram group not linked yet")
        
        # Update auto_alert_enabled
        supabase.table("community_profiles").update({
            "auto_alert_enabled": enabled
        }).eq("user_id", user_id).execute()
        
        return {"status": "success", "auto_alert_enabled": enabled}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling auto alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auto-alert-status")
async def get_auto_alert_status(user_id: str):
    """
    Get auto alert enabled status for community.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    try:
        supabase = get_supabase()
        result = supabase.table("community_profiles").select(
            "telegram_group_id, auto_alert_enabled"
        ).eq("user_id", user_id).single().execute()
        
        if not result.data:
            return {"status": "error", "message": "Profile not found"}
        
        return {
            "status": "success",
            "telegram_linked": bool(result.data.get("telegram_group_id")),
            "auto_alert_enabled": result.data.get("auto_alert_enabled", False)
        }
    
    except Exception as e:
        print(f"Error fetching auto alert status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
