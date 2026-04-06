# 🚀 UWM Railway Deployment Guide

To get the best performance (WebSockets, real-time alerts, and stability), it is highly recommended to deploy UWM as **two separate services** on Railway from the same GitHub repository.

## 1. Backend Service (FastAPI)
*   **Repo:** `Yogurtsss/UWM-Ukraine-War-Monitor`
*   **Root Directory:** `/` (Keep as is)
*   **Start Command:** `PYTHONPATH=. venv/bin/python3 -m uvicorn src.backend.main:app --host 0.0.0.0 --port ${PORT}`
*   **Environment Variables:**
    *   Add all keys from your `.env` (GROQ, POSTGRES, etc.)
    *   Railway will automatically provide `PORT`.

## 2. Frontend Service (Next.js)
*   **Repo:** `Yogurtsss/UWM-Ukraine-War-Monitor`
*   **Root Directory:** `/src/frontend`
*   **Build Command:** `npm install --legacy-peer-deps && npm run build`
*   **Start Command:** `npm start -- -p ${PORT}`
*   **Environment Variables:**
    *   `NEXT_PUBLIC_BACKEND_URL`: Set this to the public URL of your **Backend Service** (e.g., `https://your-api.up.railway.app`). 
    *   *Note: This is critical for WebSockets to connect correctly.*

## 💡 Why this way?
1.  **Scale:** You can give more CPU to the Backend for AI processing without slowing down the Map.
2.  **WebSockets:** Standard proxies often fail in monorepo setups; separate domains work perfectly 100% of the time.
3.  **Stability:** If the AI process hits a rate limit, the dashboard UI stays alive and responsive.
