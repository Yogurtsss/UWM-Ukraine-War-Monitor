# AI_CONTEXT.md - UWM Ukraine War Monitor
**קובץ זה חייב להיקרא ראשון בכל סשן עבודה על הפרויקט!**

## שם הפרויקט
UWM – Ukraine War Monitor (Russia-Ukraine OSINT Real-Time Dashboard)

## מטרת הפרויקט
לוח בקרה בזמן אמת מבוסס OSINT לניטור מלחמת רוסיה-אוקראינה, בדיוק כמו IWM (Iran War Monitor) אבל מותאם לאוקראינה.  
כל הנתונים ציבוריים 100% – אסור להשתמש במידע מסווג.

## LLM Router – חובה להקפיד על זה!
- **Preferred Provider (ברירת מחדל)**: Groq
- **מודל ראשי**: llama-3.3-70b-versatile
- **מודל fallback בגרויק**: llama-3.1-8b-instant
- **ספק משני לעתיד**: Anthropic (Claude 3.5 Sonnet / Opus) – **אל תמחק אותו!** הוא נשאר כ-secondary provider.
- **Fallback אחרון**: Ollama (לוקאלי)
- ה-Router חייב להיות גמיש ומודולרי.

## מבנה הפרויקט (חשוב)
- `docs/documentation.md` – תיעוד מלא
- `spec/specification.md` – מפרט דרישות + 22 אדפטורים מפורטים
- `design/architecture.md` – ארכיטקטורה (FastAPI + Next.js + MapLibre GL + Celery)
- `project-manifest.md` – מניפסט
- `AI_CONTEXT.md` + `PROJECT_STATUS.md` ← אתה כאן
- `src/adapters/` – 22 אדפטורים (כל אחד קובץ נפרד)
- `src/pipeline/` – עיבוד + deduplication + AI enrichment
- `src/ai/` – LLM Router
- Frontend: Next.js 15 + MapLibre GL + shadcn/ui

## כללי עבודה מחייבים ל-AI Agent
1. תמיד קרא קודם AI_CONTEXT.md + PROJECT_STATUS.md
2. שמור על קוד נקי, מודולרי, עם טיפוסים (TypeScript/Python typing)
3. כל אדפטור חדש חייב להיות בקובץ נפרד ב-`src/adapters/`
4. השתמש ב-structured output (JSON) בכל קריאה ל-LLM
5. בסוף כל משימה – עדכן את PROJECT_STATUS.md עם:
   - מה נעשה
   - שינויים בקבצים
   - החלטות ארכיטקטוניות
   - סטטוס MVP / Next steps
6. אל תמחק קבצים קיימים – רק שפר/הוסף

## Tech Stack (אל תשנה בלי אישור)
- Backend: Python FastAPI + Celery + Redis
- Frontend: Next.js 15 + MapLibre GL + Tailwind + shadcn
- DB: PostgreSQL + Redis (real-time)
- AI: Groq ראשי + Anthropic secondary + Ollama fallback
- Deployment: Docker Compose

**סוף ההקשר – עכשיו תמשיך עם המשימה שקיבלת.**
