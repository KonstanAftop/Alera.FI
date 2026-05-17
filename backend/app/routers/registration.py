import random
import httpx
from fastapi import APIRouter
from app.core.database import get_supabase
from app.models.schemas import CompleteRegistrationRequest
from app.services.geo import (
    calculate_distance,
    get_elevation,
    get_flood_risk_score,
    get_river_distance,
    calculate_risk_level,
)

router = APIRouter(prefix="/register", tags=["Registration"])


@router.get("/instruments")
async def get_instruments():
    """Get all instrument metadata."""
    try:
        supabase = get_supabase()
        res = supabase.table("instrument_metadata").select("*").execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}


@router.get("/geocoding/search")
async def search_location(q: str):
    """Search location using Nominatim."""
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={q}&limit=5"
    headers = {"User-Agent": "PamorDashboard/1.0"}
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        return response.json()


@router.post("/profile")
async def process_registration(profile: dict):
    """
    Registration endpoint with elevation, station recommendation,
    flood risk scoring, and river proximity analysis.
    """
    try:
        print(f"Received profile request: {profile}")
        supabase = get_supabase()
        
        lat = profile.get("lat")
        lon = profile.get("lon") or profile.get("lng")
        
        if lat is None or lon is None:
            return {"status": "error", "message": "Missing lat or lon"}
            
        # 1. Get User Elevation
        user_elev = await get_elevation(lat, lon)
        
        # 2. Get all stations
        stations = supabase.table("instrument_metadata").select("*").execute().data
        
        # 3. Analyze distances and elevations for station recommendation
        candidates = []
        for s in stations:
            dist = calculate_distance(lat, lon, s["lat"], s["lon"])
            s_elev = s.get("elevation", 0) or 0
            is_upstream = s_elev > user_elev
            
            candidates.append({
                "id": s["sensor_id"],
                "distance": dist,
                "is_upstream": is_upstream
            })
            
        # Strategy:
        # - Priority 1: Upstream stations sorted by distance (top 2)
        # - Priority 2: Fill to 3 total using nearest remaining stations
        candidates.sort(key=lambda x: x["distance"])
        
        upstream_nearest = [c["id"] for c in candidates if c["is_upstream"]][:2]
        remaining = [c["id"] for c in candidates if c["id"] not in upstream_nearest]
        
        recommended_ids = (upstream_nearest + remaining)[:3]
        
        # 4. Spatial Risk Analysis
        flood_score = get_flood_risk_score(lat, lon)
        river_dist = get_river_distance(lat, lon)
        risk_level = calculate_risk_level(flood_score, river_dist)
            
        return {
            "status": "success",
            "recommended_pos": recommended_ids,
            "user_elevation": user_elev,
            "flood_risk_score": round(flood_score, 3),
            "river_distance": round(river_dist, 3),
            "risk_profile": risk_level,
            "message": f"Profile categorized as {risk_level} risk. Found {len(upstream_nearest)} upstream stations."
        }
    except Exception as e:
        print(f"Error in process_registration: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/complete")
async def complete_registration(req: CompleteRegistrationRequest):
    """
    Complete registration by inserting profile and subscriptions using service_role.
    This bypasses RLS so it works even when email confirmation is ON (no session yet).
    """
    try:
        print(f"Completing registration for {req.email} ({req.role})")
        supabase = get_supabase()

        # Generate silent activation code for post-login Telegram linking (8-char hex)
        try:
            code = ''.join(random.choices('0123456789abcdefABCDEF', k=8))
            supabase.table("profiles").update({"activation_code": code}).eq("id", req.user_id).execute()
        except Exception as e:
            print(f"Warning: failed to set activation_code: {e}")
        
        if req.role == "personal":
            # 1. Insert individual profile
            profile_data = {
                "user_id": req.user_id,
                "location_lat": req.lat,
                "location_lng": req.lon,
                "address": req.address,
                "elevation": req.elevation,
                "risk_profile": req.risk_profile,
                "distance_to_river": req.river_distance,
            }
            profile_data = {k: v for k, v in profile_data.items() if v is not None}
            
            try:
                supabase.table("individual_profiles").insert(profile_data).execute()
                print(f"Inserted individual_profiles for {req.user_id}")
            except Exception as e:
                raise Exception(f"individual_profiles insert failed: {e}")
            
            # 2. Insert subscriptions
            if req.selected_pos_ids:
                subs = []
                for sid in req.selected_pos_ids:
                    inst = next((i for i in req.instruments if i.get("id") == sid), None)
                    dist = None
                    elev_diff = None
                    if inst and req.lat is not None and req.lon is not None:
                        dist = calculate_distance(
                            req.lat, req.lon,
                            inst.get("lngLat", [0, 0])[1], inst.get("lngLat", [0, 0])[0]
                        )
                    if inst and req.elevation is not None:
                        elev_diff = (inst.get("elevation") or 0) - req.elevation
                    
                    subs.append({
                        "user_id": req.user_id,
                        "sensor_id": sid,
                        "distance_km": dist,
                        "elevation_diff": elev_diff,
                    })
                
                try:
                    supabase.table("user_subscriptions").insert(subs).execute()
                    print(f"Inserted {len(subs)} user_subscriptions")
                except Exception as e:
                    raise Exception(f"user_subscriptions insert failed: {e}")
        
        else:  # community
            # 1. Update community profile (row already created in auth_register)
            profile_data = {
                "community_name": req.full_name,
            }
            if req.telegram_group_id:
                profile_data["telegram_group_id"] = req.telegram_group_id
            
            try:
                supabase.table("community_profiles").update(profile_data).eq("user_id", req.user_id).execute()
                print(f"Updated community_profiles for {req.user_id}")
            except Exception as e:
                raise Exception(f"community_profiles update failed: {e}")
            
            # 2. Insert community subscriptions
            if req.selected_pos_ids:
                subs = [
                    {"community_id": req.user_id, "sensor_id": sid}
                    for sid in req.selected_pos_ids
                ]
                try:
                    supabase.table("community_subscriptions").insert(subs).execute()
                    print(f"Inserted {len(subs)} community_subscriptions")
                except Exception as e:
                    raise Exception(f"community_subscriptions insert failed: {e}")
        
        return {"status": "success", "message": "Registration completed"}
    
    except Exception as e:
        print(f"Error in complete_registration: {e}")
        return {"status": "error", "message": str(e)}
