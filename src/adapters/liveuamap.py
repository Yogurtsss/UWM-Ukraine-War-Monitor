import asyncio
from typing import List, Dict, Any
from .base import BaseAdapter, logger


class LiveUAMapAdapter(BaseAdapter):
    """Stub – LiveUAMap blocks automated access. Use GuardianLiveAdapter from news_feeds.py instead."""
    def __init__(self):
        super().__init__(name="LiveUAMap-stub", frequency_seconds=99999)

    async def poll(self) -> List[Dict[str, Any]]:
        return []
