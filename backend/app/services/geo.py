import math
import json
import httpx
import rasterio
from shapely.geometry import Point, shape, MultiLineString
from shapely.ops import nearest_points
from app.core.config import GEOJSON_PATH, TIFF_PATH

# Load river geometries once at module import
RIVER_LINES: MultiLineString | None = None

try:
    with open(GEOJSON_PATH, "r") as f:
        RIVER_DATA = json.load(f)
    features = RIVER_DATA.get("features", [])
    line_geoms = [
        shape(feat["geometry"])
        for feat in features
        if feat.get("geometry", {}).get("type") in ("LineString", "MultiLineString")
    ]
    if line_geoms:
        RIVER_LINES = MultiLineString(line_geoms)
        print(f"Loaded {len(features)} river features; built MultiLineString with {RIVER_LINES.length:.1f}° total length.")
    else:
        print("No LineString/MultiLineString geometries found.")
except Exception as e:
    print(f"Error loading GeoJSON: {e}")
    RIVER_DATA = {"features": []}


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula to calculate distance between two points in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_river_distance(lat: float, lon: float) -> float:
    """
    Calculate minimum distance (km) from a point to any river line.
    
    GeoJSON coordinates are [lon, lat]; Shapely Point is (x, y) = (lon, lat).
    nearest_points returns the closest vertex on the geometry in degree space,
    which we then convert to kilometres with Haversine.
    """
    if RIVER_LINES is None or RIVER_LINES.is_empty:
        return 99.0

    user_point = Point(lon, lat)
    _, nearest_on_river = nearest_points(user_point, RIVER_LINES)
    return calculate_distance(lat, lon, nearest_on_river.y, nearest_on_river.x)


def get_flood_risk_score(lat: float, lon: float) -> float:
    """Sample the flood_risk.tiff raster at the given location."""
    try:
        if not TIFF_PATH.exists():
            return 0.0
        with rasterio.open(TIFF_PATH) as ds:
            vals = list(ds.sample([(lon, lat)]))
            if vals and len(vals[0]) > 0:
                return float(vals[0][0])
    except Exception as e:
        print(f"TIFF sample error: {e}")
    return 0.0


async def get_elevation(lat: float, lon: float) -> float:
    """Fetch elevation from Open-Meteo API."""
    try:
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()["elevation"][0]
    except Exception as e:
        print(f"Elevation API error: {e}")
    return 0.0


def calculate_risk_level(flood_score: float, river_dist: float) -> str:
    """Determine risk level based on flood score and river distance."""
    if flood_score > 0.6 or river_dist < 0.3:
        return "High"
    elif flood_score > 0.3 or river_dist < 1.0:
        return "Medium"
    return "Low"
