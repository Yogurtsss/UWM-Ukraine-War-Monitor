import asyncio
import os
import aiohttp
from typing import List, Dict, Any
from .base import BaseAdapter, logger


class FrontlineAdapter(BaseAdapter):
    """
    Adapter #2: Ukraine Frontline from DeepState community dataset.
    Source: cyterat/deepstate-map-data on GitHub — Updated daily.
    Returns the GeoJSON URL for direct use by the Frontend MapComponent.
    The Backend broadcasts metadata; the Frontend renders the GeoJSON directly.
    """
    def __init__(self):
        super().__init__(name="DeepState Frontline", frequency_seconds=3600)  # hourly
        # The official API is the most accurate and contains granular property metadata
        self.official_api_url = "https://deepstatemap.live/api/history/last"
        # We still keep a fallback if needed, but the frontend will now proxy through us
        self.geojson_url = self.official_api_url

    async def get_raw_geojson(self) -> Dict[str, Any]:
        """Fetches the latest official map data from DeepState API."""
        try:
            async with aiohttp.ClientSession() as session:
                # Add a realistic User-Agent to avoid blocks
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
                async with session.get(self.official_api_url, headers=headers, timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        # DeepState API wraps the FeatureCollection in a "map" key
                        return data.get("map", {})
                    else:
                        logger.error(f"[Frontline] Official API error: {resp.status}")
                        return {}
        except Exception as e:
            logger.error(f"[Frontline] Failed to fetch raw map: {e}")
            return {}

    async def poll(self) -> List[Dict[str, Any]]:
        """
        Probe the official endpoint and return metadata.
        """
        data = await self.get_raw_geojson()
        if not data:
            logger.warning("[Frontline] Could not reach official DeepState API. Map will use fallback.")
            return []

        feature_count = len(data.get("features", []))
        logger.info(f"[Frontline] DeepState Official API OK – {feature_count} features.")

        return [{
            "id": "frontline-latest",
            "type": "frontline_update",
            "source": self.name,
            "content": f"Frontline updated: {feature_count} high-fidelity features from official API.",
            "timestamp": "Now",
            "credibility": 98,
            "geojson_url": "/api/map/frontline.json", # New proxy endpoint
        }]
