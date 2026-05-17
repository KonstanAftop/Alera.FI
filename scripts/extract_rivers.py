import osmnx as ox
import geopandas as gpd
import os

_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Define the area for Bandung Raya (City + Regency + West Bandung)
places = [
    "Bandung City, West Java, Indonesia",
    "Bandung Regency, West Java, Indonesia",
    "West Bandung Regency, West Java, Indonesia"
]
tags = {'waterway': ['river', 'stream', 'canal']}

print(f"Extracting all waterways for: {places}...")

try:
    # 1. Download features
    rivers = ox.features_from_place(places, tags)

    # 2. Filter for LineStrings only
    river_lines = rivers[rivers.geometry.type == 'LineString'].copy()

    # 3. Keep only relevant columns to keep file size reasonable
    # but keep 'name' and 'waterway' for popups
    cols_to_keep = ['name', 'waterway', 'geometry']
    available_cols = [c for c in cols_to_keep if c in river_lines.columns]
    river_lines = river_lines[available_cols]

    # 4. Save to GeoJSON (served by Vite as /geo/rivers_bandung.geojson)
    output_path = os.path.join(_REPO_ROOT, "public", "geo", "rivers_bandung.geojson")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    river_lines.to_file(output_path, driver='GeoJSON')
    
    print(f"✅ Successfully saved {len(river_lines)} lines to {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")

except Exception as e:
    print(f"❌ Error: {e}")
    print("\nReminder: This script requires internet access to reach OSM.")
