"""
EcoSpatial - Population Repository
Handles data access for Bandung population density data.
"""

import os
import pandas as pd
from .base_repository import CsvRepository
from ..utils.name_normalizer import normalize_kecamatan_name


class PopulationRepository(CsvRepository):
    """
    Repository for jumlah_kepadatan_penduduk data.
    Normalizes district names and filters for the latest year.
    """

    REQUIRED_COLUMNS = ["kemendagri_nama_kecamatan", "kepadatan_penduduk", "tahun"]

    def __init__(self, filepath: str):
        super().__init__(filepath, key_column="kemendagri_nama_kecamatan")

    def get_latest(self) -> pd.DataFrame:
        """Return population data for the most recent year available."""
        df = self.get_all()
        df = self._normalize(df)
        latest_year = df["tahun"].max()
        return df[df["tahun"] == latest_year].copy()

    def get_by_kecamatan(self, kecamatan: str, year: int = None) -> pd.Series | None:
        """Retrieve population data for a specific district, optionally for a given year."""
        df = self.get_all()
        df = self._normalize(df)
        norm_name = normalize_kecamatan_name(kecamatan)
        subset = df[df["kecamatan_norm"] == norm_name]
        if year:
            subset = subset[subset["tahun"] == year]
        else:
            subset = subset[subset["tahun"] == subset["tahun"].max()]
        return subset.iloc[0] if not subset.empty else None

    def get_time_series(self, kecamatan: str) -> pd.DataFrame:
        """Return multi-year time series for a given district."""
        df = self.get_all()
        df = self._normalize(df)
        norm_name = normalize_kecamatan_name(kecamatan)
        return df[df["kecamatan_norm"] == norm_name].sort_values("tahun")

    def _normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["kecamatan_norm"] = df["kemendagri_nama_kecamatan"].apply(
            normalize_kecamatan_name
        )
        return df
