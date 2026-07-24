from typing import Optional
from pydantic import BaseModel


class SettingsInfo(BaseModel):
    login_type: str
    user_name: str
    rate_limit: str
    user_rate_limit: str
    ad_client: str = ""
    ad_slot: str = ""
    enable_login: bool = False
    google_client_id: str = ""
    enable_rate_limit: bool = False
    default_api_base: str = ""
    default_model: str = ""
    purchase_url: str = ""
    subscription_status: str = "none"
    subscription_plan: Optional[str] = None
    subscription_end: Optional[str] = None
    subscription_billing_type: Optional[str] = None
    subscription_auto_renew: bool = False
    subscription_scheduled_auto_renew: bool = False
    subscription_scheduled_plan: Optional[str] = None
    subscription_scheduled_start: Optional[str] = None
    daily_usage: int = 0
    daily_limit: int = 0
    daily_remaining: int = 0


class OauthBody(BaseModel):
    login_type: str
    code: Optional[str]


class User(BaseModel):
    user_id: int
    login_type: str
    user_name: str
    expire_at: float

