import abc
from typing import List, Dict, Any
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseAdapter(abc.ABC):
    """
    Base class for all 22 UWM adapters.
    """
    def __init__(self, name: str, frequency_seconds: int):
        self.name = name
        self.frequency_seconds = frequency_seconds

    @abc.abstractmethod
    async def poll(self) -> List[Dict[str, Any]]:
        """
        Poll the data source and return a list of normalized events.
        """
        pass

    def normalize(self, raw_data: Any) -> Dict[str, Any]:
        """
        Convert raw data from source to UWM internal format.
        """
        return {
            "source": self.name,
            "raw": raw_data,
            "timestamp": None,  # To be filled by implementation
            "location": None,   # {lat, lon}
            "type": None,       # air_alert, frontline, strike, etc.
            "content": None,
        }

    async def fetch_json(self, url: str, headers: Dict[str, str] = None) -> Any:
        full_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        if headers:
            full_headers.update(headers)
            
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=full_headers, timeout=30)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error fetching from {url}: {e}")
                return None

    async def fetch_text(self, url: str, headers: Dict[str, str] = None) -> str:
        full_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        if headers:
            full_headers.update(headers)
            
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=full_headers, timeout=30)

                response.raise_for_status()
                return response.text
            except Exception as e:
                logger.error(f"Error fetching from {url}: {e}")
                return ""
