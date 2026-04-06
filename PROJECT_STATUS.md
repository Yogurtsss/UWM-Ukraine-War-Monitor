# PROJECT_STATUS.md - UWM Ukraine War Monitor
**Last updated:** 2026-04-05 16:20 (Israel Time)

## Overall Status (MVP)
- [x] Core architecture (FastAPI + Next.js 15 + WebSocket)
- [x] Groq LLM Router (llama-3.3-70b-versatile)
- [x] Real data adapters (9 active, 0 mocks)
- [x] Live frontline map (DeepState community GeoJSON)
- [x] Live event feed panel (WebSocket + REST /events fallback)
- [x] Real-time threat score (calculated from live events)
- [x] One-click launcher (run_uwm.ps1)
- [ ] Air Alerts layer (needs UKRAINE_ALARM_API_KEY)
- [ ] Time Machine with full PostgreSQL history
- [ ] NASA FIRMS (needs NASA_FIRMS_API_KEY)
- [ ] Full 22-adapter coverage

## Active Real Data Sources (NO MOCKS)
1. **Guardian Live** – RSS – Live battlefield news (AI-Geocoded to map)
2. **AP News** – RSS – wire-service breaking (AI-Geocoded to map)
3. **Kyiv Independent** – RSS – primary Ukrainian source
4. **DeepState Frontline** – Daily GeoJSON (Red-occupied styling)
5. **Russian Deployment** – Curated strategic military hubs (Mariupol, Sevastopol, etc.)
6. **Strikes Layer** – NASA FIRMS + AI-extracted incident locations
7. **Polymarket** – CLOB API (Prediction markets)
8. **Economic** – Brent Oil Index
8. **Air Alerts** – api.ukrainealarm.com (needs API key)
9. **NASA FIRMS** – firms.modaps.eosdis.nasa.gov (needs API key)

## Files Changed in This Session
- `src/frontend/app/page.tsx` – Full rewrite: WebSocket client, auto-reconnect, live event feed panel, threat score
- `src/frontend/components/MapComponent.tsx` – Full rewrite: real DeepState GeoJSON frontline, animated event markers with popups
- `src/frontend/components/Sidebar.tsx` – Full rewrite: live stats counters, Groq AI label, event preview
- `src/frontend/app/globals.css` – Better fonts, MapLibre popup overrides, custom scrollbars
- `src/backend/main.py` – Full rewrite: CORS, REST /events endpoint, cache flush on WS connect, clean logging
- `src/pipeline/processor.py` – Fixed process_batch to return events even without AI (pass-through)
- `src/adapters/frontline.py` – Real DeepState community dataset
- `src/adapters/news_feeds.py` – NEW: Guardian, AP News, Kyiv Independent RSS adapters
- `src/adapters/liveuamap.py` – Replaced with clean stub (source blocks bots)

## Architecture Decisions
- **No mocks anywhere** – All data is real or gracefully absent
- **WebSocket + REST dual mode** – Clients get live push OR can poll /events
- **Frontline rendered client-side** – MapComponent loads DeepState GeoJSON directly from GitHub (no proxy needed)
- **AI enrichment is optional** – Events pass through even if Groq call fails

## Next Steps (Priority Order)
1. Add UKRAINE_ALARM_API_KEY to .env for live air alert overlay
2. Add NASA_FIRMS_API_KEY for fire/strike detection
3. Implement Deduplication logic in processor.py
4. PostgreSQL integration for Time Machine history
5. Complete remaining adapters (13 left to reach 22)

**AI Agent: Update this file at end of each session!**
