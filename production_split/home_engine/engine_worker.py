import asyncio
import logging
import httpx
import json
import os
from datetime import datetime
from typing import List, Dict, Any

# Import all adapters from the local src/adapters folder
from src.adapters.air_alerts import AirAlertsAdapter
from src.adapters.frontline import FrontlineAdapter
from src.adapters.news_feeds import GuardianLiveAdapter, APNewsAdapter
from src.adapters.osint_extra import NASA_FIRMS_Adapter
from src.adapters.economic import PolymarketAdapter, EconomicAdapter
from src.adapters.telegram import TelegramOSINTAdapter
from src.adapters.deployment import RussianDeploymentAdapter
from src.adapters.stats import StatsAdapter
from src.adapters.energy import RussianEnergyAdapter
from src.adapters.strategic import RussianStrategicAdapter
from src.pipeline.processor import EventProcessor

# Logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Worker: %(message)s")
logger = logging.getLogger("UWM_Worker")

# CONFIGURATION (Set these in .env or system environment)
RAILWAY_URL = os.getenv("RAILWAY_URL", "https://your-app-name.up.railway.app")
INGEST_API_KEY = os.getenv("INGEST_API_KEY", "uwm_default_secret_key_change_me")
POLL_INTERVAL = 300 # 5 Minutes

processor = EventProcessor()
adapters = [
    AirAlertsAdapter(),
    FrontlineAdapter(),
    RussianDeploymentAdapter(),
    GuardianLiveAdapter(),
    APNewsAdapter(),
    NASA_FIRMS_Adapter(),
    PolymarketAdapter(),
    EconomicAdapter(),
    RussianEnergyAdapter(),
    RussianStrategicAdapter(),
    TelegramOSINTAdapter([
        "kpszsu", "war_monitor", "KyivIndependent_official", "noel_reports", 
        "DeepStateUA", "operativnoZSU", "UkraineAlarmSignal", "DIUkraine",
        "Kyivpost_official", "ButusovPlus"
    ]),
]

async def push_to_railway(source: str, events: List[Dict[str, Any]]):
    """Securely push processed events to the cloud relay."""
    endpoint = f"{RAILWAY_URL.rstrip('/')}/api/ingest"
    headers = {"X-API-KEY": INGEST_API_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(endpoint, json={"source": source, "events": events}, headers=headers)
            if response.status_code == 200:
                logger.info(f"Successfully pushed {len(events)} events from {source} to Railway.")
            else:
                logger.error(f"Failed to push to Railway. HTTP {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error connecting to Railway server: {e}")

async def poll_and_process(adapter):
    """The main worker logic: Scrape -> Process -> PUSH!"""
    try:
        logger.info(f"Polling {adapter.name}...")
        raw_events = await adapter.poll()
        
        if not raw_events: return
        
        # CPU/AI Intensive part (Heavy lifting happens here at home!)
        processed = await processor.process_batch(raw_events)
        
        if processed:
            # We only send NEW events to avoid bandwidth waste
            # (In a more advanced version, we'd check a local cache first)
            await push_to_railway(adapter.name, processed)
            
    except Exception as e:
        logger.error(f"Poll cycle failed for '{adapter.name}': {e}")

async def main_loop():
    logger.info("UWM Home Engine started.")
    logger.info(f"Targeting: {RAILWAY_URL}")
    
    while True:
        start_time = datetime.now()
        
        # Run all scrapers in parallel
        await asyncio.gather(*[poll_and_process(a) for a in adapters], return_exceptions=True)
        
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"Cycle completed in {elapsed:.2f}s. Sleeping for {POLL_INTERVAL}s...")
        await asyncio.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    asyncio.run(main_loop())
