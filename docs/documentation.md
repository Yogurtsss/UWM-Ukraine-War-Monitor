# תיעוד הפרויקט - UWM – Ukraine War Monitor

## סקירה כללית
לוח בקרה בזמן אמת מבוסס OSINT לניטור מלחמת רוסיה-אוקראינה.  
מאגד נתונים ממאות מקורות ציבוריים, מעבד אותם עם AI, ומציג על מפה אינטראקטיבית + Time Machine + הערכת איום.

### פיצ'רים עיקריים
- מפה אינטראקטיבית (MapLibre GL) עם שכבות: חזית, התראות אוויר, שריפות, טיסות, ספינות, אבדות ציוד
- 22+ אדפטורים אוטומטיים (ראה רשימה מלאה ב-spec)
- עיבוד AI: תרגום (אוקראינית/רוסית/אנגלית), דירוג אמינות, סיכומים, חילוץ מיקומים
- Time Machine – הפעלת אירועים היסטוריים
- הערכת איום בזמן אמת (סיגמואיד + time-decay)
- התראות אוויר רשמיות (Ukraine Alarm API)
- שווקי חיזוי, נתונים כלכליים (נפט, גז, RUB/UAH)

## 22 אדפטורים מלאים (נתונים ציבוריים בלבד)
1. **Ukraine Air Alerts** – https://api.ukrainealarm.com + https://alerts.com.ua (רשמי)
2. **DeepStateMap Frontline** – https://deepstatemap.live (scraping + geolocated data)
3. **Liveuamap Events** – https://liveuamap.com (RSS + scraping)
4. **ACLED Ukraine Conflict** – https://acleddata.com (curated data file)
5. **Eyes on Russia / GeoConfirmed** – https://www.info-res.org (verified media)
6. **NASA FIRMS Fires** – FIRMS API (שריפות מהפגזות)
7. **OpenSky Network ADS-B** – טיסות צבאיות
8. **MarineTraffic / AIS** – ספינות בים השחור (Black Sea Fleet)
9. **USGS Earthquakes** – רעידות
10. **GDELT Global Events** – אירועים גלובליים
11. **RSS News** – Reuters, BBC, Ukrainska Pravda, ISW, TASS, RIA
12. **Telegram Channels** (22 ערוצים מרכזיים – ראה spec)
13. **Russian MOD Reports** – Telegram + RSS
14. **Ukrainian General Staff** – דוחות יומיים
15. **Oryx Equipment Losses** – אבדות רוסיות/אוקראיניות
16. **Polymarket / Manifold** – חיזויים (ניצחון, שלום וכו')
17. **Exchange Rates** – UAH/RUB, נפט Brent
18. **Satellite Imagery** – Sentinel Hub (אופציונלי)
19-22. **Custom OSINT** – WarSpotting, Rybar, Suriyak, DeepState UA Telegram

## התקנה
1. `git clone <repo>`
2. `cp .env.example .env`
3. `docker compose up -d`

### דרישות
- Docker + Docker Compose
- Node.js 20+ / Python 3.12
- API keys: 
  - **Groq** (Primary: Llama 3.3 70B)
  - **Anthropic** (Secondary: Claude 3.5)
  - **Ukraine Alarm API** (רשמי)

## AI LLM Router
המערכת משתמשת בנתב מודלים (Router) מודולרי:
- **Groq** (Default): ביצועים מהירים מאוד עם Llama-3.3-70b.
- **Anthropic**: אפשרות למעבר ל-Claude 3.5 Sonnet לניתוח עמוק יותר.
- **Fallback**: מעבר אוטומטי למודלים קלים יותר (Llama 8B) או Ollama מקומי במקרה של תקלה.

ראה `spec/specification.md` ו-`design/architecture.md` לפרטים טכניים מלאים.
