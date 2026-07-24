from fastapi import HTTPException, status

from .base import CacheClientBase, MetaCacheClient
from src.config import settings


class CacheClientFactory:

    @staticmethod
    def get_client() -> "CacheClientBase":
        client_type = settings.cache_client_type
        if (
            client_type == "memory"
            and settings.upstash_api_url
            and settings.upstash_api_token
        ):
            client_type = "upstash"
        cls = MetaCacheClient.cilent_map.get(client_type)
        if cls is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token client type not supported"
            )
        return cls
