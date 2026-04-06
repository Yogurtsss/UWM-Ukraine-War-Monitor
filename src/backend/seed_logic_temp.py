def _seed_cache_with_deployments():
    """Ensures tactical deployment markers are always in the cache immediately."""
    existing_ids = {ev.get("id") for ev in recent_events if ev.get("id")}
    
    # Static markers for bases and recently hit strategic targets
    strategic_targets = [
        # REFINERIES & OIL
        {"id": "oil-saratov", "name": "Saratov Oil Refinery", "lat": 51.533, "lon": 46.034, "category": "energy", "desc": "Neutralized: Strategic oil processing facility."},
        {"id": "oil-volgograd", "name": "Volgograd — Lukoil Refinery", "lat": 48.480, "lon": 44.398, "category": "energy", "desc": "Neutralized: Lukoil major refinery."},
        {"id": "oil-syzran", "name": "Syzran Refinery (Samara)", "lat": 53.152, "lon": 48.456, "category": "energy", "desc": "Neutralized: Major regional refinery."},
        {"id": "oil-ryazan", "name": "Ryazan Oil Refinery", "lat": 54.614, "lon": 39.746, "category": "energy", "desc": "Neutralized: Ryazan primary fuel hub."},
        {"id": "oil-novokuybyshevsk", "name": "Novokuybyshevsk Refinery", "lat": 53.098, "lon": 49.930, "category": "energy", "desc": "Neutralized: Strategic hits confirmed."},
        {"id": "oil-ufa", "name": "Ufa — Bashneft-Novoil", "lat": 54.733, "lon": 55.978, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-tuapse", "name": "Tuapse Refinery", "lat": 44.115, "lon": 39.088, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-afipsky", "name": "Afipsky Refinery", "lat": 44.856, "lon": 38.858, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-slavyansk", "name": "Slavyansk-ECO", "lat": 45.252, "lon": 38.121, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-kirishi", "name": "Kirishi Refinery", "lat": 59.453, "lon": 32.051, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-primorsk", "name": "Primorsk Oil Terminal", "lat": 60.394, "lon": 28.614, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-timashevsk", "name": "Timashevsk Oil Depot", "lat": 45.617, "lon": 38.964, "category": "energy", "desc": "Neutralized."},
        {"id": "oil-kaleykino", "name": "Kaleykino Druzhba Station", "lat": 55.478, "lon": 52.341, "category": "energy", "desc": "Neutralized."},
        
        # DEFENSE PLANTS
        {"id": "def-alabuga", "name": "Alabuga Shahed Plant", "lat": 55.740, "lon": 52.416, "category": "defense", "desc": "Hit: Shahed drone production facility."},
        {"id": "def-lipetsk", "name": "Lipetsk Cartridge Plant", "lat": 52.581, "lon": 39.549, "category": "defense", "desc": "Hit: Ammo factory."},
        {"id": "def-tula", "name": "Tula Arms Plant", "lat": 54.213, "lon": 37.626, "category": "defense", "desc": "Hit: Rocket and weapons factory."},
        {"id": "def-izhevsk", "name": "Izhevsk Mech Plant", "lat": 56.850, "lon": 53.211, "category": "defense", "desc": "Hit: Kalashnikov factory."},
        {"id": "def-uralvagonzavod", "name": "Uralvagonzavod (Nizhny Tagil)", "lat": 57.959, "lon": 59.948, "category": "defense", "desc": "Hit: Main tank manufacturing hub."},
        {"id": "def-chelyabinsk", "name": "Chelyabinsk Tractor Plant", "lat": 55.198, "lon": 61.474, "category": "defense", "desc": "Hit: AFV production."},
        {"id": "def-omsk", "name": "Omsk Transmash", "lat": 54.977, "lon": 73.390, "category": "defense", "desc": "Hit: T-80 tank plant."},
        {"id": "def-kovrov", "name": "Kovrov Mech Plant", "lat": 56.364, "lon": 41.330, "category": "defense", "desc": "Hit."},
        {"id": "def-perm", "name": "Perm Powder Plant", "lat": 57.990, "lon": 56.180, "category": "defense", "desc": "Hit: Explosives factory."},
        {"id": "def-kazan-heli", "name": "Kazan Helicopter Plant", "lat": 55.710, "lon": 48.870, "category": "defense", "desc": "Hit: Mi-8/Mi-17 production."},
        {"id": "def-rostov-heli", "name": "Rostvertol", "lat": 47.271, "lon": 39.735, "category": "defense", "desc": "Hit: Attack heli plant."},
        {"id": "def-komsomolsk", "name": "KRET Electronics", "lat": 50.552, "lon": 137.016, "category": "defense", "desc": "Hit: Military electronics."},
        {"id": "def-nizhny", "name": "Volga Machinery", "lat": 56.298, "lon": 43.986, "category": "defense", "desc": "Hit."},
        {"id": "def-engels", "name": "Engels Air Base Oil Depot", "lat": 51.484, "lon": 46.210, "category": "defense", "desc": "Hit: Strategic bomber fuel."},
        
        # TRANSPORT
        {"id": "infra-crimea-bridge", "name": "Crimean Bridge", "lat": 45.340, "lon": 36.043, "category": "transport", "desc": "Struck: Core logistics artery."},
        {"id": "infra-bryansk-rail", "name": "Bryansk Railway Hub", "lat": 53.247, "lon": 34.367, "category": "transport", "desc": "Hit: Critical logistics node."},
        {"id": "infra-kursk-rail", "name": "Kursk Railway Hub", "lat": 51.730, "lon": 36.193, "category": "transport", "desc": "Hit: Military supply route."},
        {"id": "infra-krasnodar-rail", "name": "Krasnodar Railway", "lat": 45.040, "lon": 38.975, "category": "transport", "desc": "Hit."},
        {"id": "infra-rostov-rail", "name": "Rostov-on-Don Railway", "lat": 47.227, "lon": 39.714, "category": "transport", "desc": "Hit."},
        {"id": "infra-belgorod-rail", "name": "Belgorod Railway", "lat": 50.597, "lon": 36.588, "category": "transport", "desc": "Hit: Frequent tactical neutralizing."},
        {"id": "infra-tambov-rail", "name": "Tambov Junction", "lat": 52.715, "lon": 41.425, "category": "transport", "desc": "Hit."},
        {"id": "infra-voronezh-rail", "name": "Voronezh Railway", "lat": 51.675, "lon": 39.212, "category": "transport", "desc": "Hit."},
        {"id": "infra-millerovo-rail", "name": "Millerovo Railway", "lat": 48.919, "lon": 40.410, "category": "transport", "desc": "Hit."},
    ]

    seed_events = []
    
    # Base deployments
    seed_events.extend([
        {"id": "base-sevastopol", "type": "deployment", "source": "RU_MOD_OSINT", "content": "Sevastopol Naval Base", "lat": 44.6167, "lon": 33.5254, "timestamp": "Active"},
        {"id": "base-mariupol", "type": "deployment", "source": "RU_MOD_OSINT", "content": "Mariupol Logistics Hub", "lat": 47.1028, "lon": 37.5492, "timestamp": "Active"},
        {"id": "base-donetsk", "type": "deployment", "source": "RU_MOD_OSINT", "content": "Donetsk Command Center", "lat": 48.0159, "lon": 37.8028, "timestamp": "Active"},
        {"id": "base-melitopol", "type": "deployment", "source": "RU_MOD_OSINT", "content": "Melitopol Air Base", "lat": 46.8489, "lon": 35.3671, "timestamp": "Active"}
    ])

    for t in strategic_targets:
        seed_events.append({
            "id": f"strategic-{t['id']}", 
            "type": "strike",
            "subtype": "strategic_neutralization",
            "source": "UWM_TACTICAL",
            "content": f"🎯 {t['name']}: {t['desc']}",
            "translation_ua": f"🎯 {t['name']}: Нейтралізовано - {t['desc']}",
            "translation_ru": f"🎯 {t['name']}: Нейтрализовано - {t['desc']}",
            "lat": t["lat"], "lon": t["lon"], 
            "location_name": t["name"], "timestamp": "2026-04-01T12:00:00Z" # Sort as very recent
        })

    added = 0
    for ev in seed_events:
        if ev["id"] not in existing_ids:
            recent_events.append(ev)
            added += 1
    if added > 0:
        recent_events.sort(key=lambda x: str(x.get("timestamp", "0")), reverse=True)
        save_cache()
        logger.info(f"[SEED] Added {added} markers to cache.")
    else:
        logger.info("[SEED] Markers already in cache.")
