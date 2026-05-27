"""Telegram message templates for community channels."""

PLATFORM_NAME = "Alera FI"
PLATFORM_NAME_UPPER = "ALERA FI"


def display_community_name(row: dict) -> str:
    name = (row.get("community_name") or "").strip()
    return name or PLATFORM_NAME


def escape_telegram_markdown(text: str) -> str:
    if not text:
        return ""
    for char in ("\\", "_", "*", "`", "["):
        text = text.replace(char, f"\\{char}")
    return text


def format_broadcast_message(row: dict, message: str) -> str:
    community = escape_telegram_markdown(display_community_name(row))
    header = f"📢 *{PLATFORM_NAME_UPPER} — {community}*"
    return f"{header}\n\n{message}"


def format_test_message(row: dict) -> str:
    community = escape_telegram_markdown(display_community_name(row))
    group_title = row.get("telegram_group_title")
    group_id = row.get("telegram_group_id")
    group_label = group_title or (f"Grup {group_id}" if group_id else "Unknown Group")
    group_label = escape_telegram_markdown(str(group_label))
    return (
        f"🔔 *Test notifikasi — {PLATFORM_NAME_UPPER}*\n\n"
        f"Komunitas: *{community}*\n"
        f"Grup: {group_label}\n\n"
        "Koneksi Telegram berhasil. Grup ini siap menerima peringatan dini "
        "dan broadcast dari dashboard komunitas Anda."
    )
