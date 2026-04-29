"""
EcoSpatial - Main Data Pipeline
Orchestrates: Data Discovery → Wrangling → Feature Engineering → Classification → Output

Usage:
    python -m src.pipelines.main_pipeline
"""

import os
import sys
import json
import logging
import pandas as pd

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.repositories.population_repository import PopulationRepository
from src.repositories.rth_repository import RTHKecamatanRepository, RTHCityRepository
from src.repositories.boundary_repository import BoundaryRepository
from src.services.remote_sensing_service import RemoteSensingService
from src.models.urgency_classifier import UrgencyClassificationModel
from src.utils.name_normalizer import normalize_kecamatan_name

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("EcoSpatial.Pipeline")

# ─────────────────────────────────────────
# Path configuration
# ─────────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DATASET_DIR = os.path.join(BASE_DIR, "..", "Dataset")
DATA_OUT_DIR = os.path.join(BASE_DIR, "data", "outputs")
os.makedirs(DATA_OUT_DIR, exist_ok=True)

POPULATION_CSV = os.path.join(DATASET_DIR, "jumlah_kepadatan_penduduk_di_kota_bandung_3.csv")
RTH_CITY_CSV = os.path.join(DATASET_DIR, "luas_ruang_terbuka_hijau_rth_di_kota_bandung_2.csv")
BOUNDARY_CSV = os.path.join(DATASET_DIR, "bataskecamatan.csv")


def run_pipeline() -> dict:
    """
    Execute the full EcoSpatial data pipeline.
    Returns a dict with all computed DataFrames and summary metrics.
    """
    logger.info("=" * 60)
    logger.info("🌿 EcoSpatial Pipeline — Starting")
    logger.info("=" * 60)

    # ── STEP 1: Data Discovery & Loading ──────────────────────────
    logger.info("[1/5] Loading repositories...")

    pop_repo = PopulationRepository(POPULATION_CSV)
    boundary_repo = BoundaryRepository(BOUNDARY_CSV)
    rth_kec_repo = RTHKecamatanRepository(DATASET_DIR)
    rth_city_repo = RTHCityRepository(RTH_CITY_CSV)

    pop_df = pop_repo.get_latest()
    boundary_df = boundary_repo.get_all()
    rth_kec_df = rth_kec_repo.get_all()
    city_rth_total = rth_city_repo.get_latest_total()

    logger.info(f"  ✔ Population records loaded: {len(pop_df)}")
    logger.info(f"  ✔ Boundary records loaded: {len(boundary_df)}")
    logger.info(f"  ✔ RTH kecamatan records: {len(rth_kec_df)}")
    logger.info(f"  ✔ City total RTH (public): {city_rth_total:.2f} ha")

    # ── STEP 2: Data Wrangling & Integration ──────────────────────
    logger.info("[2/5] Wrangling & joining datasets...")

    # Normalize and align population data
    pop_df["kecamatan_norm"] = pop_df["kemendagri_nama_kecamatan"].apply(normalize_kecamatan_name)
    pop_clean = pop_df[["kecamatan_norm", "kepadatan_penduduk"]].copy()

    # Build master kecamatan table from boundary data
    master = boundary_df[["kecamatan_norm", "kecamatan", "luas_wilayah_ha", "bpskodkec"]].copy()

    # Merge population
    master = master.merge(pop_clean, on="kecamatan_norm", how="left")

    # Merge RTH by kecamatan (public data)
    rth_kec_clean = rth_kec_df[["kecamatan_norm", "luas_rth_ha"]].rename(
        columns={"luas_rth_ha": "luas_rth_publik_ha"}
    )
    master = master.merge(rth_kec_clean, on="kecamatan_norm", how="left")
    master["luas_rth_publik_ha"] = master["luas_rth_publik_ha"].fillna(0)

    # Compute RTH ratio from public data
    master["rasio_rth"] = (master["luas_rth_publik_ha"] / master["luas_wilayah_ha"]) * 100
    master["rasio_rth"] = master["rasio_rth"].clip(0, 100).round(2)

    logger.info(f"  ✔ Master table built: {len(master)} kecamatan rows")
    logger.info(f"  ✔ Missing population: {master['kepadatan_penduduk'].isna().sum()}")
    logger.info(f"  ✔ Missing RTH: {master['luas_rth_publik_ha'].eq(0).sum()}")

    # ── STEP 3: Feature Engineering (Remote Sensing) ──────────────
    logger.info("[3/5] Computing NDVI & LST via Remote Sensing Service...")

    rs_service = RemoteSensingService(seed=42)
    rs_input = master[["kecamatan_norm", "luas_wilayah_ha"]].to_dict("records")
    rs_df = rs_service.process_kecamatan_batch(rs_input)

    master = master.merge(rs_df, on="kecamatan_norm", how="left")

    # Compute AI-detected RTH ratio from NDVI
    master["rasio_rth_ndvi"] = (master["luas_rth_ndvi_ha"] / master["luas_wilayah_ha"]) * 100
    master["rasio_rth_ndvi"] = master["rasio_rth_ndvi"].clip(0, 100).round(2)

    # Fill any missing kepadatan with district median
    median_density = master["kepadatan_penduduk"].median()
    master["kepadatan_penduduk"] = master["kepadatan_penduduk"].fillna(median_density)

    logger.info(f"  ✔ NDVI computed for {len(master)} kecamatan")
    logger.info(f"  ✔ Mean city NDVI: {master['ndvi_mean'].mean():.4f}")
    logger.info(f"  ✔ Mean LST: {master['lst_celsius'].mean():.2f}°C")

    # ── STEP 4: Classification ─────────────────────────────────────
    logger.info("[4/5] Running urgency classification model...")

    classifier = UrgencyClassificationModel()
    classified = classifier.classify_dataframe(master)

    high = len(classified[classified["urgensi"] == "HIGH PRIORITY"])
    medium = len(classified[classified["urgensi"] == "MEDIUM PRIORITY"])
    low = len(classified[classified["urgensi"] == "LOW PRIORITY"])

    logger.info(f"  ✔ HIGH PRIORITY: {high} kecamatan")
    logger.info(f"  ✔ MEDIUM PRIORITY: {medium} kecamatan")
    logger.info(f"  ✔ LOW PRIORITY: {low} kecamatan")

    # ── STEP 5: Output Generation ──────────────────────────────────
    logger.info("[5/5] Saving outputs...")

    # Save master classified data
    out_csv = os.path.join(DATA_OUT_DIR, "ecospatial_master.csv")
    classified.to_csv(out_csv, index=False, encoding="utf-8-sig")

    # Compute summary metrics
    total_rth_ai = classified["luas_rth_ndvi_ha"].sum()
    kota_luas = classified["luas_wilayah_ha"].sum()
    rasio_kota_publik = (city_rth_total / kota_luas) * 100
    rasio_kota_ai = (total_rth_ai / kota_luas) * 100

    # Most urgent kecamatan
    top_urgent = classified.sort_values("skor_urgensi", ascending=False).iloc[0]

    summary = {
        "total_kecamatan": len(classified),
        "luas_kota_ha": round(kota_luas, 2),
        "rth_publik_total_ha": round(city_rth_total, 2),
        "rth_ai_total_ha": round(total_rth_ai, 2),
        "rasio_rth_publik_pct": round(rasio_kota_publik, 2),
        "rasio_rth_ai_pct": round(rasio_kota_ai, 2),
        "mean_lst_celsius": round(classified["lst_celsius"].mean(), 2),
        "mean_ndvi": round(classified["ndvi_mean"].mean(), 4),
        "high_priority_count": high,
        "medium_priority_count": medium,
        "low_priority_count": low,
        "most_urgent_kecamatan": top_urgent["kecamatan_norm"],
        "most_urgent_score": round(top_urgent["skor_urgensi"], 2),
        "most_urgent_rth_pct": round(top_urgent["rasio_rth_ndvi"], 2),
    }

    summary_path = os.path.join(DATA_OUT_DIR, "ecospatial_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    logger.info(f"  ✔ Master CSV saved: {out_csv}")
    logger.info(f"  ✔ Summary JSON saved: {summary_path}")
    logger.info("=" * 60)
    logger.info("🌿 EcoSpatial Pipeline — COMPLETED SUCCESSFULLY")
    logger.info(f"   RTH Kota (Publik): {rasio_kota_publik:.1f}% | AI: {rasio_kota_ai:.1f}%")
    logger.info(f"   Most Urgent: {top_urgent['kecamatan_norm']} (score={top_urgent['skor_urgensi']:.1f})")
    logger.info("=" * 60)

    return {
        "master_df": classified,
        "summary": summary,
        "rth_city_df": rth_city_repo.get_by_type(),
    }


if __name__ == "__main__":
    run_pipeline()
