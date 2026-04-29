"""
EcoSpatial - Base Repository Pattern
Provides a generic, abstract interface for all data access layers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypeVar, Generic
import pandas as pd

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository defining the standard CRUD interface.
    All concrete repositories must implement these methods.
    """

    @abstractmethod
    def get_all(self) -> List[T]:
        """Retrieve all records."""
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, id: Any) -> Optional[T]:
        """Retrieve a single record by its identifier."""
        raise NotImplementedError

    @abstractmethod
    def find(self, **kwargs) -> List[T]:
        """Find records matching given criteria."""
        raise NotImplementedError

    @abstractmethod
    def save(self, entity: T) -> T:
        """Persist a single entity."""
        raise NotImplementedError

    @abstractmethod
    def save_all(self, entities: List[T]) -> List[T]:
        """Persist a list of entities."""
        raise NotImplementedError


class CsvRepository(BaseRepository[pd.DataFrame]):
    """
    Concrete CSV repository implementation.
    Reads, caches, and provides access to CSV data files.
    """

    def __init__(self, filepath: str, key_column: str = None):
        self._filepath = filepath
        self._key_column = key_column
        self._cache: Optional[pd.DataFrame] = None

    def _load(self) -> pd.DataFrame:
        if self._cache is None:
            self._cache = pd.read_csv(self._filepath, encoding="utf-8-sig")
        return self._cache

    def get_all(self) -> pd.DataFrame:
        return self._load()

    def get_by_id(self, id: Any) -> Optional[pd.Series]:
        df = self._load()
        if self._key_column and self._key_column in df.columns:
            result = df[df[self._key_column] == id]
            return result.iloc[0] if not result.empty else None
        return None

    def find(self, **kwargs) -> pd.DataFrame:
        df = self._load()
        mask = pd.Series([True] * len(df), index=df.index)
        for col, val in kwargs.items():
            if col in df.columns:
                mask &= df[col] == val
        return df[mask]

    def save(self, entity: pd.DataFrame) -> pd.DataFrame:
        entity.to_csv(self._filepath, index=False, encoding="utf-8-sig")
        self._cache = entity
        return entity

    def save_all(self, entities: List[pd.DataFrame]) -> pd.DataFrame:
        combined = pd.concat(entities, ignore_index=True)
        return self.save(combined)

    def invalidate_cache(self):
        """Force reload on next access."""
        self._cache = None
