# מפרט דרישות – UWM Ukraine War Monitor

## דרישות פונקציונליות
1. איסוף אוטומטי מ-22 אדפטורים (רשימה מלאה למטה)
2. עיבוד: deduplication, geolocation, AI enrichment
3. הצגה על מפה בזמן אמת + Time Machine
4. הערכת איום ל-6 אזורים (Kharkiv, Donetsk, Zaporizhzhia, Kherson, Kyiv, Black Sea)
5. תרגום בזמן אמת (UA/RU/EN/HE)
6. סיכומי AI + דירוג אמינות
7. התראות אוויר + push notifications

## רשימת 22 האדפטורים המלאה (עם מקור מדויק)

| # | שם אדפטור                  | מקור מדויק                                      | סוג          | תדירות     | API / Public |
|---|-----------------------------|--------------------------------------------------|--------------|-------------|--------------|
| 1 | Air Alerts                 | api.ukrainealarm.com + alerts.com.ua            | API         | 30 שניות   | Public      |
| 2 | Frontline Map              | deepstatemap.live                               | Scraping    | 5 דקות     | Public      |
| 3 | Live Events                | liveuamap.com                                   | RSS+Scraping| 1 דקה      | Public      |
| 4 | ACLED Data                 | acleddata.com/curated/data-ukraine              | CSV/API     | יומי       | Public      |
| 5 | Verified Media             | info-res.org (Eyes on Russia)                   | API         | 10 דקות    | Public      |
| 6 | Fires / Strikes            | NASA FIRMS (VIIRS + MODIS)                      | API         | 3 שעות     | Public      |
| 7 | Military Flights           | OpenSky Network ADS-B                           | API         | 10 שניות   | Public      |
| 8 | Black Sea Ships            | MarineTraffic AIS + public feeds                | API         | 1 דקה      | Public      |
| 9 | Earthquakes                | USGS                                            | API         | 1 דקה      | Public      |
|10 | Global Events              | GDELT Project                                   | API         | 15 דקות    | Public      |
|11 | News Feeds                 | Reuters, BBC, Ukrainska Pravda, ISW             | RSS         | 5 דקות     | Public      |
|12 | Telegram OSINT             | @DeepStateUA, @WarTranslated, @rybar, @suriyakmaps, OSINT Пчелы, Cat Eyes OSINT וכו' (22 ערוצים) | Telegram API | 30 שניות | Public      |
|13 | Russian MOD                | Telegram + mil.ru                               | Scraping    | 30 דקות    | Public      |
|14 | Ukrainian General Staff    | mil.gov.ua                                      | RSS/Scraping| 1 שעה      | Public      |
|15 | Equipment Losses           | Oryx + WarSpotting                              | Scraping    | יומי       | Public      |
|16 | Prediction Markets         | Polymarket (Ukraine war)                        | API         | 5 דקות     | Public      |
|17 | Economic Indicators        | USD/UAH, RUB, Brent Oil                         | API         | 5 דקות     | Public      |
|18-22 | Custom OSINT (5 נוספים)   | GeoConfirmed, Sentinel Hub, וכו'               | API/Scraping| משתנה      | Public      |

## דרישות לא-פונקציונליות
- עדכון אירועים: ≤ 30 שניות
- סיכום AI: כל 5 דקות
- 99.9% uptime + fallback LLM
- רק OSINT ציבורי – **אסור** מידע מסווג
