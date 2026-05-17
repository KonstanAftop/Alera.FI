import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = BASE_DIR.parent

# Supabase configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Telegram configuration
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")

# Geospatial data paths
GEOJSON_PATH = REPO_ROOT / "public" / "geo" / "rivers_bandung.geojson"
TIFF_PATH = REPO_ROOT / "public" / "geo" / "flood_risk.tiff"

# Server configuration
HOST = "0.0.0.0"
PORT = 8005
