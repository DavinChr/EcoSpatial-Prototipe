"""
EcoSpatial - Urgency Classification Model
Classifies each kecamatan into RTH urgency tiers using rule-based + ML approach.

Categories:
  HIGH PRIORITY:   RTH < 17% AND density >= HIGH_DENSITY_THRESHOLD
  MEDIUM PRIORITY: RTH 17–25% OR density in medium range
  LOW PRIORITY:    RTH > 25%
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass


# Density thresholds (jiwa/km²) based on Bandung data distribution
HIGH_DENSITY_THRESHOLD = 20_000    # > 20,000 jiwa/km² → tinggi
MEDIUM_DENSITY_THRESHOLD = 10_000  # 10,000–20,000 jiwa/km² → sedang

# RTH thresholds (%)
RTH_CRITICAL = 17.0   # Below target — critical
RTH_WARNING = 25.0    # Between target and safe — warning
# Above 25% → adequate / Low Priority


@dataclass
class UrgencyResult:
    kecamatan: str
    rasio_rth: float
    rasio_rth_ndvi: float
    kepadatan_penduduk: float
    lst_celsius: float
    ndvi_mean: float
    urgensi: str
    skor_urgensi: float
    label_color: str
    rekomendasi: str


class UrgencyClassificationModel:
    """
    Multi-factor urgency scoring model.

    Scoring formula (0–100 scale):
      score = w1 * (1 - rth_norm) + w2 * density_norm + w3 * lst_norm
    where w1=0.50, w2=0.30, w3=0.20

    Final category:
      HIGH:   score >= 65
      MEDIUM: score >= 35
      LOW:    score < 35
    """

    WEIGHTS = {"rth": 0.50, "density": 0.30, "lst": 0.20}
    COLOR_MAP = {
        "HIGH PRIORITY": "#ef4444",    # Red
        "MEDIUM PRIORITY": "#f97316",  # Orange
        "LOW PRIORITY": "#22c55e",     # Green
    }

    def classify_single(
        self,
        kecamatan: str,
        rasio_rth: float,
        rasio_rth_ndvi: float,
        kepadatan: float,
        lst: float,
        ndvi: float,
        max_density: float = 45_000,
        max_lst: float = 35.0,
        min_lst: float = 24.0,
    ) -> UrgencyResult:
        """Classify a single kecamatan."""

        # --- Rule-based hard classification ---
        if rasio_rth_ndvi < RTH_CRITICAL and kepadatan >= HIGH_DENSITY_THRESHOLD:
            rule_cat = "HIGH PRIORITY"
        elif rasio_rth_ndvi > RTH_WARNING:
            rule_cat = "LOW PRIORITY"
        elif RTH_CRITICAL <= rasio_rth_ndvi <= RTH_WARNING or (
            MEDIUM_DENSITY_THRESHOLD <= kepadatan < HIGH_DENSITY_THRESHOLD
        ):
            rule_cat = "MEDIUM PRIORITY"
        else:
            rule_cat = "HIGH PRIORITY"

        # --- Numeric scoring (for ranking within category) ---
        rth_norm = np.clip(rasio_rth_ndvi / 30.0, 0, 1)       # 30% = target
        density_norm = np.clip(kepadatan / max_density, 0, 1)
        lst_norm = np.clip((lst - min_lst) / (max_lst - min_lst), 0, 1)

        score = (
            self.WEIGHTS["rth"] * (1 - rth_norm) +
            self.WEIGHTS["density"] * density_norm +
            self.WEIGHTS["lst"] * lst_norm
        ) * 100

        # Override category if score is extremely high/low
        if score >= 72:
            final_cat = "HIGH PRIORITY"
        elif score >= 38:
            final_cat = rule_cat if rule_cat != "LOW PRIORITY" else "MEDIUM PRIORITY"
        else:
            final_cat = "LOW PRIORITY"

        # Use rule_cat as the primary decision, score for ordering
        rekomendasi = self._build_recommendation(final_cat, rasio_rth_ndvi, kepadatan, lst)

        return UrgencyResult(
            kecamatan=kecamatan,
            rasio_rth=round(rasio_rth, 2),
            rasio_rth_ndvi=round(rasio_rth_ndvi, 2),
            kepadatan_penduduk=round(kepadatan, 0),
            lst_celsius=round(lst, 2),
            ndvi_mean=round(ndvi, 4),
            urgensi=final_cat,
            skor_urgensi=round(score, 2),
            label_color=self.COLOR_MAP[final_cat],
            rekomendasi=rekomendasi,
        )

    def classify_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Classify an entire DataFrame of kecamatan.

        Required columns: kecamatan_norm, rasio_rth, rasio_rth_ndvi,
                          kepadatan_penduduk, lst_celsius, ndvi_mean
        """
        max_density = df["kepadatan_penduduk"].max()
        max_lst = df["lst_celsius"].max()
        min_lst = df["lst_celsius"].min()

        results = []
        for _, row in df.iterrows():
            result = self.classify_single(
                kecamatan=row["kecamatan_norm"],
                rasio_rth=row.get("rasio_rth", 0),
                rasio_rth_ndvi=row.get("rasio_rth_ndvi", 0),
                kepadatan=row.get("kepadatan_penduduk", 0),
                lst=row.get("lst_celsius", 28),
                ndvi=row.get("ndvi_mean", 0.2),
                max_density=max_density,
                max_lst=max_lst,
                min_lst=min_lst,
            )
            results.append(result.__dict__)

        result_df = pd.DataFrame(results)
        return df.merge(result_df, on="kecamatan_norm", how="left", suffixes=("", "_model"))

    def _build_recommendation(
        self, category: str, rasio_rth: float, kepadatan: float, lst: float
    ) -> str:
        if category == "HIGH PRIORITY":
            return (
                f"⚠️ URGENSI TINGGI — RTH hanya {rasio_rth:.1f}% dengan kepadatan "
                f"{kepadatan:,.0f} jiwa/km². Prioritaskan konversi lahan idle dan rooftop "
                f"greening segera. Target: +{30 - rasio_rth:.1f}% RTH tambahan."
            )
        elif category == "MEDIUM PRIORITY":
            return (
                f"🟡 PERHATIAN — RTH {rasio_rth:.1f}% mendekati batas minimal. "
                f"Dorong program PKLH dan penghijauan koridor jalan. "
                f"LST rata-rata {lst:.1f}°C."
            )
        else:
            return (
                f"✅ RELATIF BAIK — RTH {rasio_rth:.1f}% sudah melampaui target 17%. "
                f"Pertahankan dan tingkatkan kualitas RTH eksisting."
            )
