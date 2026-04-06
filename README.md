# UWM – Ukraine War Monitor

🚀 **Live Dashboard:** [https://uwm.up.railway.app](https://uwm.up.railway.app)

Real-time OSINT dashboard for monitoring the Russia-Ukraine war.

## Project Structure
- `docs/`: Documentation
- `spec/`: Specifications
- `design/`: Architecture
- `src/`: Source code
  - `adapters/`: 22 automatic data adapters
  - `pipeline/`: Data processing and AI integration
  - `frontend/`: Next.js 15 map and dashboard
  - `backend/`: FastAPI WebSocket and REST API

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in necessary keys
3. Run with Docker Compose:
   ```bash
   docker compose up -d
   ```

## Features
- Interactive Map (MapLibre GL)
- 22+ Adapters (Air alerts, frontline map, fires, flights, etc.)
- AI processing for translation and classification
- Time Machine for historical event playback
- Real-time threat assessment

For full documentation, see [docs/documentation.md](docs/documentation.md).
