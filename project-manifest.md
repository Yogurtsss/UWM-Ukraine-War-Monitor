# Project Manifest – UWM Ukraine War Monitor

**שם פרויקט**: UWM – Ukraine War Monitor (Russia-Ukraine OSINT Dashboard)
**גרסה**: 1.0.0 MVP
**תאריך**: אפריל 2026
**יוצר**: [שמך]
**מטרה**: אלטרנטיבה open-source מלאה ללוחות בקרה כמו DeepStateMap / Liveuamap עם AI + Time Machine
**רישיון**: MIT (או AGPL-3.0 אם open-source מלא)

## מבנה הפרויקט
- `docs/`                  ← תיעוד
- `spec/`                  ← מפרט
- `design/`                ← ארכיטקטורה
- `src/adapters/`          ← 22 אדפטורים (כל אחד קובץ נפרד)
- `src/pipeline/`          ← עיבוד + AI
- `src/frontend/`          ← Next.js
- `src/backend/`           ← FastAPI

## Tech Stack מלא
- Frontend: Next.js 15 + MapLibre GL
- Backend: FastAPI + Python 3.12
- AI: LangChain + multi-LLM router
- DB: PostgreSQL + Redis
- Deployment: Docker Compose (או Vercel + Railway)

**סטטוס MVP**: כל 22 האדפטורים + מפה + AI + Time Machine

**הערות חשובות**: כל הנתונים **ציבוריים 100%** – אין שום שימוש במידע מסווג או פרטי.
