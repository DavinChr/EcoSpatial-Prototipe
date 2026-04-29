/**
 * EcoSpatial Dashboard Logic
 * Menangani UI, Map Rendering, Charts, dan Simulasi API (Lakehouse / Azure ML)
 */

// ============================================================================
// 1. STATE MANAGEMENT & API STUB (Task 3: Integration)
// ============================================================================

const state = {
    geojsonData: null,
    analyticsData: [],
    currentLayer: 'heatmap', // 'heatmap', 'rth', 'urgency'
    mapInstance: null,
    heatLayer: null,
    polygonLayer: null
};

/**
 * Mensimulasikan pemanggilan API ke Azure ML Endpoint / Microsoft Fabric Lakehouse.
 * Dalam produksi, ini akan menggunakan fetch() ke REST API backend.
 */
async function fetchAnalyticsData() {
    return new Promise((resolve, reject) => {
        console.log("[API] Fetching data from Lakehouse/Azure ML...");
        
        // Simulasi network delay
        setTimeout(() => {
            try {
                // Simulasi data hasil dari UrgancyService backend
                const mockData = [
                    { kecamatan: 'Andir', rasio_rth: 12.5, rasio_rth_ndvi: 15.2, kepadatan: 23577, ndvi: 0.15, lst: 32.4, skor: 85, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Astana Anyar', rasio_rth: 10.1, rasio_rth_ndvi: 13.5, kepadatan: 27468, ndvi: 0.13, lst: 33.1, skor: 92, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Babakan Ciparay', rasio_rth: 14.2, rasio_rth_ndvi: 16.8, kepadatan: 20160, ndvi: 0.14, lst: 31.8, skor: 80, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Bandung Kidul', rasio_rth: 18.5, rasio_rth_ndvi: 21.0, kepadatan: 11301, ndvi: 0.20, lst: 29.5, skor: 55, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Bandung Kulon', rasio_rth: 16.3, rasio_rth_ndvi: 18.4, kepadatan: 19656, ndvi: 0.17, lst: 30.2, skor: 68, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Bandung Wetan', rasio_rth: 20.1, rasio_rth_ndvi: 22.5, kepadatan: 8391, ndvi: 0.21, lst: 28.9, skor: 45, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Batununggal', rasio_rth: 11.2, rasio_rth_ndvi: 14.1, kepadatan: 25236, ndvi: 0.12, lst: 32.8, skor: 88, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Bojongloa Kaler', rasio_rth: 9.5, rasio_rth_ndvi: 12.0, kepadatan: 39906, ndvi: 0.10, lst: 34.0, skor: 98, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Bojongloa Kidul', rasio_rth: 15.1, rasio_rth_ndvi: 17.5, kepadatan: 16907, ndvi: 0.16, lst: 30.5, skor: 65, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Buahbatu', rasio_rth: 28.5, rasio_rth_ndvi: 31.2, kepadatan: 13955, ndvi: 0.30, lst: 27.5, skor: 25, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Cibeunying Kaler', rasio_rth: 32.1, rasio_rth_ndvi: 35.8, kepadatan: 15260, ndvi: 0.35, lst: 26.8, skor: 20, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Cibeunying Kidul', rasio_rth: 13.8, rasio_rth_ndvi: 16.5, kepadatan: 27432, ndvi: 0.16, lst: 31.5, skor: 82, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Cibiru', rasio_rth: 26.4, rasio_rth_ndvi: 29.5, kepadatan: 11079, ndvi: 0.29, lst: 27.8, skor: 30, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Cicendo', rasio_rth: 14.5, rasio_rth_ndvi: 16.9, kepadatan: 12363, ndvi: 0.16, lst: 30.8, skor: 70, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Cidadap', rasio_rth: 55.2, rasio_rth_ndvi: 60.1, kepadatan: 6467, ndvi: 0.58, lst: 24.5, skor: 5, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Cinambo', rasio_rth: 38.5, rasio_rth_ndvi: 42.0, kepadatan: 6020, ndvi: 0.40, lst: 26.0, skor: 15, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Coblong', rasio_rth: 40.2, rasio_rth_ndvi: 45.5, kepadatan: 15740, ndvi: 0.42, lst: 25.5, skor: 18, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Gedebage', rasio_rth: 42.1, rasio_rth_ndvi: 46.8, kepadatan: 4191, ndvi: 0.44, lst: 25.2, skor: 12, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Kiaracondong', rasio_rth: 12.5, rasio_rth_ndvi: 15.0, kepadatan: 22692, ndvi: 0.13, lst: 32.5, skor: 86, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Lengkong', rasio_rth: 15.2, rasio_rth_ndvi: 17.8, kepadatan: 12058, ndvi: 0.15, lst: 31.0, skor: 72, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Mandalajati', rasio_rth: 34.5, rasio_rth_ndvi: 38.2, kepadatan: 15319, ndvi: 0.36, lst: 26.5, skor: 22, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Panyileukan', rasio_rth: 25.8, rasio_rth_ndvi: 28.5, kepadatan: 7643, ndvi: 0.28, lst: 28.0, skor: 32, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Rancasari', rasio_rth: 29.5, rasio_rth_ndvi: 32.4, kepadatan: 12335, ndvi: 0.31, lst: 27.2, skor: 28, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Regol', rasio_rth: 13.5, rasio_rth_ndvi: 16.2, kepadatan: 17048, ndvi: 0.14, lst: 31.8, skor: 78, urgensi: 'HIGH PRIORITY' },
                    { kecamatan: 'Sukajadi', rasio_rth: 16.8, rasio_rth_ndvi: 19.5, kepadatan: 19463, ndvi: 0.17, lst: 30.1, skor: 66, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Sukasari', rasio_rth: 36.5, rasio_rth_ndvi: 40.2, kepadatan: 12201, ndvi: 0.38, lst: 26.2, skor: 20, urgensi: 'LOW PRIORITY' },
                    { kecamatan: 'Sumur Bandung', rasio_rth: 17.5, rasio_rth_ndvi: 20.1, kepadatan: 10866, ndvi: 0.18, lst: 29.8, skor: 58, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Ujungberung', rasio_rth: 23.5, rasio_rth_ndvi: 26.5, kepadatan: 14424, ndvi: 0.25, lst: 28.5, skor: 38, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Antapani', rasio_rth: 20.5, rasio_rth_ndvi: 23.2, kepadatan: 19046, ndvi: 0.22, lst: 29.2, skor: 50, urgensi: 'MEDIUM PRIORITY' },
                    { kecamatan: 'Arcamanik', rasio_rth: 31.5, rasio_rth_ndvi: 35.0, kepadatan: 10505, ndvi: 0.33, lst: 26.9, skor: 24, urgensi: 'LOW PRIORITY' }
                ];
                
                if (!mockData || mockData.length === 0) {
                    throw new Error("Data Lakehouse kosong atau tidak ditemukan.");
                }
                
                resolve(mockData);
            } catch (error) {
                console.error("[API Error]", error);
                reject(error);
            }
        }, 800); // delay 800ms
    });
}

/**
 * Fetch dummy GeoJSON untuk batas kecamatan Kota Bandung.
 * Dalam real case, fetch dari file / endpoint GIS.
 */
async function fetchGeoJSON() {
    // Simulasi struktur GeoJSON dasar untuk marker (karena tidak ada file geografi asli di frontend)
    // Mapbox/Leaflet butuh lat/long. Kita generate dummy coordinates untuk 30 kecamatan di Bandung.
    const baseLat = -6.9147;
    const baseLng = 107.6098;
    
    return {
        type: "FeatureCollection",
        features: state.analyticsData.map((d, i) => {
            // Sebar titik secara acak di sekitar pusat Bandung
            const latOffset = (Math.random() - 0.5) * 0.1;
            const lngOffset = (Math.random() - 0.5) * 0.1;
            
            return {
                type: "Feature",
                properties: {
                    kecamatan: d.kecamatan,
                    ...d
                },
                geometry: {
                    type: "Point",
                    coordinates: [baseLng + lngOffset, baseLat + latOffset]
                }
            };
        })
    };
}


// ============================================================================
// 2. MAP RENDERING (Task 2: Map Rendering)
// ============================================================================

function initMap() {
    // Pusat Kota Bandung
    state.mapInstance = L.map('bandung-map').setView([-6.9147, 107.6098], 12);

    // Dark theme basemap dari CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(state.mapInstance);
}

function getUrgencyColor(urgency) {
    if (urgency === 'HIGH PRIORITY') return '#ef4444'; // Red
    if (urgency === 'MEDIUM PRIORITY') return '#f97316'; // Orange
    return '#22c55e'; // Green
}

/**
 * Render Heatmap Kepadatan Penduduk
 */
function renderHeatmap() {
    if (state.heatLayer) state.mapInstance.removeLayer(state.heatLayer);
    if (state.polygonLayer) state.mapInstance.removeLayer(state.polygonLayer);
    
    const heatData = state.geojsonData.features.map(f => [
        f.geometry.coordinates[1], // lat
        f.geometry.coordinates[0], // lng
        f.properties.kepadatan / 40000 // intensity normalized
    ]);

    state.heatLayer = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 12,
        gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red'}
    }).addTo(state.mapInstance);
}

/**
 * Render Layer Klasifikasi Vegetasi / Urgensi
 */
function renderVegetationLayer(mode = 'urgency') {
    if (state.heatLayer) state.mapInstance.removeLayer(state.heatLayer);
    if (state.polygonLayer) state.mapInstance.removeLayer(state.polygonLayer);

    state.polygonLayer = L.geoJSON(state.geojsonData, {
        pointToLayer: function (feature, latlng) {
            let color = '#34d399';
            let radius = 8;
            
            if (mode === 'urgency') {
                color = getUrgencyColor(feature.properties.urgensi);
                radius = 10;
            } else if (mode === 'rth') {
                // RTH AI: lebih besar RTH, lebih hijau dan besar
                const rth = feature.properties.rasio_rth_ndvi;
                color = rth > 25 ? '#22c55e' : (rth > 17 ? '#34d399' : '#10b981');
                radius = 5 + (rth / 5);
            }

            const marker = L.circleMarker(latlng, {
                radius: radius,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            // Interaktivitas: Update Metric Card saat diklik
            marker.on('click', () => {
                updateDynamicMetrics(feature.properties);
            });

            return marker;
        },
        onEachFeature: function (feature, layer) {
            const p = feature.properties;
            const popupContent = `
                <div style="font-family: 'Inter', sans-serif;">
                    <h4 style="margin:0 0 5px 0; color: #38bdf8;">Kecamatan ${p.kecamatan}</h4>
                    <p style="margin:0; font-size: 12px;"><strong>Urgensi:</strong> <span style="color:${getUrgencyColor(p.urgensi)}">${p.urgensi}</span></p>
                    <p style="margin:0; font-size: 12px;"><strong>RTH Satelit (NDVI):</strong> ${p.rasio_rth_ndvi}%</p>
                    <p style="margin:0; font-size: 12px;"><strong>LST (Suhu):</strong> ${p.lst}°C</p>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(state.mapInstance);
}

// Global toggle fungsi untuk dipanggil dari HTML onclick
window.toggleLayer = function(layerType) {
    document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-layer-${layerType}`).classList.add('active');
    
    state.currentLayer = layerType;
    if (layerType === 'heatmap') {
        renderHeatmap();
    } else {
        renderVegetationLayer(layerType);
    }
};


// ============================================================================
// 3. CHARTS GENERATION (Task 2: Chart Generation)
// ============================================================================

function renderCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter, sans-serif';

    const labels = state.analyticsData.map(d => d.kecamatan);
    const dataPublik = state.analyticsData.map(d => d.rasio_rth);
    const dataAI = state.analyticsData.map(d => d.rasio_rth_ndvi);

    // 1. Comparison Chart (Publik vs AI)
    new Chart(document.getElementById('chart-rth-comparison'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Data Publik (%)',
                    data: dataPublik,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Deteksi AI/NDVI (%)',
                    data: dataAI,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        line1: { type: 'line', yMin: 17, yMax: 17, borderColor: '#f97316', borderWidth: 2, borderDash: [5, 5] }
                    }
                }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
            }
        }
    });

    // 2. Urgency Distribution Donut
    const urgencies = state.analyticsData.reduce((acc, curr) => {
        acc[curr.urgensi] = (acc[curr.urgensi] || 0) + 1;
        return acc;
    }, {});

    new Chart(document.getElementById('chart-urgency-donut'), {
        type: 'doughnut',
        data: {
            labels: ['HIGH PRIORITY', 'MEDIUM PRIORITY', 'LOW PRIORITY'],
            datasets: [{
                data: [urgencies['HIGH PRIORITY'], urgencies['MEDIUM PRIORITY'], urgencies['LOW PRIORITY']],
                backgroundColor: ['#ef4444', '#f97316', '#22c55e'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });

    // 3. NDVI vs LST Scatter Chart
    const scatterData = state.analyticsData.map(d => ({
        x: d.ndvi,
        y: d.lst,
        kecamatan: d.kecamatan
    }));

    new Chart(document.getElementById('chart-ndvi-lst'), {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Kecamatan',
                data: scatterData,
                backgroundColor: '#818cf8',
                borderColor: '#38bdf8',
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const point = ctx.raw;
                            return `${point.kecamatan}: NDVI ${point.x}, LST ${point.y}°C`;
                        }
                    }
                },
                legend: { display: false }
            },
            scales: {
                x: { title: { display: true, text: 'NDVI (Kerapatan Vegetasi)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { title: { display: true, text: 'LST (°C)' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 4. Bar Chart RTH vs Target
    new Chart(document.getElementById('chart-rasio-rth'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'RTH Aktual (AI)',
                data: dataAI,
                backgroundColor: dataAI.map(val => val < 17 ? '#ef4444' : (val < 25 ? '#f97316' : '#22c55e')),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}


// ============================================================================
// 4. DYNAMIC METRICS & UI UPDATE (Task 2: Dynamic Metrics)
// ============================================================================

function updateGlobalMetrics() {
    const avgLst = (state.analyticsData.reduce((acc, curr) => acc + curr.lst, 0) / state.analyticsData.length).toFixed(1);
    const avgNdvi = (state.analyticsData.reduce((acc, curr) => acc + curr.ndvi, 0) / state.analyticsData.length).toFixed(3);
    const avgRthAi = (state.analyticsData.reduce((acc, curr) => acc + curr.rasio_rth_ndvi, 0) / state.analyticsData.length).toFixed(1);
    
    // Sort to find most urgent
    const sorted = [...state.analyticsData].sort((a, b) => b.skor - a.skor);
    const mostUrgent = sorted[0];

    document.getElementById('metric-lst').innerText = `${avgLst}°C`;
    document.getElementById('metric-rth').innerText = `${avgRthAi}%`;
    document.getElementById('metric-ndvi').innerText = avgNdvi;
    
    document.getElementById('metric-urgent').innerText = mostUrgent.kecamatan;
    document.getElementById('metric-urgent-sub').innerText = `Skor Urgensi: ${mostUrgent.skor}/100`;

    // Hero stats update
    document.getElementById('hero-rth-current').innerText = `${avgRthAi}%`;
    document.getElementById('hero-high-count').innerText = state.analyticsData.filter(d => d.urgensi === 'HIGH PRIORITY').length;
    document.getElementById('rth-donut-label').innerText = `${avgRthAi}%`;
    
    // Set current date
    const d = new Date();
    document.getElementById('header-date').innerText = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Dipanggil saat marker kecamatan di peta diklik
 */
function updateDynamicMetrics(properties) {
    document.getElementById('metric-lst').innerText = `${properties.lst}°C`;
    document.getElementById('metric-lst-sub').innerText = `Kec. ${properties.kecamatan}`;
    
    document.getElementById('metric-rth').innerText = `${properties.rasio_rth_ndvi}%`;
    document.getElementById('metric-rth-sub').innerText = `Kec. ${properties.kecamatan}`;
    
    document.getElementById('metric-ndvi').innerText = properties.ndvi.toFixed(3);
    
    // Tampilkan modal detail
    showKecamatanModal(properties);
}


// ============================================================================
// 5. TABLE HANDLING
// ============================================================================

function renderTable(data = state.analyticsData) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    data.forEach(d => {
        let badgeClass = d.urgensi === 'HIGH PRIORITY' ? 'badge-high' : 
                         d.urgensi === 'MEDIUM PRIORITY' ? 'badge-medium' : 'badge-low';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.kecamatan}</td>
            <td>${d.rasio_rth}%</td>
            <td><strong>${d.rasio_rth_ndvi}%</strong></td>
            <td>${d.kepadatan.toLocaleString()}</td>
            <td>${d.ndvi}</td>
            <td>${d.lst}</td>
            <td>${d.skor}</td>
            <td><span class="badge-urgency ${badgeClass}">● ${d.urgensi}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

window.filterTable = function() {
    const searchTerm = document.getElementById('table-search').value.toLowerCase();
    const filterTerm = document.getElementById('table-filter').value;

    const filtered = state.analyticsData.filter(d => {
        const matchSearch = d.kecamatan.toLowerCase().includes(searchTerm);
        const matchFilter = filterTerm === 'all' || d.urgensi === filterTerm;
        return matchSearch && matchFilter;
    });

    renderTable(filtered);
}

let sortAsc = true;
window.sortTable = function(colIndex) {
    const keys = ['kecamatan', 'rasio_rth', 'rasio_rth_ndvi', 'kepadatan', 'ndvi', 'lst', 'skor', 'urgensi'];
    const key = keys[colIndex];
    
    state.analyticsData.sort((a, b) => {
        if (typeof a[key] === 'string') {
            return sortAsc ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
        }
        return sortAsc ? a[key] - b[key] : b[key] - a[key];
    });
    
    sortAsc = !sortAsc;
    filterTable(); // Re-render with active filters
}


// ============================================================================
// 6. MODAL & UTILS
// ============================================================================

function showKecamatanModal(d) {
    const modal = document.getElementById('kec-modal');
    
    document.getElementById('modal-header').innerHTML = `
        <div class="modal-kec-name">Kecamatan ${d.kecamatan}</div>
        <div class="badge-urgency ${d.urgensi === 'HIGH PRIORITY' ? 'badge-high' : d.urgensi === 'MEDIUM PRIORITY' ? 'badge-medium' : 'badge-low'}">
            ● ${d.urgensi} (Skor: ${d.skor})
        </div>
    `;

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-stat-grid">
            <div class="modal-stat">
                <div class="modal-stat-label">RTH Aktual (AI)</div>
                <div class="modal-stat-value">${d.rasio_rth_ndvi}%</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">Suhu Permukaan</div>
                <div class="modal-stat-value">${d.lst}°C</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">Kepadatan Penduduk</div>
                <div class="modal-stat-value" style="color:var(--text-primary); font-size:16px;">${d.kepadatan.toLocaleString()} <span style="font-size:12px;color:var(--text-muted)">jiwa/km²</span></div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">RTH Data Publik</div>
                <div class="modal-stat-value" style="color:var(--text-primary); font-size:16px;">${d.rasio_rth}%</div>
            </div>
        </div>
        <div class="modal-rekomendasi">
            <strong>Rekomendasi AI:</strong><br>
            ${d.urgensi === 'HIGH PRIORITY' 
                ? 'Sangat kritis. Kepadatan tinggi dan minim vegetasi memicu efek Urban Heat Island. Prioritaskan konversi lahan idle, pembangunan taman kantong (pocket parks), dan green roof.' 
                : d.urgensi === 'MEDIUM PRIORITY'
                ? 'Mendekati ambang batas aman. Fokus pada pemeliharaan koridor hijau jalan raya dan optimalisasi sempadan sungai.'
                : 'Kondisi RTH relatif memadai (>25%). Pertahankan dan fokus pada peningkatan kualitas ekologi dan keanekaragaman hayati taman.'}
        </div>
    `;
    
    modal.classList.add('open');
}

window.closeModal = function() {
    document.getElementById('kec-modal').classList.remove('open');
    // Kembalikan metrik ke rata-rata kota
    updateGlobalMetrics();
}


// ============================================================================
// 7. INITIALIZATION
// ============================================================================

async function bootstrap() {
    try {
        // 1. Fetch data dari backend (Task 3)
        state.analyticsData = await fetchAnalyticsData();
        
        // 2. Format / siapkan GeoJSON untuk Peta
        state.geojsonData = await fetchGeoJSON();
        
        // 3. Render Komponen
        updateGlobalMetrics();
        initMap();
        renderHeatmap(); // Default layer
        renderCharts();
        renderTable();
        
        console.log("🌿 EcoSpatial Dashboard Initialized Successfully.");
        
    } catch (error) {
        console.error("Gagal menginisialisasi dashboard:", error);
        alert("Gagal memuat data dari Lakehouse. Cek console untuk detail.");
    }
}

// Start application
document.addEventListener('DOMContentLoaded', bootstrap);
