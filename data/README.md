# Raw geographic inputs (optional)

Use this folder for **source** assets that are not served directly by the app (for example shapefiles used to build GeoJSON offline).

- Generated web assets live in `public/geo/` (rivers GeoJSON, flood-risk raster).
- To refresh river lines from OpenStreetMap (Bandung Raya), run from the repo root:

```bash
python3 scripts/extract_rivers.py
```

Large binaries under `data/raw/` are ignored by Git unless you add an exception; see the root `.gitignore`.
