"""
EcoSpatial - RTH Repository
Handles data access for Ruang Terbuka Hijau (Green Open Space) datasets.
Aggregates multiple per-kecamatan RTH CSV files.
"""

import os
import glob
import pandas as pd
from .base_repository import BaseRepository, CsvRepository
from ..utils.name_normalizer import normalize_kecamatan_name


# Column name aliases found across different RTH CSV files
RTH_COLUMN_ALIASES = {
    "kecamatan": ["kecamatan", "nama_kecamatan", "bps_nama_kecamatan"],
    "kelurahan": ["kelurahan", "nama_kelurahan"],
    "luas_rth": ["luas_rth", "luas_rth_ha", "luas_rth_m2", "luas"],
    "satuan": ["satuan"],
    "tahun": ["tahun"],
}


class RTHCityRepository(CsvRepository):
    """
    Repository for city-level aggregate RTH data
    (luas_ruang_terbuka_hijau_rth_di_kota_bandung_2.csv).
    """

    def __init__(self, filepath: str):
        super().__init__(filepath, key_column="jenis_rth")

    def get_total_by_year(self, year: int = None) -> pd.DataFrame:
        """Return total RTH (all types) per year, or for a specific year."""
        df = self.get_all()
        # Exclude RTH Privat from government-managed total
        public = df[df["jenis_rth"] != "RTH PRIVAT"]
        if year:
            public = public[public["tahun"] == year]
        return (
            public.groupby("tahun")["luas_rth"].sum().reset_index(name="total_luas_rth")
        )

    def get_latest_total(self) -> float:
        """Return the latest year's total public RTH in hectares."""
        totals = self.get_total_by_year()
        if totals.empty:
            return 0.0
        return float(totals.loc[totals["tahun"].idxmax(), "total_luas_rth"])

    def get_by_type(self, year: int = None) -> pd.DataFrame:
        """Return RTH breakdown by type (TAMAN KOTA, PEMAKAMAN, etc.)."""
        df = self.get_all()
        if year:
            df = df[df["tahun"] == year]
        latest = df[df["tahun"] == df["tahun"].max()] if not year else df
        return latest[["jenis_rth", "luas_rth"]].copy()


class RTHKecamatanRepository(BaseRepository):
    """
    Aggregates all per-kecamatan RTH CSV files from the dataset folder.
    Performs data wrangling and name normalization automatically.
    """

    def __init__(self, dataset_dir: str):
        self._dataset_dir = dataset_dir
        self._cache: pd.DataFrame | None = None

    def _discover_files(self) -> list[str]:
        """Find all RTH-related CSV files in the dataset directory."""
        patterns = [
            "ls_rng_trbk_hj_*.csv",
            "rng_trbk_hj_*.csv",
            "luas_ruang_terbuka_hijau_rth_berdasarkan_kelurahan*.csv",
        ]
        files = []
        for pattern in patterns:
            files.extend(
                glob.glob(os.path.join(self._dataset_dir, pattern))
            )
        return list(set(files))

    def _resolve_column(self, df: pd.DataFrame, aliases: list[str]) -> str | None:
        """Find the first matching column name from a list of aliases."""
        for alias in aliases:
            if alias in df.columns:
                return alias
        # Case-insensitive fallback
        lower_cols = {c.lower(): c for c in df.columns}
        for alias in aliases:
            if alias.lower() in lower_cols:
                return lower_cols[alias.lower()]
        return None

    def _parse_single_file(self, filepath: str) -> pd.DataFrame | None:
        """Parse one RTH CSV file and standardize its columns."""
        try:
            df = pd.read_csv(filepath, encoding="utf-8-sig")
            rows = []

            # Try to find numeric luas columns
            numeric_cols = df.select_dtypes(include="number").columns.tolist()
            kec_col = self._resolve_column(df, ["kecamatan", "nama_kecamatan", "bps_nama_kecamatan"])
            kel_col = self._resolve_column(df, ["kelurahan", "nama_kelurahan"])
            year_col = self._resolve_column(df, ["tahun"])
            luas_col = self._resolve_column(df, ["luas_rth", "luas_rth_ha", "luas", "luas_rth_m2"])

            if luas_col is None:
                # Try to find it by dtype
                num_candidates = [c for c in numeric_cols if "luas" in c.lower()]
                luas_col = num_candidates[0] if num_candidates else None

            if luas_col is None:
                return None

            record = {
                "kecamatan": df[kec_col].iloc[0] if kec_col else os.path.basename(filepath),
                "kelurahan": None,
                "luas_rth_ha": None,
                "tahun": None,
                "source_file": os.path.basename(filepath),
            }

            # Determine if we need to aggregate by kelurahan
            if kel_col and year_col:
                latest_year = df[year_col].max()
                subset = df[df[year_col] == latest_year]
                total_luas = subset[luas_col].sum()
                kec_name = df[kec_col].iloc[0] if kec_col else None

                # Convert m2 to ha if satuan column suggests it
                satuan_col = self._resolve_column(df, ["satuan"])
                if satuan_col and "M2" in str(df[satuan_col].iloc[0]).upper():
                    total_luas = total_luas / 10000

                record.update({
                    "kecamatan": kec_name,
                    "luas_rth_ha": round(total_luas, 4),
                    "tahun": int(latest_year),
                })
                return pd.DataFrame([record])

            elif year_col:
                latest_year = df[year_col].max()
                subset = df[df[year_col] == latest_year]
                total_luas = subset[luas_col].sum()
                record.update({
                    "luas_rth_ha": round(total_luas, 4),
                    "tahun": int(latest_year),
                })
                return pd.DataFrame([record])

            else:
                total_luas = df[luas_col].sum()
                record["luas_rth_ha"] = round(total_luas, 4)
                return pd.DataFrame([record])

        except Exception as e:
            print(f"[RTHKecamatanRepository] Warning: Could not parse {filepath}: {e}")
            return None

    def _load_and_aggregate(self) -> pd.DataFrame:
        """Load all files and merge into a single kecamatan-level DataFrame."""
        files = self._discover_files()
        frames = []
        for f in files:
            parsed = self._parse_single_file(f)
            if parsed is not None and not parsed.empty:
                frames.append(parsed)

        if not frames:
            return pd.DataFrame(columns=["kecamatan", "kecamatan_norm", "luas_rth_ha"])

        combined = pd.concat(frames, ignore_index=True)
        combined["kecamatan_norm"] = combined["kecamatan"].apply(normalize_kecamatan_name)

        # Aggregate duplicates (same kecamatan from multiple files)
        agg = (
            combined.groupby("kecamatan_norm")["luas_rth_ha"]
            .sum()
            .reset_index()
        )
        # Re-attach original name
        name_map = (
            combined[["kecamatan_norm", "kecamatan"]]
            .drop_duplicates("kecamatan_norm")
        )
        agg = agg.merge(name_map, on="kecamatan_norm", how="left")
        return agg

    def get_all(self) -> pd.DataFrame:
        if self._cache is None:
            self._cache = self._load_and_aggregate()
        return self._cache

    def get_by_id(self, id: str) -> pd.Series | None:
        df = self.get_all()
        norm = normalize_kecamatan_name(id)
        result = df[df["kecamatan_norm"] == norm]
        return result.iloc[0] if not result.empty else None

    def find(self, **kwargs) -> pd.DataFrame:
        df = self.get_all()
        mask = pd.Series([True] * len(df), index=df.index)
        for col, val in kwargs.items():
            if col in df.columns:
                mask &= df[col] == val
        return df[mask]

    def save(self, entity: pd.DataFrame) -> pd.DataFrame:
        out_path = os.path.join(self._dataset_dir, "rth_kecamatan_aggregated.csv")
        entity.to_csv(out_path, index=False, encoding="utf-8-sig")
        self._cache = entity
        return entity

    def save_all(self, entities: list) -> pd.DataFrame:
        combined = pd.concat(entities, ignore_index=True)
        return self.save(combined)

    def invalidate_cache(self):
        self._cache = None
