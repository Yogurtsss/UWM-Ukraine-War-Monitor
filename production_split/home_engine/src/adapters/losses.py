import asyncio
from typing import List, Dict, Any
from .base import BaseAdapter, logger

class OryxLossesAdapter(BaseAdapter):
    """
    Adapter #9: Equipment Losses (Oryx via GitHub Dataset)
    Frequency: Hourly (3600 seconds)
    """
    def __init__(self):
        super().__init__(name="Oryx Losses", frequency_seconds=3600)
        # Using a reliable community dataset for Oryx losses
        self.url = "https://raw.githubusercontent.com/PetroIvaniuk/2022-Ukraine-Russia-War-Dataset/main/data/equipment_losses_oryx.json"

    async def poll(self) -> List[Dict[str, Any]]:
        """
        Fetch latest equipment losses for RU.
        """
        data_ru = await self.fetch_json(self.url)
        # Skip UA for now or include both
        if not data_ru:
            return []

        # Example structure: list of categories
        events = []
        total_destroyed = sum(int(item.get("Destroyed", 0)) for item in data_ru)
        
        # Represented as a summary event
        normalized = self.normalize(data_ru[0])
        normalized.update({
            "type": "equipment_loss_summary",
            "country": "Russia",
            "content": f"Total Russian equipment losses confirmed by Oryx: {total_destroyed} items.",
            "timestamp": "Latest" # or fetch from commit date
        })
        events.append(normalized)
        
        return events
