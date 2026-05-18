from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional
from fastapi import APIRouter, HTTPException
from app.core.database import get_supabase
from app.models.schemas import ProfileUpdateRequest
from app.services.geo import (
    calculate_distance,
    calculate_risk_level,
    get_elevation,
    get_flood_risk_score,
    get_river_distance,
)

router = APIRouter(prefix="/api", tags=["Data API"])


def _get_assigned_sensor_ids(supabase, user_id: str, role: str) -> list[str]:
    if role == "personal":
        subs = supabase.table("user_subscriptions").select("sensor_id").eq("user_id", user_id).execute()
        return [s["sensor_id"] for s in (subs.data or [])]
    if role == "community":
        subs = supabase.table("community_subscriptions").select("sensor_id").eq("community_id", user_id).execute()
        return [s["sensor_id"] for s in (subs.data or [])]
    return []


@router.get("/sensors")
async def get_sensor_data(user_id: Optional[str] = None):
    """
    Fetch all sensor current states with instrument metadata.
    For personal users, filters to only subscribed stations.
    """
    try:
        supabase = get_supabase()
        
        # Get user role and subscriptions if user_id provided
        user_role = "community"
        assigned_ids = []
        
        if user_id:
            profile = supabase.table("profiles").select("role").eq("id", user_id).execute()
            if profile.data:
                user_role = profile.data[0].get("role", "community")
            
            assigned_ids = _get_assigned_sensor_ids(supabase, user_id, user_role)
        
        # Fetch all sensor current states with instrument metadata
        result = supabase.table("sensor_current_state").select(
            "sensor_id, current_value, current_warning_level, previous_value, previous_warning_level, trend_3h, last_updated_at, "
            "instrument_metadata(pos_name, sensor_type, lat, lon, elevation)"
        ).order("last_updated_at", desc=True).execute()
        
        rows = result.data or []
        
        if user_id:
            assigned_set = set(assigned_ids)
            rows = [r for r in rows if r["sensor_id"] in assigned_set]
        
        return {"status": "success", "data": rows, "user_role": user_role}
    
    except Exception as e:
        print(f"Error fetching sensor data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sensors/{sensor_id}/history")
async def get_sensor_history(sensor_id: str, hours: int = 3):
    """
    Fetch historical sensor data for sparkline charts.
    """
    try:
        supabase = get_supabase()
        wib = ZoneInfo("Asia/Jakarta")
        cutoff = (datetime.now(wib) - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
        
        result = supabase.table("obs_data").select(
            "value, measured_at, warning_level"
        ).eq("sensor_id", sensor_id).gte("measured_at", cutoff).order("measured_at").execute()
        
        return {"status": "success", "data": result.data or []}
    
    except Exception as e:
        print(f"Error fetching sensor history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/profile")
async def get_user_profile(user_id: str):
    """
    Fetch user profile with role-specific data.
    """
    try:
        supabase = get_supabase()
        
        # Get base profile
        profile = supabase.table("profiles").select(
            "id, full_name, email, role, telegram_linked, activation_code"
        ).eq("id", user_id).single().execute()
        
        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        result = profile.data
        result["subscribed_pos_ids"] = _get_assigned_sensor_ids(supabase, user_id, result["role"])
        
        # Get role-specific data
        if result["role"] == "personal":
            individual = supabase.table("individual_profiles").select(
                "location_lat, location_lng, address, elevation, risk_profile, distance_to_river"
            ).eq("user_id", user_id).single().execute()
            
            if individual.data:
                result["individual_profile"] = individual.data
        elif result["role"] == "community":
            community = supabase.table("community_profiles").select(
                "community_name, managed_area, telegram_group_id, telegram_group_title, telegram_linked_at"
            ).eq("user_id", user_id).single().execute()
            
            if community.data:
                result["community_profile"] = community.data
                # Set telegram_linked based on whether telegram_group_id exists
                result["telegram_linked"] = bool(community.data.get("telegram_group_id"))
        
        return {"status": "success", "data": result}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/user/profile")
async def update_user_profile(req: ProfileUpdateRequest):
    """
    Persist user profile edits and station assignments.
    """
    try:
        supabase = get_supabase()

        supabase.table("profiles").update({
            "full_name": req.full_name,
            "email": req.email,
        }).eq("id", req.user_id).execute()

        if req.role == "personal":
            if req.lat is None or req.lon is None:
                raise HTTPException(status_code=400, detail="Personal profile requires lat and lon")

            user_elev = await get_elevation(req.lat, req.lon)
            flood_score = get_flood_risk_score(req.lat, req.lon)
            river_dist = get_river_distance(req.lat, req.lon)
            risk_level = calculate_risk_level(flood_score, river_dist)

            profile_data = {
                "location_lat": req.lat,
                "location_lng": req.lon,
                "address": req.address,
                "elevation": user_elev,
                "risk_profile": risk_level,
                "distance_to_river": river_dist,
            }
            existing_profile = supabase.table("individual_profiles").select("user_id").eq("user_id", req.user_id).execute()
            if existing_profile.data:
                supabase.table("individual_profiles").update(profile_data).eq("user_id", req.user_id).execute()
            else:
                supabase.table("individual_profiles").insert({
                    "user_id": req.user_id,
                    **profile_data,
                }).execute()

            supabase.table("user_subscriptions").delete().eq("user_id", req.user_id).execute()
            if req.selected_pos_ids:
                subs = []
                for sid in req.selected_pos_ids:
                    inst = next((i for i in req.instruments if i.get("id") == sid), None)
                    dist = None
                    elev_diff = None
                    if inst:
                        lng_lat = inst.get("lngLat", [0, 0])
                        dist = calculate_distance(req.lat, req.lon, lng_lat[1], lng_lat[0])
                        elev_diff = (inst.get("elevation") or 0) - user_elev
                    subs.append({
                        "user_id": req.user_id,
                        "sensor_id": sid,
                        "distance_km": dist,
                        "elevation_diff": elev_diff,
                    })
                supabase.table("user_subscriptions").insert(subs).execute()

            return {
                "status": "success",
                "data": {
                    "subscribed_pos_ids": req.selected_pos_ids,
                    "individual_profile": {
                        "location_lat": req.lat,
                        "location_lng": req.lon,
                        "address": req.address,
                        "elevation": user_elev,
                        "risk_profile": risk_level,
                        "distance_to_river": river_dist,
                    },
                },
            }

        existing_community = supabase.table("community_profiles").select("user_id").eq("user_id", req.user_id).execute()
        if existing_community.data:
            supabase.table("community_profiles").update({
                "community_name": req.full_name,
            }).eq("user_id", req.user_id).execute()

        supabase.table("community_subscriptions").delete().eq("community_id", req.user_id).execute()
        if req.selected_pos_ids:
            supabase.table("community_subscriptions").insert([
                {"community_id": req.user_id, "sensor_id": sid}
                for sid in req.selected_pos_ids
            ]).execute()

        return {
            "status": "success",
            "data": {
                "subscribed_pos_ids": req.selected_pos_ids,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/flood-reports")
async def get_flood_reports(community_id: Optional[str] = None):
    """
    Fetch flood reports, optionally filtered by community.
    """
    try:
        supabase = get_supabase()
        query = supabase.table("flood_reports").select("*").order("reported_at", desc=True)
        
        if community_id:
            query = query.eq("community_id", community_id)
        
        result = query.execute()
        return {"status": "success", "data": result.data or []}
    
    except Exception as e:
        print(f"Error fetching flood reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flood-reports")
async def create_flood_report(report: dict):
    """
    Create a new flood report.
    """
    try:
        supabase = get_supabase()
        result = supabase.table("flood_reports").insert(report).execute()
        return {"status": "success", "data": result.data[0] if result.data else None}
    
    except Exception as e:
        print(f"Error creating flood report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/flood-reports/{report_id}")
async def delete_flood_report(report_id: str):
    """
    Delete a flood report.
    """
    try:
        supabase = get_supabase()
        supabase.table("flood_reports").delete().eq("id", report_id).execute()
        return {"status": "success"}
    
    except Exception as e:
        print(f"Error deleting flood report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/community/telegram-status")
async def get_community_telegram_status(user_id: str):
    """
    Get Telegram link status for a community user.
    """
    try:
        supabase = get_supabase()
        result = supabase.table("community_profiles").select(
            "telegram_group_id, telegram_group_title, telegram_linked_at"
        ).eq("user_id", user_id).single().execute()
        
        return {"status": "success", "data": result.data}
    
    except Exception as e:
        print(f"Error fetching telegram status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
