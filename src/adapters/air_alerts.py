import os
import asyncio
from typing import List, Dict, Any
from .base import BaseAdapter, logger

class AirAlertsAdapter(BaseAdapter):
    """
    Adapter #1: Ukraine Air Alerts (api.ukrainealarm.com)
    Frequency: 30 seconds
    """
    def __init__(self):
        super().__init__(name="Air Alerts", frequency_seconds=30)
        self.api_key = os.getenv("UKRAINE_ALARM_API_KEY")
        self.base_url = "https://api.ukrainealarm.com/api/v3"

    async def poll(self) -> List[Dict[str, Any]]:
        """
        Fetch current active alerts from the API.
        """
        if not self.api_key:
            logger.warning("No UKRAINE_ALARM_API_KEY found in environment.")
            return []

        headers = {"Authorization": f"{self.api_key}"}
        # https://api.ukrainealarm.com/api/v3/alerts
        data = await self.fetch_json(f"{self.base_url}/alerts", headers=headers)
        
        if not data:
            return []

        events = []
        for region in data:
            region_name = region.get("regionName")
            active_alerts = region.get("activeAlerts", [])
            
            for alert in active_alerts:
                normalized = self.normalize(alert)
                normalized.update({
                    "type": "air_alert",
                    "region": region_name,
                    "alert_type": alert.get("type"),
                    "last_update": alert.get("lastUpdate"),
                    "content": f"Air Alert in {region_name} ({alert.get('type')})",
                })
                events.append(normalized)
        
        return events

# Small test block
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    adapter = AirAlertsAdapter()
    asyncio.run(adapter.poll())
