from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
import logging
import asyncio
from datetime import datetime

from src.adapters.air_alerts import AirAlertsAdapter
from src.adapters.frontline import FrontlineAdapter
from src.adapters.news_feeds import GuardianLiveAdapter, APNewsAdapter
from src.adapters.osint_extra import NASA_FIRMS_Adapter
from src.adapters.economic import PolymarketAdapter, EconomicAdapter
from src.adapters.telegram import TelegramOSINTAdapter
from src.adapters.deployment import RussianDeploymentAdapter
from src.adapters.stats import StatsAdapter
from src.adapters.energy import RussianEnergyAdapter
from src.adapters.strategic import RussianStrategicAdapter
from src.pipeline.processor import EventProcessor


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

def _seed_cache_with_deployments():
    """Ensures tactical deployment markers are always in the cache immediately."""
    existing_ids = {ev.get("id") for ev in recent_events if ev.get("id")}
    
    # COMPREHENSIVE TACTICAL DATABASE: Restoring all 2024-2026 targets
    strategic_targets = [
        # AIR BASES (✈️ בסיסי אוויר)
        {"id": "airbase-engels", "type": "air_base", "name": "Engels-2 Air Base", "lat": 51.4811, "lon": 46.2106, "desc": "Strategic Bomber Base (Tu-95/Tu-160). Targeted.", "subtype": "strategic_neutralization"},
        {"id": "airbase-olenya", "type": "air_base", "name": "Olenya Air Base", "lat": 68.1510, "lon": 33.4687, "desc": "Strategic Bomber Base (Kola Peninsula)."},
        {"id": "airbase-ukrainka", "type": "air_base", "name": "Ukrainka Air Base", "lat": 51.1640, "lon": 128.4430, "desc": "Strategic Bomber Base (Far East)."},
        {"id": "airbase-kubinka", "type": "air_base", "name": "Kubinka Air Base", "lat": 55.6080, "lon": 36.6550, "desc": "Combat Base (Moscow)."},
        {"id": "airbase-dyagilevo", "type": "air_base", "name": "Dyagilevo Air Base", "lat": 54.6450, "lon": 39.5640, "desc": "Ryazan Reserve Base. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "airbase-chkalovskiy", "type": "air_base", "name": "Chkalovskiy Air Base", "lat": 55.8790, "lon": 38.0640, "desc": "Transport Hub (Moscow)."},
        {"id": "airbase-severomorsk1", "type": "air_base", "name": "Severomorsk-1 Air Base", "lat": 69.0316, "lon": 33.4183, "desc": "Northern Fleet Aviation."},
        {"id": "airbase-nagurskoye", "type": "air_base", "name": "Nagurskoye Air Base", "lat": 80.8020, "lon": 47.6650, "desc": "Arctic Strategic Base."},
        {"id": "airbase-monchegorsk", "type": "air_base", "name": "Monchegorsk Air Base", "lat": 67.9850, "lon": 33.0120, "desc": "Interception Base."},
        {"id": "airbase-yelizovo", "type": "air_base", "name": "Yelizovo Air Base", "lat": 53.1650, "lon": 158.4500, "desc": "Kamchatka Naval Air."},
        {"id": "airbase-chernyakhovsk", "type": "air_base", "name": "Chernyakhovsk Air Base", "lat": 54.5990, "lon": 21.7810, "desc": "Kaliningrad (Iskander + Su-27)."},
        {"id": "airbase-donskoye", "type": "air_base", "name": "Donskoye Air Base", "lat": 54.9380, "lon": 19.9790, "desc": "Kaliningrad Air Defense."},
        {"id": "airbase-seshcha", "type": "air_base", "name": "Seshcha Air Base", "lat": 53.7160, "lon": 33.3430, "desc": "Western Strategic Hub. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "airbase-lipetsk", "type": "air_base", "name": "Lipetsk Air Base", "lat": 52.6430, "lon": 39.4390, "desc": "Flight Training Center."},
        {"id": "airbase-migalovo", "type": "air_base", "name": "Migalovo Air Base", "lat": 56.8250, "lon": 35.7460, "desc": "Transport Wing."},
        {"id": "airbase-khotilovo", "type": "air_base", "name": "Khotilovo Air Base", "lat": 57.6580, "lon": 34.1000, "desc": "Interception Base."},
        {"id": "airbase-pskov", "type": "air_base", "name": "Pskov Air Base", "lat": 57.7730, "lon": 28.3910, "desc": "VDV 76th Guards Base. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "airbase-belaya", "type": "air_base", "name": "Belaya Air Base", "lat": 52.9130, "lon": 103.5620, "desc": "Tu-22M3 Strategic Base."},
        {"id": "airbase-domna", "type": "air_base", "name": "Domna Air Base", "lat": 51.9130, "lon": 113.1180, "desc": "Eastern Siberia Wing."},
        {"id": "airbase-tiksi", "type": "air_base", "name": "Tiksi Air Base", "lat": 71.6990, "lon": 128.8960, "desc": "Arctic Outpost."},
        {"id": "airbase-ugolny", "type": "air_base", "name": "Ugolny Air Base", "lat": 64.7310, "lon": 177.7360, "desc": "Extreme Far East Hub."},
        {"id": "airbase-millerovo", "type": "air_base", "name": "Millerovo Air Base", "lat": 48.9190, "lon": 40.3990, "desc": "Su-30 Case. Targeted 2024.", "subtype": "strategic_neutralization"},
        {"id": "airbase-morozovsk", "type": "air_base", "name": "Morozovsk Air Base", "lat": 48.2990, "lon": 41.8590, "desc": "Tactical Bomber Base. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "airbase-akhtubinsk", "type": "air_base", "name": "Akhtubinsk Test Center", "lat": 48.2730, "lon": 46.0740, "desc": "Advanced Aircraft Testing. Targeted.", "subtype": "strategic_neutralization"},

        # NAVAL BASES (⚓ בסיסי ים)
        {"id": "naval-severomorsk", "type": "naval_base", "name": "Severomorsk Base", "lat": 69.0840, "lon": 33.4200, "desc": "Northern Fleet HQ."},
        {"id": "naval-gadzhiyevo", "type": "naval_base", "name": "Gadzhiyevo Base", "lat": 69.2552, "lon": 33.3166, "desc": "Nuclear Submarine Base (SSBN)."},
        {"id": "naval-polyarny", "type": "naval_base", "name": "Polyarny Base", "lat": 69.2020, "lon": 33.4580, "desc": "Barents Sea Support."},
        {"id": "naval-vidyayevo", "type": "naval_base", "name": "Vidyayevo Base", "lat": 69.3300, "lon": 32.8260, "desc": "Submarine Base."},
        {"id": "naval-zaozersk", "type": "naval_base", "name": "Zaozersk Base", "lat": 69.4360, "lon": 32.4120, "desc": "Zapadnaya Litsa Nuclear Subs."},
        {"id": "naval-severodvinsk", "type": "naval_base", "name": "Severodvinsk Shipyard", "lat": 64.5840, "lon": 39.8150, "desc": "Nuclear Submarine Construction."},
        {"id": "naval-kronshtadt", "type": "naval_base", "name": "Kronshtadt Base", "lat": 59.9820, "lon": 29.7840, "desc": "Baltic Fleet Hub."},
        {"id": "naval-baltiysk", "type": "naval_base", "name": "Baltiysk Base", "lat": 54.6420, "lon": 19.9160, "desc": "Baltic Fleet HQ."},
        {"id": "naval-novorossiysk", "type": "naval_base", "name": "Novorossiysk Base", "lat": 44.7209, "lon": 37.8338, "desc": "Black Sea HQ Transition Zone."},
        {"id": "naval-vladivostok", "type": "naval_base", "name": "Vladivostok Base", "lat": 43.0730, "lon": 131.9330, "desc": "Pacific Fleet HQ."},
        {"id": "naval-fokino", "type": "naval_base", "name": "Fokino Base", "lat": 42.9370, "lon": 132.4170, "desc": "Pacific Fleet Hub."},
        {"id": "naval-petropavlovsk", "type": "naval_base", "name": "Petropavlovsk Naval", "lat": 52.9590, "lon": 158.6650, "desc": "Kamchatka Nuclear Subs."},
        {"id": "naval-tartus", "type": "naval_base", "name": "Tartus Base", "lat": 34.9080, "lon": 35.8720, "desc": "Syria Strategic Hub."},

        # NUCLEAR & SENSITIVE (☢️ גרעין)
        {"id": "nuclear-sarov", "type": "nuclear_site", "name": "VNIIEF Sarov", "lat": 54.9200, "lon": 43.3300, "desc": "Primary Nuclear Research (Arzamas-16)."},
        {"id": "nuclear-snezhinsk", "type": "nuclear_site", "name": "VNIITF Snezhinsk", "lat": 56.0870, "lon": 60.7360, "desc": "Nuclear Weapons Development (Chelyabinsk-70)."},
        {"id": "nuclear-mayak", "type": "nuclear_site", "name": "Mayak Association", "lat": 55.6930, "lon": 60.8010, "desc": "Plutonium Processing & Waste."},
        {"id": "nuclear-andreeva", "type": "nuclear_site", "name": "Andreeva Bay", "lat": 69.4500, "lon": 32.3530, "desc": "Nuclear Waste Storage."},
        {"id": "nuclear-zheleznogorsk", "type": "nuclear_site", "name": "MCC Zheleznogorsk", "lat": 56.3540, "lon": 93.6430, "desc": "Plutonium Production."},
        {"id": "nuclear-tomsk-enrichment", "type": "nuclear_site", "name": "Tomsk Uranium Plant", "lat": 56.6180, "lon": 84.8690, "desc": "Rosatom SIBUR Facility."},
        {"id": "nuclear-novouralsk", "type": "nuclear_site", "name": "UECC Novouralsk", "lat": 57.2720, "lon": 60.1070, "desc": "Uranium Enrichment Hub."},
        {"id": "nuclear-zheleznogorsk-aecc", "type": "nuclear_site", "name": "AECC Zheleznogorsk", "lat": 56.1120, "lon": 94.4940, "desc": "Uranium Enrichment."},

        # ENERGY & POWER (⚡ תחנות כוח)
        {"id": "power-leningrad-i", "type": "power_plant", "name": "Leningrad NPP I", "lat": 59.8520, "lon": 29.0480, "desc": "Nuclear Power (RBMK-1000)."},
        {"id": "power-leningrad-ii", "type": "power_plant", "name": "Leningrad NPP II", "lat": 59.8300, "lon": 29.0560, "desc": "Nuclear Power (VVER-1200)."},
        {"id": "power-kola", "type": "power_plant", "name": "Kola NPP", "lat": 67.4660, "lon": 32.4660, "desc": "Arctic Nuclear Power."},
        {"id": "power-kalinin", "type": "power_plant", "name": "Kalinin NPP", "lat": 57.9050, "lon": 35.0600, "desc": "Nuclear Power (VVER-1000)."},
        {"id": "power-smolensk", "type": "power_plant", "name": "Smolensk NPP", "lat": 54.1690, "lon": 33.2460, "desc": "Nuclear Power (RBMK-1000)."},
        {"id": "power-kursk-i", "type": "power_plant", "name": "Kursk NPP I", "lat": 51.6760, "lon": 35.6060, "desc": "Nuclear Power Center."},
        {"id": "power-kursk-ii", "type": "power_plant", "name": "Kursk NPP II", "lat": 51.6880, "lon": 35.5730, "desc": "VVER-1200 under construction."},
        {"id": "power-novovoronezh", "type": "power_plant", "name": "Novovoronezh NPP", "lat": 51.2750, "lon": 39.2000, "desc": "Nuclear Power VVER Units."},
        {"id": "power-rostov", "type": "power_plant", "name": "Rostov NPP", "lat": 47.5990, "lon": 42.3710, "desc": "Nuclear Power (VVER-1000)."},
        {"id": "power-balakovo", "type": "power_plant", "name": "Balakovo NPP", "lat": 52.0910, "lon": 47.9550, "desc": "Nuclear Power (Saratov)."},
        {"id": "power-beloyarsk", "type": "power_plant", "name": "Beloyarsk NPP", "lat": 56.8410, "lon": 61.3220, "desc": "Breeder Reactor (BN-800)."},
        {"id": "power-bilibino", "type": "power_plant", "name": "Bilibino NPP", "lat": 68.0500, "lon": 166.5380, "desc": "Arctic Power Station."},
        {"id": "power-lomonosov", "type": "power_plant", "name": "Akademik Lomonosov", "lat": 69.7090, "lon": 170.3060, "desc": "Floating NPP (Pevek)."},
        {"id": "power-surgut-1", "type": "power_plant", "name": "Surgutskaya GRES-1", "lat": 61.2400, "lon": 73.3480, "desc": "3.3 GW Thermal GRES."},
        {"id": "power-surgut2", "type": "power_plant", "name": "Surgutskaya GRES-2", "lat": 61.2794, "lon": 73.4889, "desc": "5.6 GW — Largest in Russia."},
        {"id": "power-reftinskaya", "type": "power_plant", "name": "Reftinskaya GRES", "lat": 57.0900, "lon": 61.8450, "desc": "3.8 GW (Ural)."},
        {"id": "power-kostromskaya", "type": "power_plant", "name": "Kostromskaya GRES", "lat": 57.7200, "lon": 41.1530, "desc": "3.6 GW."},
        {"id": "power-ryazanskaya", "type": "power_plant", "name": "Ryazanskaya GRES", "lat": 54.6350, "lon": 40.7480, "desc": "3.1 GW."},
        {"id": "power-konakovo", "type": "power_plant", "name": "Konakovo GRES", "lat": 56.7180, "lon": 36.7940, "desc": "2.5 GW. Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "power-novocherkassk", "type": "power_plant", "name": "Novocherkasskaya GRES", "lat": 47.4240, "lon": 40.1780, "desc": "Rostov Thermal Power."},

        # OIL & GAS (🛢️ נפט וגז)
        {"id": "oil-ust-luga", "type": "energy_infrastructure", "infra_type": "terminal", "name": "Ust-Luga Oil Terminal", "lat": 59.6780, "lon": 28.3690, "desc": "Baltic Export Hub."},
        {"id": "oil-primorsk", "type": "energy_infrastructure", "infra_type": "terminal", "name": "Primorsk Oil Terminal", "lat": 60.3940, "lon": 28.6140, "desc": "Baltic Export Hub."},
        {"id": "oil-novorossiysk", "type": "energy_infrastructure", "infra_type": "terminal", "name": "Novorossiysk Oil Terminal", "lat": 44.7170, "lon": 37.8320, "desc": "Black Sea Export Hub."},
        {"id": "oil-ryazan", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Ryazan Refinery", "lat": 54.6140, "lon": 39.7460, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-saratov", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Saratov Refinery", "lat": 51.5330, "lon": 46.0340, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-volgograd", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Volgograd Lukoil", "lat": 48.4800, "lon": 44.3980, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-syzran", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Syzran Refinery", "lat": 53.1520, "lon": 48.4560, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-novokuybyshevsk", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Novokuybyshevsk Refinery", "lat": 53.0980, "lon": 49.9300, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-ufa", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Ufa Bashneft", "lat": 54.7330, "lon": 55.9780, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-tuapse", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Tuapse Refinery", "lat": 44.1150, "lon": 39.0880, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-afipsky", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Afipsky Refinery", "lat": 44.8560, "lon": 38.8580, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-kirishi", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Kirishi Refinery", "lat": 59.4530, "lon": 32.0510, "desc": "Leningrad Oblast Hub."},
        {"id": "oil-slavyansk", "type": "energy_infrastructure", "infra_type": "refinery", "name": "Slavyansk-ECO", "lat": 45.2520, "lon": 38.1210, "desc": "Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "oil-timashevsk", "type": "energy_infrastructure", "infra_type": "terminal", "name": "Timashevsk Depot", "lat": 45.6170, "lon": 38.9640, "desc": "Neutralized.", "subtype": "strategic_neutralization"},

        # ICBM FIELDS (🚀 טילים בליסטיים)
        {"id": "icbm-kozelsk", "type": "missile_infrastructure", "name": "Kozelsk ICBM Base", "lat": 54.0290, "lon": 35.7950, "desc": "SS-19 Silo Field."},
        {"id": "icbm-tatishchevo", "type": "missile_infrastructure", "name": "Tatishchevo ICBM Base", "lat": 51.7000, "lon": 45.5000, "desc": "SS-27 Silo Field (Largest)."},
        {"id": "icbm-dombarovsky", "type": "missile_infrastructure", "name": "Dombarovsky Base", "lat": 50.8050, "lon": 59.5300, "desc": "RS-36M Silo Field."},
        {"id": "icbm-uzhur", "type": "missile_infrastructure", "name": "Uzhur ICBM Base", "lat": 55.3100, "lon": 89.8330, "desc": "RS-36M Field (Krasnoyarsk)."},
        {"id": "icbm-yoshkar-ola", "type": "missile_infrastructure", "name": "Yoshkar-Ola ICBM", "lat": 56.6380, "lon": 47.8960, "desc": "Topol-M Mobile Field."},
        {"id": "icbm-nizhny-tagil", "type": "missile_infrastructure", "name": "Nizhny Tagil Base", "lat": 57.9120, "lon": 59.9800, "desc": "Ural Mobile ICBM Field."},
        {"id": "icbm-novosibirsk", "type": "missile_infrastructure", "name": "Novosibirsk Base", "lat": 54.8890, "lon": 82.9160, "desc": "Yars ICBM Field."},
        {"id": "icbm-irkutsk", "type": "missile_infrastructure", "name": "Irkutsk ICBM Base", "lat": 52.2970, "lon": 104.2960, "desc": "East Siberia ICBM."},
        {"id": "icbm-vypolzovo", "type": "missile_infrastructure", "name": "Vypolzovo ICBM", "lat": 57.8360, "lon": 33.8970, "desc": "Tver Oblast Yars Field."},

        # DEFENSE INDUSTRY (🏭 תעשיית נשק)
        {"id": "def-alabuga", "type": "factory", "name": "Alabuga Shahed Plant", "lat": 55.7400, "lon": 52.4160, "desc": "Shahed Production. Neutralized.", "subtype": "strategic_neutralization"},
        {"id": "def-uralvagonzavod", "type": "factory", "name": "Uralvagonzavod", "lat": 57.9590, "lon": 59.9480, "desc": "Main Tank Factory (T-90)."},
        {"id": "def-tula", "type": "factory", "name": "Tula Arms Plant", "lat": 54.2130, "lon": 37.6260, "desc": "Weapon Systems Production."},
        {"id": "def-izhevsk", "type": "factory", "name": "Izhevsk Mech Plant", "lat": 56.8500, "lon": 53.2110, "desc": "Kalashnikov Production."},
        {"id": "def-kazan-heli", "type": "factory", "name": "Kazan Heli Plant", "lat": 55.7100, "lon": 48.8700, "desc": "Mi-8/Mi-17 Production."},
        {"id": "def-rostvertol", "type": "factory", "name": "Rostvertol Plant", "lat": 47.2710, "lon": 39.7350, "desc": "Mi-28/Ka-52 Production."},
        {"id": "def-omsk-transmash", "type": "factory", "name": "Omsk Transmash", "lat": 54.9770, "lon": 73.3900, "desc": "T-80 Tank Production."},
        {"id": "def-lipetsk", "type": "factory", "name": "Lipetsk Cartridge Plant", "lat": 52.5810, "lon": 39.5490, "desc": "Ammo Hub. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "def-beriev-taganrog", "type": "factory", "name": "Beriev Plant", "lat": 47.2110, "lon": 38.9000, "desc": "A-50 Surveillance Plant. Targeted.", "subtype": "strategic_neutralization"},

        # LOGISTICS (🛤️ תחבורה ולוגיסטיקה)
        {"id": "infra-crimea-bridge", "type": "deployment", "infra_type": "logistics", "name": "Crimean Bridge", "lat": 45.3400, "lon": 36.0430, "desc": "Targeted Logistics Artery.", "subtype": "strategic_neutralization"},
        {"id": "infra-bryansk-rail", "type": "deployment", "infra_type": "logistics", "name": "Bryansk Rail Hub", "lat": 53.2470, "lon": 34.3670, "desc": "Critical Logistics Hub."},
        {"id": "infra-kursk-rail", "type": "deployment", "infra_type": "logistics", "name": "Kursk Rail Hub", "lat": 51.7300, "lon": 36.1930, "desc": "Neutralized Logistics. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "infra-belgorod-rail", "type": "deployment", "infra_type": "logistics", "name": "Belgorod Rail Hub", "lat": 50.5970, "lon": 36.5880, "desc": "Neutralized Logistics. Targeted.", "subtype": "strategic_neutralization"},
        {"id": "infra-rostov-rail", "type": "deployment", "infra_type": "logistics", "name": "Rostov-on-Don Rail", "lat": 47.2270, "lon": 39.7140, "desc": "Southern Supply Hub."},

        # RADAR & SPACE (📡🛰️)
        {"id": "radar-armavir", "type": "radar_station", "name": "Voronezh-DM Armavir", "lat": 44.8970, "lon": 41.1360, "desc": "Early Warning Radar (SE)."},
        {"id": "radar-lekhtusi", "type": "radar_station", "name": "Voronezh-M Lekhtusi", "lat": 60.0280, "lon": 30.8170, "desc": "Early Warning Radar (W)."},
        {"id": "radar-usolye", "type": "radar_station", "name": "Voronezh Usolye", "lat": 52.7340, "lon": 103.6250, "desc": "Early Warning Radar (E)."},
        {"id": "radar-don2n", "type": "radar_station", "name": "Don-2N BMD Radar", "lat": 56.0230, "lon": 37.4550, "desc": "Moscow Anti-Ballistic Defense."},
        {"id": "space-plesetsk", "type": "radar_station", "name": "Plesetsk Cosmodrome", "lat": 62.9240, "lon": 40.5530, "desc": "Military Space Launch Hub."},
        {"id": "space-vostochny", "type": "radar_station", "name": "Vostochny Cosmodrome", "lat": 51.8840, "lon": 128.3330, "desc": "Strategic Far East Space Hub."},

        # COMMAND CENTERS (🏙️ מרכזי פיקוד)
        {"id": "cmd-kremlin", "type": "command_center", "name": "The Kremlin", "lat": 55.7510, "lon": 37.6170, "desc": "Federal Command Center."},
        {"id": "cmd-mod", "type": "command_center", "name": "Russian MoD HQ", "lat": 55.7590, "lon": 37.5930, "desc": "General Staff Command Hub."},
        {"id": "cmd-fsb", "type": "command_center", "name": "FSB HQ Lubyanka", "lat": 55.7570, "lon": 37.6260, "desc": "Federal Security Service HQ."},
        {"id": "cmd-rostov", "type": "command_center", "name": "Southern District HQ", "lat": 47.2370, "lon": 39.7290, "desc": "Operational Command (Rostov)."},
        {"id": "cmd-stpetersburg", "type": "command_center", "name": "Western District HQ", "lat": 59.9480, "lon": 30.3420, "desc": "Operational Command (St. Petersburg)."},
        {"id": "cmd-yekaterinburg", "type": "command_center", "name": "Central District HQ", "lat": 56.8390, "lon": 60.6050, "desc": "Operational Command (Ural)."},
        {"id": "cmd-khabarovsk", "type": "command_center", "name": "Eastern District HQ", "lat": 48.4820, "lon": 135.0820, "desc": "Operational Command (Far East)."},
    ]

    seed_events = []
    # Base deployments
    seed_events.extend([
        {"id": "base-sevastopol", "type": "deployment", "source": "RU_MOD_OSINT", "content": "Sevastopol Naval Base", "lat": 44.6167, "lon": 33.5254, "timestamp": "Active"},
        {"id": "base-mariupol", "type": "deployment", "source": "RU_MOD_OSINT", "content": "Mariupol Logistics Hub", "lat": 47.1028, "lon": 37.5492, "timestamp": "Active"}
    ])

    for t in strategic_targets:
        event = {
            "id": f"strategic-{t['id']}",
            "type": t["type"],
            "source": "UWM_TACTICAL",
            "content": f"📍 {t['name']}: {t['desc']}",
            "lat": t["lat"], "lon": t["lon"], 
            "location_name": t["name"], 
            "timestamp": "Active"
        }
        if "subtype" in t:
            event["subtype"] = t["subtype"]
        if "infra_type" in t:
            event["infra_type"] = t["infra_type"]
            
        seed_events.append(event)

    added = 0
    updated = 0
    
    # Use a dictionary to speed up ID checks
    recent_events_map = {ev.get("id"): i for i, ev in enumerate(recent_events) if ev.get("id")}

    for ev in seed_events:
        ev_id = ev["id"]
        if ev_id in recent_events_map:
            # Update existing entry with new metadata
            recent_events[recent_events_map[ev_id]].update(ev)
            updated += 1
        else:
            recent_events.append(ev)
            added += 1

    if added > 0 or updated > 0:
        recent_events.sort(key=lambda x: str(x.get("timestamp", "0")), reverse=True)
        save_cache()
        logger.info(f"[SEED] Strategy Sync: Added {added}, Updated {updated} markers.")
    else:
        logger.info("[SEED] All tactical tactical markers in sync.")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed the cache with permanent tactical markers on startup
    _seed_cache_with_deployments()
    asyncio.create_task(run_poller())
    logger.info("UWM Backend ready. Polling started.")
    yield
    save_cache()

app = FastAPI(title="UWM – Ukraine War Monitor API", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # More permissive for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info(f"WS client connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)
        logger.info(f"WS client disconnected. Total: {len(self.active)}")

    async def broadcast(self, message: str):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()
processor = EventProcessor()

import os

CACHE_FILE = "data/events_cache.json"

def save_cache():
    os.makedirs("data", exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(recent_events, f, ensure_ascii=False)

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except: return []
    return []

# ── In-memory cache loaded from disk ──
recent_events: List[Dict[str, Any]] = load_cache()

def prune_events():
    """Smart TTL Cleanup: Removes stale events based on their tactical priority."""
    global recent_events
    now = datetime.now()
    kept = []
    
    for ev in recent_events:
        etype = ev.get("type", "news")
        
        # 1. Permanent tactical infrastructure - Never expires
        if etype in ["deployment", "energy_infrastructure"]:
            kept.append(ev)
            continue
            
        # 2. Extract timestamp
        ts = ev.get("timestamp")
        if not ts or ts in ["Active", "Now", "Current", "Recent"]:
            kept.append(ev) # Keep 'live' events
            continue
            
        try:
            # Parse ISO timestamp
            # Most adapters use ISO format from processor/adapters
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            age_hours = (now - dt.replace(tzinfo=None)).total_seconds() / 3600
            
            # 3. Apply TTL Rules
            if etype == "air_alert" and age_hours > 6: continue    # Alerts expire in 6h
            if etype in ["strike", "bombing"] and age_hours > 48: continue # Strikes visible for 2 days
            if age_hours > 24: continue # Default News/Social expires in 24h
            
            kept.append(ev)
        except Exception:
            # If date parsing fails, keep for safety but limit total count
            kept.append(ev)
            
    recent_events = kept
    logger.info(f"[TTL] Pruned history. {len(recent_events)} active nodes remaining.")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send buffered events immediately on connect
    if recent_events:
        await websocket.send_text(json.dumps({
            "source": "cache",
            "events": recent_events[:1000] # Send full cache history on connect
        }))
    try:
        while True:
            await websocket.receive_text()  # keep-alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "time": datetime.now().isoformat(),
        "ws_clients": len(manager.active),
        "cached_events": len(recent_events),
    }


# (StatsAdapter moved to global scope)

@app.get("/api/stats/missiles")
@app.get("/stats/missiles")
async def get_missile_stats():
    """Returns historical counts of air alerts and confirmed strikes."""
    return await stats_adapter.get_missile_stats()

@app.get("/api/events")
@app.get("/events")
async def get_events(limit: int = 100):
    """REST fallback for clients that can't WebSocket."""
    return {"events": recent_events[:limit]}


# ── Adapters Setup ─────────────────────────────────────────────────────────────
frontline_adapter = FrontlineAdapter()
stats_adapter = StatsAdapter()

adapters = [
    AirAlertsAdapter(),
    frontline_adapter,
    RussianDeploymentAdapter(),
    GuardianLiveAdapter(),
    APNewsAdapter(),
    NASA_FIRMS_Adapter(),
    PolymarketAdapter(),
    EconomicAdapter(),
    RussianEnergyAdapter(),
    RussianStrategicAdapter(),
    TelegramOSINTAdapter([
        "kpszsu", "war_monitor", "KyivIndependent_official", "noel_reports", 
        "DeepStateUA", "operativnoZSU", "UkraineAlarmSignal", "DIUkraine",
        "Kyivpost_official", "ButusovPlus"
    ]),
]

@app.get("/api/map/frontline.json")
async def get_frontline_map():
    """Proxy endpoint to fetch granular DeepState metadata without CORS issues."""
    return await frontline_adapter.get_raw_geojson()

# ── Background Polling Task ────────────────────────────────────────────────────
async def run_poller():
    logger.info(f"Poller started with {len(adapters)} adapters.")

    async def poll_and_broadcast(adapter):
        global recent_events
        try:
            raw_events = await adapter.poll()
            if not raw_events: return
            
            processed = await processor.process_batch(raw_events)
            if not processed: return

            # 1. Deduplicate by ID
            existing_ids = {ev.get("id") for ev in recent_events if ev.get("id")}
            new_events = [ev for ev in processed if ev.get("id") not in existing_ids]
            if not new_events:
                return # Don't update cache or broadcast if there's nothing new
                
            recent_events.extend(new_events)
            
            # 2. Define sort key
            def get_sort_key(ev):
                ts = ev.get("timestamp")
                if not ts or ts in ["Active", "Now", "Recent"]: return "9999-99-99"
                return ts

            # 3. Pruning: Keep ALL deployments separately, prune only news/alerts
            deployments = [ev for ev in recent_events if ev.get("type") == "deployment"]
            others = [ev for ev in recent_events if ev.get("type") != "deployment"]
            
            others.sort(key=get_sort_key, reverse=True)
            if len(others) > 1000:
                others = others[:1000]
            
            recent_events = deployments + others
            recent_events.sort(key=get_sort_key, reverse=True)

            save_cache() # Persist to disk

            payload = json.dumps({"source": adapter.name, "events": new_events})
            await manager.broadcast(payload)
            logger.info(f"[BROADCAST] {len(processed)} from '{adapter.name}'")
        except Exception as e:
            logger.error(f"Adapter '{adapter.name}' failed: {e}")

    while True:
        # Run all adapters in parallel
        await asyncio.gather(*[poll_and_broadcast(a) for a in adapters], return_exceptions=True)
        # Periodically clean up stale data
        prune_events()
        save_cache()
        await asyncio.sleep(300)


# Removed duplicate health and stats routes

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
