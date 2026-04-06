from typing import List, Dict, Any
from .base import BaseAdapter

class RussianEnergyAdapter(BaseAdapter):
    """
    Adapter for Russian Strategic Energy Infrastructure (Oil/Gas).
    Provides static locations of major refineries and fields for OSINT tracking.
    """
    def __init__(self):
        super().__init__(name="Russian Energy Infrastructure", frequency_seconds=86400) # Daily (static)
        
        # Major Russian Refineries
        self.refineries = [
            {"name": "Omsk Refinery", "name_ru": "Омский НПЗ", "lat": 54.91, "lon": 73.28, "capacity": "560k bpd", "type": "refinery"},
            {"name": "Kirishi Refinery", "name_ru": "Киришский НПЗ", "lat": 59.45, "lon": 32.33, "capacity": "420k bpd", "type": "refinery"},
            {"name": "Ryazan Refinery", "name_ru": "Рязанский НПЗ", "lat": 54.60, "lon": 39.75, "capacity": "350k bpd", "type": "refinery"},
            {"name": "Lukoil-Nizhny Novgorod", "name_ru": "Лукойл-Нижегороднефтеоргсинтез", "lat": 56.14, "lon": 44.17, "capacity": "340k bpd", "type": "refinery"},
            {"name": "Yaroslavl Refinery", "name_ru": "Ярославский НПЗ", "lat": 57.65, "lon": 39.81, "capacity": "300k bpd", "type": "refinery"},
            {"name": "Volgograd Refinery", "name_ru": "Волгоградский НПЗ", "lat": 48.48, "lon": 44.47, "capacity": "270k bpd", "type": "refinery"},
            {"name": "Perm Refinery", "name_ru": "Пермский НПЗ", "lat": 57.94, "lon": 56.14, "capacity": "260k bpd", "type": "refinery"},
            {"name": "Moscow Refinery (Kapotnya)", "name_ru": "Московский НПЗ (Капотня)", "lat": 55.65, "lon": 37.83, "capacity": "240k bpd", "type": "refinery"},
            {"name": "Novokuibyshevsk Refinery", "name_ru": "Новокуйбышевский НПЗ", "lat": 53.12, "lon": 49.92, "capacity": "170k bpd", "type": "refinery"},
            {"name": "Tuapse Refinery", "name_ru": "Туапсинский НПЗ", "lat": 44.11, "lon": 39.10, "capacity": "240k bpd", "type": "refinery"},
            {"name": "Syzran Refinery", "name_ru": "Сызранский НПЗ", "lat": 53.12, "lon": 48.43, "capacity": "130k bpd", "type": "refinery"},
            {"name": "Saratov Refinery", "name_ru": "Саратовский НПЗ", "lat": 51.48, "lon": 45.98, "capacity": "140k bpd", "type": "refinery"},
            {"name": "Ilsky Refinery", "name_ru": "Ильский НПЗ", "lat": 44.83, "lon": 38.38, "capacity": "130k bpd", "type": "refinery"},
            {"name": "Afipsky Refinery", "name_ru": "Афипский НПЗ", "lat": 44.90, "lon": 38.83, "capacity": "120k bpd", "type": "refinery"},
            {"name": "Slavyansk Refinery", "name_ru": "Славянский НПЗ", "lat": 45.26, "lon": 38.12, "capacity": "80k bpd", "type": "refinery"},
        ]
        
        # Major Oil/Gas Fields
        self.fields = [
            {"name": "Samotlor Oil Field", "name_ru": "Самотлорское месторождение", "lat": 61.1, "lon": 76.7, "region": "West Siberia", "type": "field"},
            {"name": "Romashkinskoye Field", "name_ru": "Ромашкинское месторождение", "lat": 54.5, "lon": 52.5, "region": "Tatarstan", "type": "field"},
            {"name": "Vankor Field", "name_ru": "Ванкорское месторождение", "lat": 67.8, "lon": 83.5, "region": "Krasnoyarsk", "type": "field"},
            {"name": "Prirazlomnaya Platform", "name_ru": "Приразломная платформа", "lat": 69.2, "lon": 57.3, "region": "Arctic Shelf", "type": "field"},
            {"name": "Sakhalin-1 (Chaivo)", "name_ru": "Сахалин-1 (Чайво)", "lat": 51.3, "lon": 143.6, "region": "Sakhalin", "type": "field"},
            {"name": "Vostok Oil / Vankor", "name_ru": "Восток Ойл / Ванкор", "lat": 67.8, "lon": 83.7, "region": "West Siberia", "type": "field"},
            {"name": "Novatek Sabetta LNG", "name_ru": "Ямал-СПГ (Сабетта)", "lat": 71.257, "lon": 72.119, "region": "Arctic", "type": "terminal"},
            {"name": "Arctic LNG 2", "name_ru": "Арктик СПГ-2", "lat": 72.000, "lon": 74.000, "region": "Gydan", "type": "terminal"},
            {"name": "Surgut Hub", "name_ru": "Сургутский хаб", "lat": 61.250, "lon": 73.420, "region": "Siberia", "type": "field"},
            {"name": "Noyabrsk Hub", "name_ru": "Ноябрьский хаб", "lat": 63.200, "lon": 75.450, "region": "Siberia", "type": "field"},
            {"name": "Ust-Luga Terminal", "name_ru": "Усть-Луга Терминал", "lat": 59.678, "lon": 28.369, "region": "Baltic", "type": "terminal"},
            {"name": "Primorsk Terminal", "name_ru": "Приморск Терминал", "lat": 60.394, "lon": 28.614, "region": "Baltic", "type": "terminal"},
            {"name": "De-Kastri Terminal", "name_ru": "Де-Кастри Терминал", "lat": 51.461, "lon": 140.783, "region": "Far East", "type": "terminal"},
            {"name": "Bovanenkovo Gas Field", "name_ru": "Бованенковское месторождение", "lat": 70.3, "lon": 68.3, "region": "Yamal", "type": "field"},
            {"name": "Urengoy Gas Field", "name_ru": "Уренгойское месторождение", "lat": 66.1, "lon": 76.7, "region": "Yamal", "type": "field"},
        ]

    async def poll(self) -> List[Dict[str, Any]]:
        """Returns the energy infrastructure as a list of events."""
        events = []
        
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        
        # Treat these as "Infrastructure Markers"
        for item in self.refineries + self.fields:
            name_en = item['name']
            name_ru = item.get('name_ru', name_en)
            events.append({
                "id": f"energy-{item['name'].lower().replace(' ', '-')}",
                "type": "energy_infrastructure",
                "source": self.name,
                "content": f"STRATEGIC INFRASTRUCTURE: {name_en} ({item.get('capacity', item.get('region'))})",
                "translation_ru": f"СТРАТЕГИЧЕСКАЯ ИНФРАСТРУКТУРА: {name_ru} ({item.get('capacity', item.get('region'))})",
                "lat": item["lat"],
                "lon": item["lon"],
                "infra_type": item["type"],
                "timestamp": now,
                "credibility": 100,
            })
            
        return events
