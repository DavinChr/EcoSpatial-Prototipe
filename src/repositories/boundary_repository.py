"""
EcoSpatial - Boundary Repository
Handles spatial boundary data for Bandung kecamatan (districts).
"""

import pandas as pd
from .base_repository import CsvRepository
from ..utils.name_normalizer import normalize_kecamatan_name


class BoundaryRepository(CsvRepository):
    """
    Repository for bataskecamatan.csv.
    Provides district boundaries and area (shape_area in m²).
    """

    def __init__(self, filepath: str):
        super().__init__(filepath, key_column="kecamatan")

    def get_all(self) -> pd.DataFrame:
        df = super().get_all()
        df = df[df["kecamatan"].notna()].copy()
        df["kecamatan_norm"] = df["kecamatan"].apply(normalize_kecamatan_name)
        # Convert shape_area from m² to ha (1 ha = 10,000 m²)
        df["luas_wilayah_ha"] = df["shape_area"] / 10_000
        return df

    def get_by_kecamatan(self, name: str) -> pd.Series | None:
        df = self.get_all()
        norm = normalize_kecamatan_name(name)
        result = df[df["kecamatan_norm"] == norm]
        return result.iloc[0] if not result.empty else None

    def get_area_map(self) -> dict[str, float]:
        """Return {kecamatan_norm: luas_wilayah_ha} mapping."""
        df = self.get_all()
        return dict(zip(df["kecamatan_norm"], df["luas_wilayah_ha"]))

    def get_bps_code_map(self) -> dict[str, str]:
        """Return {kecamatan_norm: bpskodkec} mapping."""
        df = self.get_all()
        return dict(zip(df["kecamatan_norm"], df["bpskodkec"].astype(str)))
