import asyncio
import uuid
from typing import List, Dict, Any
from datetime import datetime
import json
import httpx
from bs4 import BeautifulSoup
from src.adapters.base import BaseAdapter

class TelegramOSINTAdapter(BaseAdapter):
    """
    Adapter #6: Telegram OSINT (Public Channels)
    Scrapes public Telegram channel web previews (t.me/s/...) to avoid API limits.
    """
    def __init__(self, channels: List[str]):
        # e.g. ["nexta_live", "ukraine_now_eng", "astrapress"]
        super().__init__(name="Telegram OSINT", frequency_seconds=120)
        self.channels = channels
        # Need a real user agent to trick Telegram
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }

    async def fetch_channel(self, channel: str) -> List[Dict[str, Any]]:
        events = []
        try:
            url = f"https://t.me/s/{channel}"
            async with httpx.AsyncClient(headers=self.headers, timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return events
                
                soup = BeautifulSoup(resp.text, 'html.parser')
                messages = soup.find_all('div', class_='tgme_widget_message')
                
                # Take the last 15 messages
                for msg in messages[-15:]:
                    text_div = msg.find('div', class_='tgme_widget_message_text')
                    time_div = msg.find('time')
                    
                    if not text_div: continue
                    
                    content = text_div.get_text(separator=' ', strip=True)
                    timestamp = time_div.get('datetime', datetime.utcnow().isoformat()) if time_div else datetime.utcnow().isoformat()
                    
                    # Generate a unique ID based on the specific message link if available
                    link = msg.get('data-post', f"telegram/{channel}/{uuid.uuid4().hex[:8]}")
                    
                    events.append({
                        "id": f"tg_{link.replace('/', '_')}",
                        "source": f"Telegram @{channel}",
                        "content": content,
                        "timestamp": timestamp,
                        "type": "social_post",
                        "raw_data": {
                            "channel": channel,
                            "post_id": link
                        }
                    })
        except Exception as e:
            pass # Swallow silent failures for scraping
        return events

    async def poll(self) -> List[Dict[str, Any]]:
        all_events = []
        # Gather all channels concurrently
        tasks = [self.fetch_channel(ch) for ch in self.channels]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if isinstance(res, list):
                all_events.extend(res)
                
        return all_events
