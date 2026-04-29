# 🌿 EcoSpatial — Intelligence Platform

EcoSpatial adalah prototipe Sistem Intelijen Spasial untuk mitigasi krisis Ruang Terbuka Hijau (RTH) di Kota Bandung. Proyek ini memadukan data kependudukan (pemerintah) dengan hasil analisis citra satelit (NDVI & LST) menggunakan pendekatan kecerdasan buatan, guna menentukan skor urgensi penambahan RTH per kecamatan.

## ✨ Fitur Utama
1. **Interactive Spatial Map**: Visualisasi kepadatan penduduk (Heatmap) dan kondisi RTH aktual per kecamatan menggunakan Leaflet.js.
2. **AI-driven Analytics**: Model penentuan tingkat urgensi (High/Medium/Low Priority) menggunakan analisis rasio RTH (NDVI) dan Land Surface Temperature (LST).
3. **Dynamic Dashboard**: Real-time metric cards dan visualisasi komparatif (Chart.js) antara data pemerintah dan ekstraksi satelit.
4. **Lakehouse Architecture Ready**: Dibangun menggunakan pola *Repository Pattern* di sisi backend (Python) agar mudah diintegrasikan dengan arsitektur data modern (misal: Microsoft Fabric Lakehouse atau Azure ML).

## 📂 Struktur Repositori
```text
EcoSpatial/
├── dashboard/               # Frontend Dashboard (HTML, CSS, JS)
│   ├── index.html           # Main UI
│   ├── dashboard.css        # Premium Dark Theme Styles
│   └── dashboard.js         # Map, Charts, dan API Integration Stub
├── data/                    # Output data pipeline
├── src/                     # Backend Pipeline & Services (Python)
│   ├── models/              # Logika klasifikasi dan skoring
│   ├── pipelines/           # Main ETL Data Pipeline
│   ├── repositories/        # Implementasi Repository Pattern (Data Access)
│   ├── services/            # Service integrasi (Satelit, dll)
│   ├── utils/               # Utilitas (normalisasi teks, dll)
│   └── lakehouse_backend.py # Contoh wrapper untuk Lakehouse dan API
├── requirements.txt         # Dependensi Python
└── README.md
```

## 🚀 Cara Menjalankan Prototipe

### 1. Menjalankan Dashboard (Frontend)
Karena dashboard ini dibangun menggunakan antarmuka web modern (Vanilla JS, HTML, CSS), Anda tidak memerlukan server khusus untuk melihat prototipenya.
1. Buka folder `dashboard/`.
2. Klik ganda file `index.html` untuk membukanya di browser modern (Chrome, Edge, Firefox).

*Tips: Jika ingin di-*deploy* ke **GitHub Pages**, Anda cukup mengubah struktur repositori sehingga `dashboard/index.html` berada di root, atau menyetel `dashboard/` sebagai *source* di pengaturan GitHub Pages.*

### 2. Menjalankan Backend Pipeline (Python)
Jika Anda ingin menjalankan atau memodifikasi pipeline pemrosesan data:
1. Pastikan Python 3.10+ sudah terinstal.
2. Buat virtual environment (opsional namun disarankan).
3. Instal dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan script backend atau pipeline:
   ```bash
   python src/lakehouse_backend.py
   # atau
   python -m src.pipelines.main_pipeline
   ```

## 🛠 Teknologi yang Digunakan
* **Frontend**: HTML5, CSS3, JavaScript (ES6+), Leaflet.js, Chart.js.
* **Backend**: Python, Pandas.
* **Architecture**: Repository Pattern.
