"""
EcoSpatial - Kecamatan Name Normalizer
Standardizes district names across all CSV files for reliable merging.
"""

import re
import unicodedata


# Canonical name mapping: various spellings → standard form
KECAMATAN_ALIASES: dict[str, str] = {
    # Astana Anyar variants
    "astanaanyar": "ASTANA ANYAR",
    "astana anyar": "ASTANA ANYAR",
    "astana_anyar": "ASTANA ANYAR",
    # Ujungberung variants
    "ujung berung": "UJUNGBERUNG",
    "ujungberung": "UJUNGBERUNG",
    # Bojongloa variants
    "bojongloa kaler": "BOJONGLOA KALER",
    "bojongloa kidul": "BOJONGLOA KIDUL",
    # Cibeunying variants
    "cibeunying kaler": "CIBEUNYING KALER",
    "cibeunying kidul": "CIBEUNYING KIDUL",
    # Bandung variants
    "bandung kidul": "BANDUNG KIDUL",
    "bandung kulon": "BANDUNG KULON",
    "bandung wetan": "BANDUNG WETAN",
    # Sumur Bandung
    "sumur bandung": "SUMUR BANDUNG",
    "sumbang": "SUMUR BANDUNG",  # common abbreviation
    # Others
    "babakan ciparay": "BABAKAN CIPARAY",
    "buah batu": "BUAHBATU",
    "buahbatu": "BUAHBATU",
    "coblong": "COBLONG",
    "cicendo": "CICENDO",
    "cidadap": "CIDADAP",
    "cinambo": "CINAMBO",
    "cibiru": "CIBIRU",
    "antapani": "ANTAPANI",
    "arcamanik": "ARCAMANIK",
    "andir": "ANDIR",
    "batununggal": "BATUNUNGGAL",
    "gedebage": "GEDEBAGE",
    "kiaracondong": "KIARACONDONG",
    "lengkong": "LENGKONG",
    "mandalajati": "MANDALAJATI",
    "panyileukan": "PANYILEUKAN",
    "rancasari": "RANCASARI",
    "regol": "REGOL",
    "sukajadi": "SUKAJADI",
    "sukasari": "SUKASARI",
}


def normalize_kecamatan_name(name: str) -> str:
    """
    Normalize a kecamatan name to a canonical uppercase form.
    Steps:
      1. Strip whitespace and convert to lowercase
      2. Remove diacritics (normalize unicode)
      3. Replace underscores/hyphens with spaces
      4. Look up in alias table; return canonical name
      5. Fall back to uppercase stripped version
    """
    if not isinstance(name, str):
        return str(name).upper().strip()

    # Step 1: Basic cleanup
    cleaned = name.strip().lower()

    # Step 2: Remove diacritics
    cleaned = "".join(
        c for c in unicodedata.normalize("NFD", cleaned)
        if unicodedata.category(c) != "Mn"
    )

    # Step 3: Normalize separators
    cleaned = re.sub(r"[_\-]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Step 4: Alias lookup
    if cleaned in KECAMATAN_ALIASES:
        return KECAMATAN_ALIASES[cleaned]

    # Step 5: Fallback to uppercase
    return cleaned.upper()


def get_all_canonical_names() -> list[str]:
    """Return sorted list of all canonical kecamatan names."""
    return sorted(set(KECAMATAN_ALIASES.values()))
