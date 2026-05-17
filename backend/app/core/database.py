from supabase import create_client, Client
from telegram import Bot
from app.core.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, TELEGRAM_BOT_TOKEN

# Supabase client
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    print("Warning: Supabase credentials missing in .env")

# Telegram bot client
telegram_bot: Bot | None = None
if TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_TOKEN != "your_bot_token_from_botfather":
    telegram_bot = Bot(token=TELEGRAM_BOT_TOKEN)
else:
    print("Warning: TELEGRAM_BOT_TOKEN not configured in .env")


def get_supabase() -> Client:
    """Get Supabase client, raising error if not configured."""
    if supabase is None:
        raise RuntimeError("Supabase client not configured")
    return supabase


def get_telegram_bot() -> Bot:
    """Get Telegram bot, raising error if not configured."""
    if telegram_bot is None:
        raise RuntimeError("Telegram bot not configured")
    return telegram_bot
