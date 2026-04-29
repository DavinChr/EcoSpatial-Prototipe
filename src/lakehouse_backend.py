"""
EcoSpatial - Task 1: Repository Pattern Implementation
Backend terintegrasi dengan Microsoft Fabric Lakehouse (Simulasi).
"""

import pandas as pd
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EcoSpatial.Backend")

# 1. DataRepository: Pembacaan file CSV dari folder 'Antigravity' (Lakehouse)
class DataRepository:
    def __init__(self, lakehouse_path: str):
        self.lakehouse_path = lakehouse_path
        self._cache = {}

    def fetch_population_data(self) -> pd.DataFrame:
        """Mengambil data kepadatan penduduk dari Lakehouse."""
        logger.info(f"[DataRepository] Fetching population data from {self.lakehouse_path}")
        # Simulasi fetch data CSV dari Lakehouse
        data = {
            "kecamatan": ["Andir", "Astana Anyar", "Babakan Ciparay", "Bandung Kidul", "Buahbatu"],
            "kepadatan_penduduk": [23577, 27468, 20160, 11301, 13955],
            "luas_rth_publik_pct": [12.5, 10.1, 14.2, 18.5, 28.5]
        }
        return pd.DataFrame(data)


# 2. SatelliteRepository: Memproses NDVI dan LST hasil ekstraksi API
class SatelliteRepository:
    def __init__(self, api_endpoint: str):
        self.api_endpoint = api_endpoint

    def extract_satellite_features(self, bbox: Dict[str, float]) -> pd.DataFrame:
        """Memanggil API Sentinel/Landsat untuk ekstraksi fitur spasial (NDVI, LST)."""
        logger.info(f"[SatelliteRepository] Extracting features via {self.api_endpoint} for bbox {bbox}")
        # Simulasi hasil ekstraksi raster -> tabular per kecamatan
        data = {
            "kecamatan": ["Andir", "Astana Anyar", "Babakan Ciparay", "Bandung Kidul", "Buahbatu"],
            "ndvi_mean": [0.15, 0.13, 0.14, 0.20, 0.30],
            "lst_mean": [32.4, 33.1, 31.8, 29.5, 27.5],
            "luas_rth_satelit_pct": [15.2, 13.5, 16.8, 21.0, 31.2]
        }
        return pd.DataFrame(data)


# 3. UrgancyService: Logika klasifikasi berdasarkan hasil join repository
class UrgancyService:
    def __init__(self, data_repo: DataRepository, sat_repo: SatelliteRepository):
        self.data_repo = data_repo
        self.sat_repo = sat_repo

    def calculate_urgency(self) -> pd.DataFrame:
        """Join data, hitung skor, dan klasifikasikan urgensi (High/Medium/Low)."""
        # Fetch from Lakehouse (CSV)
        df_demografi = self.data_repo.fetch_population_data()
        
        # Fetch from Satellite API
        bbox_bandung = {"min_lat": -7.0, "max_lat": -6.8, "min_lon": 107.5, "max_lon": 107.7}
        df_satelit = self.sat_repo.extract_satellite_features(bbox_bandung)

        # Inner Join berdasarkan nama kecamatan (Pembersihan format jika diperlukan)
        df_joined = pd.merge(df_demografi, df_satelit, on="kecamatan", how="inner")

        # Feature Engineering: Hitung Skor Urgensi
        # Skor 0-100: Kepadatan tinggi & RTH rendah = Skor mendekati 100
        df_joined["skor_urgensi"] = df_joined.apply(
            lambda x: min(100, max(0, (x["kepadatan_penduduk"] / 30000 * 50) + ((30 - x["luas_rth_satelit_pct"]) * 2))), 
            axis=1
        )

        # Classification Logic
        def classify(row):
            if row["luas_rth_satelit_pct"] < 17 and row["kepadatan_penduduk"] >= 20000:
                return "HIGH PRIORITY"
            elif row["luas_rth_satelit_pct"] > 25:
                return "LOW PRIORITY"
            else:
                return "MEDIUM PRIORITY"

        df_joined["kategori_urgensi"] = df_joined.apply(classify, axis=1)
        
        logger.info("[UrgancyService] Klasifikasi selesai dieksekusi.")
        return df_joined


if __name__ == "__main__":
    # Test Dependency Injection & Pattern Implementation
    data_lakehouse = DataRepository("abfss://Antigravity@onelake.dfs.fabric.microsoft.com/Data")
    sat_api = SatelliteRepository("https://api.earth-engine.google.com/v1/projects/ecospatial")
    
    service = UrgancyService(data_lakehouse, sat_api)
    hasil_analisis = service.calculate_urgency()
    
    print("\n=== HASIL ANALISIS ECOSPATIAL ===")
    print(hasil_analisis[["kecamatan", "kategori_urgensi", "skor_urgensi"]].to_string())
