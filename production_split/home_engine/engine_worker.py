import os
import sys
import json
import time
import asyncio
import httpx
import logging
from datetime import datetime
from dotenv import load_dotenv

# Set absolute path for .env to avoid any confusion
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH, override=True)

# LOGGING
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Worker: %(message)s")
logger = logging.getLogger("UWM_Worker")

# CONFIGURATION
RAILWAY_URL = os.getenv("RAILWAY_URL", "").rstrip("/")
INGEST_API_KEY = os.getenv("INGEST_API_KEY", "")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "300"))

if not RAILWAY_URL or "your-app-name" in RAILWAY_URL:
    logger.error("!!! ERROR: RAILWAY_URL is not configured correctly in .env !!!")
    logger.error(f"Current value: {RAILWAY_URL}")
    sys.exit(1)

logger.info(f"UWM Home Engine started.")
logger.info(f"Targeting: {RAILWAY_URL}")

# Import processor after env is loaded
from src.pipeline.processor import EventProcessor

# Initialize adapters list
adapters = []

# Safe dynamic loading of adapters to prevent total crash on single failure
def load_adapters():
    from src.adapters.air_alerts import AirAlertsAdapter
    adapters.append(AirAlertsAdapter())
    
    from src.adapters.frontline import FrontlineAdapter
    adapters.append(FrontlineAdapter())
    
    from src.adapters.deployment import RussianDeploymentAdapter
    adapters.append(RussianDeploymentAdapter())
    
    from src.adapters.news_feeds import GuardianLiveAdapter, APNewsAdapter
    adapters.append(GuardianLiveAdapter())
    adapters.append(APNewsAdapter())
    
    from src.adapters.osint_extra import NASA_FIRMS_Adapter
    adapters.append(NASA_FIRMS_Adapter())
    
    from src.adapters.economic import EconomicAdapter, PolymarketAdapter
    adapters.append(PolymarketAdapter())
    adapters.append(EconomicAdapter())
    
    from src.adapters.energy import RussianEnergyAdapter
    adapters.append(RussianEnergyAdapter())
    
    from src.adapters.strategic import RussianStrategicAdapter
    adapters.append(RussianStrategicAdapter())
    
    from src.adapters.telegram import TelegramOSINTAdapter
    adapters.append(TelegramOSINTAdapter(channels=["nexta_live", "UkraineNow", "astrapress", "uniannet"]))

try:
    load_adapters()
except Exception as e:
    logger.error(f"Error loading one or more adapters: {e}")

processor = EventProcessor()

async def run_once():
    """Run one pass of all adapters and push results."""
    all_events = []
    frontline_geojson = None
    
    for adapter in adapters:
        try:
            logger.info(f"Polling {adapter.name}...")
            if hasattr(adapter, 'poll'):
                events = await adapter.poll()
            else:
                raw_data = await adapter.fetch()
                events = adapter.process(raw_data)
            
            # Special case for frontline GeoJSON to sync with cloud
            if adapter.name == "DeepState Frontline" and hasattr(adapter, 'get_raw_geojson'):
                frontline_geojson = await adapter.get_raw_geojson()

            # 2. Enrich with AI (Parallelized)
            enriched = []
            if events:
                tasks = [processor.enrich_event(ev) for ev in events]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for i, res in enumerate(results):
                    if isinstance(res, Exception):
                        if "401" in str(res):
                            logger.warning(f"AI Provider returned 401. Switching to raw ingestion.")
                            enriched.extend(events[i:]) # Add remaining as raw
                            break
                        enriched.append(events[i])
                    else:
                        enriched.append(res)
            
            all_events.extend(enriched)
        except Exception as e:
            logger.error(f"Error in {adapter.name}: {e}")

    # 3. Push to Cloud
    async with httpx.AsyncClient(timeout=30.0) as client:
        if all_events:
            logger.info(f"Worker: Pushing {len(all_events)} enriched events to {RAILWAY_URL}...")
            try:
                resp = await client.post(
                    f"{RAILWAY_URL}/api/ingest",
                    json={"events": all_events},
                    headers={"x-api-key": INGEST_API_KEY}
                )
                if resp.status_code == 200:
                    logger.info(f"Worker: Successfully pushed {len(all_events)} events to Cloud.")
                else:
                    logger.error(f"Worker: Failed to push to Cloud: {resp.status_code} - {resp.text}")
            except Exception as e:
                logger.error(f"Worker: Error during push: {e}")
        
        if frontline_geojson:
            logger.info(f"Worker: Pushing frontline GeoJSON to {RAILWAY_URL}...")
            try:
                resp = await client.post(
                    f"{RAILWAY_URL}/api/ingest/map",
                    json={"geojson": frontline_geojson},
                    headers={"x-api-key": INGEST_API_KEY}
                )
                if resp.status_code == 200:
                    logger.info(f"Worker: Successfully pushed frontline GeoJSON.")
                else:
                    logger.error(f"Worker: Map push failed: {resp.status_code}")
            except Exception as e:
                logger.error(f"Worker: Map push error: {e}")

async def main():
    while True:
        await run_once()
        logger.info(f"Sleeping for {POLL_INTERVAL} seconds...")
        await asyncio.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    asyncio.run(main())
