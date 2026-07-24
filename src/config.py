import logging
from typing import Tuple

from pydantic import Field
from pydantic_settings import BaseSettings

_logger = logging.getLogger(__name__)


class Settings(BaseSettings):

    # project settings
    project_name: str = "smart-tool-matrix"

    # OpenAI API settings
    api_key: str = Field(default="", exclude=True)
    api_base: str = "https://api.openai.com/v1"
    model: str = "gpt-3.5-turbo"

    # github oauth login settings
    github_client_id: str = ""
    github_client_secret: str = Field(default="", exclude=True)
    jwt_secret: str = Field(default="secret", exclude=True)

    # google oauth login settings
    google_client_id: str = ""

    # google ads settings
    ad_client: str = ""
    ad_slot: str = ""

    # openai settings defaults
    default_api_base: str = "https://api.openai.com/v1"
    default_model: str = "gpt-3.5-turbo"
    purchase_url: str = ""

    # Neon PostgreSQL
    database_url: str = Field(default="", exclude=True, alias="DATABASE_URL")

    # cache settings
    cache_client_type: str = "memory"
    redis_url: str = Field(default="", exclude=True, alias="KV_URL")
    upstash_api_url: str = Field(default="", alias="KV_REST_API_URL")
    upstash_api_token: str = Field(default="", exclude=True, alias="KV_REST_API_TOKEN")

    # rate limit settings
    enable_rate_limit: bool = True
    # rate limit xxx request per xx seconds
    rate_limit: Tuple[int, int] = (60, 60 * 60)
    user_rate_limit: Tuple[int, int] = (600, 60 * 60)

    # image generation settings
    image_api_key: str = Field(default="", exclude=True)
    image_api_base: str = "https://www.packyapi.com/v1"
    image_model: str = "gemini-3.1-flash-image-preview"
    image_quality: str = "high"
    image_output_format: str = "png"

    # PayPal one-time payments and automatic subscriptions
    paypal_client_id: str = Field(default="", exclude=True)
    paypal_client_secret: str = Field(default="", exclude=True)
    paypal_mode: str = "sandbox"
    paypal_webhook_id: str = ""
    paypal_plan_daily: str = ""
    paypal_plan_weekly: str = ""
    paypal_plan_monthly: str = ""
    paypal_plan_yearly: str = ""
    app_url: str = ""

    # subscription settings
    daily_free_limit_guest: int = 3
    daily_free_limit_user: int = 5
    daily_quota_timezone: str = "Asia/Shanghai"

    def get_human_rate_limit(self) -> str:
        max_reqs, time_window_seconds = self.rate_limit
        # convert to human readable format
        return f"{max_reqs}req/{time_window_seconds}seconds"

    def get_human_user_rate_limit(self) -> str:
        max_reqs, time_window_seconds = self.user_rate_limit
        # convert to human readable format
        return f"{max_reqs}req/{time_window_seconds}seconds"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
