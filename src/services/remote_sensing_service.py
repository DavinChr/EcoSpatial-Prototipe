"""
EcoSpatial - NDVI & LST Remote Sensing Feature Engineering Service
Simulates/calculates NDVI and Land Surface Temperature from satellite data.

In production: connect to GEE (Google Earth Engine) or Sentinel Hub API.
For prototype: uses calibrated synthetic data derived from real RTH ratios.
"""

import math
import random
import numpy as np
import pandas as pd
from typing import Optional


# Bandung City bounding box (WGS84)
BANDUNG_BBOX = {
    "min_lat": -7.0350,
    "max_lat": -6.8250,
    "min_lon": 107.5500,
    "max_lon": 107.7500,
}

# Known vegetation cover proxies per kecamatan (from RTH ratio + green area knowledge)
# Values represent approximate vegetation fraction [0..1]
NDVI_SEED_MAP: dict[str, float] = {
    "CIDADAP": 0.58,
    "COBLONG": 0.42,
    "SUKASARI": 0.38,
    "CIBEUNYING KALER": 0.35,
    "ARCAMANIK": 0.33,
    "RANCASARI": 0.31,
    "BUAHBATU": 0.30,
    "GEDEBAGE": 0.44,
    "CINAMBO": 0.40,
    "MANDALAJATI": 0.36,
    "PANYILEUKAN": 0.28,
    "CIBIRU": 0.29,
    "UJUNGBERUNG": 0.25,
    "ANTAPANI": 0.22,
    "BANDUNG KIDUL": 0.20,
    "BANDUNG WETAN": 0.21,
    "SUMUR BANDUNG": 0.18,
    "ANDIR": 0.15,
    "CICENDO": 0.16,
    "SUKAJADI": 0.17,
    "REGOL": 0.14,
    "ASTANA ANYAR": 0.13,
    "KIARACONDONG": 0.13,
    "LENGKONG": 0.15,
    "BATUNUNGGAL": 0.12,
    "BOJONGLOA KIDUL": 0.11,
    "BABAKAN CIPARAY": 0.14,
    "BANDUNG KULON": 0.12,
    "BOJONGLOA KALER": 0.10,
    "CIBEUNYING KIDUL": 0.16,
}


class RemoteSensingService:
    """
    Computes NDVI, LST, and derived RTH metrics for each kecamatan.

    NDVI formula: (NIR - RED) / (NIR + RED)
    NDVI > 0.3 → vegetation, 0.1–0.3 → sparse, < 0.1 → built-up

    LST estimation from NDVI (inverse relationship):
    LST = T_ref + (1 - NDVI) * delta_T
    where T_ref = min urban temp, delta_T = heat island effect range
    """

    LST_BASE = 25.0       # Celsius – cool, vegetated base temperature
    LST_DELTA = 8.0       # Max heat island delta across kecamatan
    NDVI_RTH_THRESHOLD = 0.25  # NDVI value considered as RTH-quality vegetation

    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)

    def compute_ndvi(self, kecamatan: str, luas_wilayah_ha: float = 100.0) -> dict:
        """
        Compute NDVI statistics for a kecamatan.
        Returns mean NDVI, std, and pixel count estimate.
        """
        base = NDVI_SEED_MAP.get(kecamatan.upper(), 0.20)
        # Add realistic spatial variation
        noise = np.random.normal(0, 0.03)
        ndvi_mean = float(np.clip(base + noise, 0.05, 0.75))
        ndvi_std = float(np.clip(abs(random.gauss(0.08, 0.02)), 0.03, 0.15))

        # Estimate RTH area from NDVI (pixels with NDVI > threshold)
        # Pixel coverage ratio approximately scales with NDVI mean
        rth_fraction = max(0.0, (ndvi_mean - 0.10) / 0.65)
        luas_rth_ndvi = round(rth_fraction * luas_wilayah_ha, 2)

        return {
            "ndvi_mean": round(ndvi_mean, 4),
            "ndvi_std": round(ndvi_std, 4),
            "ndvi_min": round(max(0.0, ndvi_mean - 2 * ndvi_std), 4),
            "ndvi_max": round(min(1.0, ndvi_mean + 2 * ndvi_std), 4),
            "luas_rth_ndvi_ha": luas_rth_ndvi,
        }

    def compute_lst(self, ndvi_mean: float) -> float:
        """
        Estimate Land Surface Temperature from NDVI.
        Higher vegetation → lower LST.
        LST = BASE + DELTA × (1 – normalized_NDVI)
        """
        normalized_ndvi = np.clip(ndvi_mean / 0.75, 0, 1)
        lst = self.LST_BASE + self.LST_DELTA * (1.0 - normalized_ndvi)
        noise = random.gauss(0, 0.3)
        return round(float(lst) + noise, 2)

    def process_kecamatan_batch(
        self,
        kecamatan_list: list[dict],
    ) -> pd.DataFrame:
        """
        Process a batch of kecamatan records and compute all RS features.

        Args:
            kecamatan_list: list of dicts with 'kecamatan_norm' and 'luas_wilayah_ha'

        Returns:
            DataFrame with NDVI, LST, and derived RTH columns
        """
        results = []
        for row in kecamatan_list:
            kec = row.get("kecamatan_norm", "")
            luas = row.get("luas_wilayah_ha", 100.0)

            ndvi_data = self.compute_ndvi(kec, luas)
            lst = self.compute_lst(ndvi_data["ndvi_mean"])

            results.append({
                "kecamatan_norm": kec,
                **ndvi_data,
                "lst_celsius": lst,
            })

        return pd.DataFrame(results)
