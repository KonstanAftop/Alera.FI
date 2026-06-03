import osmnx as ox
import geopandas as gpd
import os
from shapely.geometry import box

_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# All districts and cities covering Citarum watershed
# From upstream (Bandung highland) to downstream (Karawang/Bekasi coast)
places = [
    # Kabupaten
    "Bandung Regency, West Java, Indonesia",
    "West Bandung Regency, West Java, Indonesia",
    "Sumedang Regency, West Java, Indonesia",
    "Cianjur Regency, West Java, Indonesia",
    "Purwakarta Regency, West Java, Indonesia",
    "Karawang Regency, West Java, Indonesia",
    "Bekasi Regency, West Java, Indonesia",
    "Bogor Regency, West Java, Indonesia",
    "Subang Regency, West Java, Indonesia",
    # Kota
    "Bandung City, West Java, Indonesia",
    "Cimahi City, West Java, Indonesia",
    "Bekasi City, West Java, Indonesia",
]
tags = {'waterway': ['river', 'stream', 'canal']}

print(f"Extracting Citarum watershed from: {len(places)} regions...")

try:
    # 1. Download features using multiple places to cover DAS Citarum
    rivers = ox.features_from_place(places, tags)

    # 2. Filter for LineStrings only
    river_lines = rivers[rivers.geometry.type == 'LineString'].copy()
    
    print(f"Total waterways found: {len(river_lines)}")
    
    # 3. Remove rows with NaN in critical columns and invalid geometries
    river_lines = river_lines.dropna(subset=['geometry'])
    river_lines = river_lines[river_lines.geometry.notna()].copy()
    river_lines = river_lines[river_lines.geometry.is_valid].copy()
    river_lines = river_lines[~river_lines.geometry.is_empty].copy()
    print(f"After cleaning invalid geometries: {len(river_lines)}")
    
    cols_to_keep = ['name', 'waterway', 'geometry']
    available_cols = [c for c in cols_to_keep if c in river_lines.columns]
    river_lines = river_lines[available_cols]
    
    output_path = os.path.join(_REPO_ROOT, "public", "geo", "rivers_citarum.geojson")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    river_lines.to_file(output_path, driver='GeoJSON')
    
    print(f"✅ Successfully saved {len(river_lines)} lines to {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")

except Exception as e:
    print(f"❌ Error: {e}")
    print("\nReminder: This script requires internet access to reach OSM.")
