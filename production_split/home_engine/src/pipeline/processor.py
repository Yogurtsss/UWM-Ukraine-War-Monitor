import os
import asyncio
from typing import List, Dict, Any, Optional
from src.pipeline.ai_router import AIRouter
import json
import logging

logger = logging.getLogger(__name__)

class EventProcessor:
    """
    Core Pipeline Processor for UWM events.
    Responsible for:
    - AI Enrichment (translation, classification) via Groq
    - Global Rate Limiting to avoid TPM limits
    """
    def __init__(self):
        self.router = AIRouter()
        # Global semaphore to prevent TPM limits on Groq free tier
        self.semaphore = asyncio.Semaphore(1)

    async def process_batch(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process events through the pipeline sequentially to avoid flooding AI."""
        results = []
        for event in events:
            try:
                enriched = await self.enrich_event(event)
                results.append(enriched)
            except Exception as e:
                logger.warning(f"Enrichment failed: {e}")
                results.append(event)
        return results

    async def enrich_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI to translate and classify the event with global rate limiting."""
        # We now ALLOW enrichment even if lat/lon exist, to ensure multi-lang translations are added
        content = event.get("content", "")
        if not content:
            return event
            
        # Skip AI enrichment for high-fidelity tactical markers that are already categorized
        if event.get("type") in ["energy_infrastructure", "air_base", "naval_base", "nuclear_site", "missile_infrastructure", "power_plant", "radar_station", "command_center"]:
            return event
            
        # If we already have translations for the CURRENT language set, we COULD skip, 
        if event.get("translation_ru") and event.get("translation_ua"):
            return event
            
        async with self.semaphore:
            try:
                llm = self.router.get_model()
                from langchain_core.messages import HumanMessage
                
                # Multi-language enrichment prompt
                prompt = f"""
                Analyze tactical Ukraine-Russia data and translate to EN, RU, UA:
                "{content}"
                
                Respond ONLY with a valid stringified JSON object. Avoid single quotes for keys.
                Structure:
                {{
                  "translation_en": "Summarized English text (max 200 chars)",
                  "translation_ru": "Russian text",
                  "translation_ua": "Ukrainian text",
                  "classification": "air_alert/combat/strike/deployment/news/social_post",
                  "lat": 0.0,
                  "lon": 0.0,
                  "location_name": "City name"
                }}
                """

                # Safe cooldown for TPM limits (6000 TPM is very low)
                await asyncio.sleep(2.0)
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                
                text = response.content.strip()
                import re
                
                # Resilient fallback regex extraction for all 3 languages
                type_match = re.search(r'"classification"\s*:\s*"([^"]+)"', text)
                trans_en = re.search(r'"translation_en"\s*:\s*"([^"]+)"', text)
                trans_ru = re.search(r'"translation_ru"\s*:\s*"([^"]+)"', text)
                trans_ua = re.search(r'"translation_ua"\s*:\s*"([^"]+)"', text)
                lat_match = re.search(r'"lat"\s*:\s*([-\d.]+)', text)
                lon_match = re.search(r'"lon"\s*:\s*([-\d.]+)', text)
                loc_name_match = re.search(r'"location_name"\s*:\s*"([^"]+)"', text)

                if type_match: event["type"] = type_match.group(1)
                if trans_en: event["translation_en"] = trans_en.group(1)
                if trans_ru: event["translation_ru"] = trans_ru.group(1)
                if trans_ua: event["translation_ua"] = trans_ua.group(1)
                
                # Only use valid coordinates
                if lat_match and lon_match:
                    try:
                        lat, lon = float(lat_match.group(1)), float(lon_match.group(1))
                        if lat != 0.0 and lon != 0.0:
                            event["lat"] = lat
                            event["lon"] = lon
                    except: pass
                    
                if loc_name_match: event["location_name"] = loc_name_match.group(1)
                
            except Exception as e:
                logger.warning(f"AI multi-lang enrichment parsing skipped: {e}")
                
        return event
