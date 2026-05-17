import os
import rasterio
import math
import json

# Paths (repo root = parent of scripts/)
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GEOJSON_PATH = os.path.join(REPO_ROOT, "public", "geo", "rivers_bandung.geojson")
TIFF_PATH = os.path.join(REPO_ROOT, "public", "geo", "flood_risk.tiff")

# Sample coordinate (Majalaya, Bandung)
TEST_LAT = -7.05
TEST_LON = 107.75

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371 
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def point_to_segment_distance(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return calculate_distance(py, px, y1, x1)
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return calculate_distance(py, px, y1 + t * dy, x1 + t * dx)

def get_river_distance(lat, lon, river_data):
    min_dist = float('inf')
    for feat in river_data.get('features', []):
        if feat['geometry']['type'] == 'LineString':
            coords = feat['geometry']['coordinates']
            for i in range(len(coords) - 1):
                p1, p2 = coords[i], coords[i+1]
                dist = point_to_segment_distance(lon, lat, p1[0], p1[1], p2[0], p2[1])
                if dist < min_dist: min_dist = dist
    return min_dist

def get_flood_risk_score(lat, lon):
    try:
        with rasterio.open(TIFF_PATH) as ds:
            vals = list(ds.sample([(lon, lat)]))
            if vals and len(vals[0]) > 0:
                return float(vals[0][0])
    except Exception as e:
        print(f"TIFF Error: {e}")
    return 0.0

def run_test():
    print(f"--- Testing Spatial Analysis for ({TEST_LAT}, {TEST_LON}) ---")
    
    # 1. Test TIFF Risk
    print("\n1. Testing Flood Risk Score (TIFF)...")
    score = get_flood_risk_score(TEST_LAT, TEST_LON)
    print(f"Result: {score}")

    # 2. Test GeoJSON Distance
    print("\n2. Testing River Distance (GeoJSON)...")
    dist = 999.0
    if os.path.exists(GEOJSON_PATH):
        with open(GEOJSON_PATH, "r") as f:
            river_data = json.load(f)
        dist = get_river_distance(TEST_LAT, TEST_LON, river_data)
        print(f"Result: {dist:.4f} km")
    else:
        print(f"GeoJSON not found at {GEOJSON_PATH}")

    # 3. Categorization Logic
    risk_level = "Low"
    if score > 0.6 or dist < 0.3:
        risk_level = "High"
    elif score > 0.3 or dist < 1.0:
        risk_level = "Medium"
    
    print(f"\nFinal Risk Category: {risk_level}")

if __name__ == "__main__":
    run_test()
