from typing import List, Optional
from pydantic import BaseModel


class CompleteRegistrationRequest(BaseModel):
    user_id: str
    email: str
    role: str
    full_name: str
    # Personal fields
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    elevation: Optional[float] = None
    risk_profile: Optional[str] = None
    river_distance: Optional[float] = None
    # Community fields
    telegram_group_id: Optional[str] = None
    # Subscriptions
    selected_pos_ids: List[str] = []
    instruments: List[dict] = []


class ProfileUpdateRequest(BaseModel):
    user_id: str
    role: str
    full_name: str
    email: str
    selected_pos_ids: List[str] = []
    instruments: List[dict] = []
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
