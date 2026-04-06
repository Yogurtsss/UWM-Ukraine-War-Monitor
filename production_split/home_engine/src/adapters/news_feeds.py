import asyncio
import os
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
from .base import BaseAdapter, logger


class GuardianLiveAdapter(BaseAdapter):
    """
    Adapter #3: The Guardian Ukraine live updates RSS
    Free, no auth, updates every few minutes with battlefield reports.
    """
    def __init__(self):
        super().__init__(name="Guardian Live", frequency_seconds=300)
        self.url = "https://www.theguardian.com/world/ukraine/rss"

    async def poll(self) -> List[Dict[str, Any]]:
        xml_data = await self.fetch_text(self.url)
        if not xml_data:
            return []
        try:
            root = ET.fromstring(xml_data)
            items = root.findall(".//item")
            events = []
            for item in items[:8]:
                title_el = item.find("title")
                desc_el = item.find("description")
                date_el = item.find("pubDate")
                if title_el is None:
                    continue
                title = title_el.text or ""
                desc = (desc_el.text or "").replace("<![CDATA[", "").replace("]]>", "").strip()
                normalized = self.normalize({"title": title})
                normalized.update({
                    "id": f"guardian-{hash(title)}",
                    "type": "news",
                    "content": f"{title}. {desc[:120]}".strip(),
                    "timestamp": date_el.text if date_el is not None else "Recent",
                })
                events.append(normalized)
            logger.info(f"[Guardian] Fetched {len(events)} live articles.")
            return events
        except Exception as e:
            logger.error(f"[Guardian] Parse error: {e}")
            return []


class APNewsAdapter(BaseAdapter):
    """
    Adapter #4: AP News Russia-Ukraine Hub RSS
    Reliable wire-service breaking news.
    """
    def __init__(self):
        super().__init__(name="AP News", frequency_seconds=300)
        self.url = "https://apnews.com/hub/russia-ukraine?rss=1"

    async def poll(self) -> List[Dict[str, Any]]:
        xml_data = await self.fetch_text(self.url)
        if not xml_data:
            return []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(xml_data, "html.parser")
            items = soup.find_all("item")
            events = []
            for item in items[:25]:
                title = item.find("title").text.strip() if item.find("title") else ""
                desc = item.find("description").text.strip() if item.find("description") else ""
                pub_date = item.find("pubdate").text.strip() if item.find("pubdate") else "Recent"
                
                normalized = self.normalize({"title": title})
                normalized.update({
                    "id": f"ap-{hash(title)}",
                    "type": "news",
                    "content": f"{title}. {desc[:100]}".strip(),
                    "timestamp": pub_date,
                })
                events.append(normalized)
            logger.info(f"[AP News] Fetched {len(events)} articles.")
            return events
        except Exception as e:
            logger.error(f"[AP News] Parse error: {e}")
            return []


