from typing import List, Dict, Any
from .base import BaseAdapter
from datetime import datetime

class RussianStrategicAdapter(BaseAdapter):
    """
    Adapter for Russian Strategic Infrastructure: Air Bases, Naval Bases, Nuclear Sites, ICBMs.
    """
    def __init__(self):
        super().__init__(name="Russian Strategic Assets", frequency_seconds=86400)
        
        self.air_bases = [
            {"name": "Engels air base", "name_ru": "Авиабаза Энгельс", "lat": 51.484, "lon": 46.210, "desc": "Tu-95, Tu-160 Strats"},
            {"name": "Olenya air base", "name_ru": "Авиабаза Оленья", "lat": 68.148, "lon": 33.459, "desc": "Strategic Bombers"},
            {"name": "Ukrainka air base", "name_ru": "Авиабаза Украинка", "lat": 51.164, "lon": 128.443, "desc": "Strategic Bombers"},
            {"name": "Kubinka air base", "name_ru": "Авиабаза Кубинка", "lat": 55.608, "lon": 36.655, "desc": "Tactical/Airshow"},
            {"name": "Dyagilevo air base", "name_ru": "Авиабаза Дягилево", "lat": 54.645, "lon": 39.564, "desc": "Air Reserve"},
            {"name": "Chkalovskiy air base", "name_ru": "Аэродром Чкаловский", "lat": 55.879, "lon": 38.064, "desc": "Moscow Support"},
            {"name": "Severomorsk-1", "name_ru": "Североморск-1", "lat": 69.020, "lon": 33.436, "desc": "Northern Fleet Air"},
            {"name": "Nagurskoye", "name_ru": "Нагурское", "lat": 80.802, "lon": 47.665, "desc": "Arctic Base"},
            {"name": "Monchegorsk air base", "name_ru": "Авиабаза Мончегорск", "lat": 67.985, "lon": 33.012, "desc": "Fighters/Interceptors"},
            {"name": "Chernyakhovsk", "name_ru": "Черняховск", "lat": 54.599, "lon": 21.781, "desc": "Kaliningrad HQ"},
            {"name": "Seshcha air base", "name_ru": "Авиабаза Сеща", "lat": 53.716, "lon": 33.343, "desc": "Transports"},
            {"name": "Lipetsk-2", "name_ru": "Липецк-2", "lat": 52.643, "lon": 39.439, "desc": "Training Center"},
            {"name": "Pskov air base", "lat": 57.773, "lon": 28.391, "name_ru": "Аэродром Псков", "desc": "VDV Support"},
        ]
        
        self.naval_bases = [
            {"name": "Severomorsk", "name_ru": "Североморск", "lat": 69.083, "lon": 33.421, "desc": "Northern Fleet HQ"},
            {"name": "Gadzhiyevo", "name_ru": "Гаджиево", "lat": 69.261, "lon": 33.315, "desc": "Nuclear Subs"},
            {"name": "Baltiysk", "name_ru": "Балтийск", "lat": 54.642, "lon": 19.916, "desc": "Baltic Fleet HQ"},
            {"name": "Novorossiysk", "name_ru": "Новороссийск", "lat": 44.717, "lon": 37.832, "desc": "Black Sea Port"},
            {"name": "Sevastopol", "name_ru": "Севастополь", "lat": 44.615, "lon": 33.509, "desc": "Black Sea Fleet HQ"},
            {"name": "Vladivostok", "name_ru": "Владивосток", "lat": 43.073, "lon": 131.933, "desc": "Pacific Fleet HQ"},
            {"name": "Tartus", "name_ru": "Тартус", "lat": 34.908, "lon": 35.872, "desc": "Syria Logistics Hub"},
        ]
        
        self.nuclear_sites = [
            {"name": "Sarov VNIIEF", "name_ru": "Саров ВНИИЭФ", "lat": 54.92, "lon": 43.33, "desc": "Weapon R&D (Research)"},
            {"name": "Balakovo Plant", "name_ru": "Балаковская АЭС", "lat": 52.091, "lon": 47.955, "desc": "Power Station"},
            {"name": "Leningrad Plant", "name_ru": "Ленинградская АЭС", "lat": 59.852, "lon": 29.048, "desc": "Power Station"},
            {"name": "Kursk Plant", "name_ru": "Курская АЭС", "lat": 51.676, "lon": 35.606, "desc": "Power Station"},
        ]
        
        self.missile_assets = [
            {"name": "Kozelsk ICBM Base", "name_ru": "Козельск РВСН", "lat": 54.029, "lon": 35.795, "desc": "SS-19 Base"},
            {"name": "Tatishchevo ICBM Base", "name_ru": "Татищево РВСН", "lat": 51.700, "lon": 45.500, "desc": "SS-27 Base"},
            {"name": "Plesetsk Cosmodrome", "name_ru": "Космодром Плесецк", "lat": 62.924, "lon": 40.553, "desc": "Space/Military Launch"},
        ]
        
        self.power_plants = [
            {"name": "Surgutskaya GRES-2", "name_ru": "Сургутская ГРЭС-2", "lat": 61.283, "lon": 73.544, "desc": "5.6 GW - Largest in Russia"},
            {"name": "Reftinskaya GRES", "name_ru": "Рефтинская ГРЭС", "lat": 57.090, "lon": 61.845, "desc": "3.8 GW Hub"},
            {"name": "Konakovo GRES", "name_ru": "Конаковская ГРЭС", "lat": 56.718, "lon": 36.794, "desc": "2.5 GW Hub"},
        ]
        
        self.radars = [
            {"name": "Voronezh-DM Radar", "name_ru": "РЛС Воронеж-ДМ", "lat": 44.897, "lon": 41.136, "desc": "Early Warning Radar"},
            {"name": "Don-2N BMD Moscow", "name_ru": "РЛС Дон-2Н", "lat": 56.023, "lon": 37.455, "desc": "Moscow BMD Radar"},
        ]
        
        self.command_centers = [
            {"name": "The Kremlin", "name_ru": "Московский Кремль", "lat": 55.751, "lon": 37.617, "desc": "Russian Presidential Admin"},
            {"name": "Defense Ministry HQ", "name_ru": "Министерство обороны РФ", "lat": 55.759, "lon": 37.593, "desc": "MOD Operational Center"},
        ]

    async def poll(self) -> List[Dict[str, Any]]:
        events = []
        now = datetime.utcnow().isoformat()
        
        categories = [
            (self.air_bases, "air_base", "АВИАБАЗА"),
            (self.naval_bases, "naval_base", "ВОЕННО-МОРСКАЯ БАЗА"),
            (self.nuclear_sites, "nuclear_site", "ЯДЕРНЫЙ ОБЪЕКТ"),
            (self.missile_assets, "missile_infrastructure", "РАКЕТНЫЙ ОБЪЕКТ"),
            (self.power_plants, "power_plant", "ЭЛЕКТРОСТАНЦИЯ"),
            (self.radars, "radar_station", "РЛС"),
            (self.command_centers, "command_center", "КОМАНДНЫЙ ЦЕНТР")
        ]
        
        for data_list, etype, prefix_ru in categories:
            for item in data_list:
                name_en = item['name']
                name_ru = item.get('name_ru', name_en)
                desc_en = item.get('desc', 'Strategic Node')
                
                events.append({
                    "id": f"strategic-{etype}-{item['name'].lower().replace(' ', '-')}",
                    "type": etype,
                    "source": self.name,
                    "content": f"ASSET: {name_en} - {desc_en}",
                    "translation_ru": f"ОБЪЕКТ: {name_ru}",
                    "lat": item["lat"],
                    "lon": item["lon"],
                    "timestamp": now,
                    "credibility": 100,
                })
        return events
