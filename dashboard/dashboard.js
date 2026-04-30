// dashboard.js

const state = {
    data: [],
    map: null,
    layerAdmin: null,
    layerAI: null,
    timeChart: null,
    compareChart: null,
    selectedKecamatan: 'ALL'
};

// Data 30 Kecamatan (diambil dari Lakehouse backend sesuai data awal)
const ORIGINAL_DATA = [
    { kecamatan: 'Andir', rth_admin: 15.2, rth_ai: 12.5, kepadatan: 23577, ndvi: 0.15, temp_avg: 32.4, skor: 85, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Astana Anyar', rth_admin: 13.5, rth_ai: 10.1, kepadatan: 27468, ndvi: 0.13, temp_avg: 33.1, skor: 92, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Babakan Ciparay', rth_admin: 16.8, rth_ai: 14.2, kepadatan: 20160, ndvi: 0.14, temp_avg: 31.8, skor: 80, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Bandung Kidul', rth_admin: 21.0, rth_ai: 18.5, kepadatan: 11301, ndvi: 0.20, temp_avg: 29.5, skor: 55, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Bandung Kulon', rth_admin: 18.4, rth_ai: 16.3, kepadatan: 19656, ndvi: 0.17, temp_avg: 30.2, skor: 68, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Bandung Wetan', rth_admin: 22.5, rth_ai: 20.1, kepadatan: 8391, ndvi: 0.21, temp_avg: 28.9, skor: 45, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Batununggal', rth_admin: 14.1, rth_ai: 11.2, kepadatan: 25236, ndvi: 0.12, temp_avg: 32.8, skor: 88, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Bojongloa Kaler', rth_admin: 12.0, rth_ai: 9.5, kepadatan: 39906, ndvi: 0.10, temp_avg: 34.0, skor: 98, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Bojongloa Kidul', rth_admin: 17.5, rth_ai: 15.1, kepadatan: 16907, ndvi: 0.16, temp_avg: 30.5, skor: 65, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Buahbatu', rth_admin: 31.2, rth_ai: 28.5, kepadatan: 13955, ndvi: 0.30, temp_avg: 27.5, skor: 25, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Cibeunying Kaler', rth_admin: 35.8, rth_ai: 32.1, kepadatan: 15260, ndvi: 0.35, temp_avg: 26.8, skor: 20, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Cibeunying Kidul', rth_admin: 16.5, rth_ai: 13.8, kepadatan: 27432, ndvi: 0.16, temp_avg: 31.5, skor: 82, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Cibiru', rth_admin: 29.5, rth_ai: 26.4, kepadatan: 11079, ndvi: 0.29, temp_avg: 27.8, skor: 30, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Cicendo', rth_admin: 16.9, rth_ai: 14.5, kepadatan: 12363, ndvi: 0.16, temp_avg: 30.8, skor: 70, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Cidadap', rth_admin: 60.1, rth_ai: 55.2, kepadatan: 6467, ndvi: 0.58, temp_avg: 24.5, skor: 5, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Cinambo', rth_admin: 42.0, rth_ai: 38.5, kepadatan: 6020, ndvi: 0.40, temp_avg: 26.0, skor: 15, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Coblong', rth_admin: 45.5, rth_ai: 40.2, kepadatan: 15740, ndvi: 0.42, temp_avg: 25.5, skor: 18, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Gedebage', rth_admin: 46.8, rth_ai: 42.1, kepadatan: 4191, ndvi: 0.44, temp_avg: 25.2, skor: 12, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Kiaracondong', rth_admin: 15.0, rth_ai: 12.5, kepadatan: 22692, ndvi: 0.13, temp_avg: 32.5, skor: 86, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Lengkong', rth_admin: 17.8, rth_ai: 15.2, kepadatan: 12058, ndvi: 0.15, temp_avg: 31.0, skor: 72, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Mandalajati', rth_admin: 38.2, rth_ai: 34.5, kepadatan: 15319, ndvi: 0.36, temp_avg: 26.5, skor: 22, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Panyileukan', rth_admin: 28.5, rth_ai: 25.8, kepadatan: 7643, ndvi: 0.28, temp_avg: 28.0, skor: 32, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Rancasari', rth_admin: 32.4, rth_ai: 29.5, kepadatan: 12335, ndvi: 0.31, temp_avg: 27.2, skor: 28, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Regol', rth_admin: 16.2, rth_ai: 13.5, kepadatan: 17048, ndvi: 0.14, temp_avg: 31.8, skor: 78, urgensi: 'HIGH PRIORITY' },
    { kecamatan: 'Sukajadi', rth_admin: 19.5, rth_ai: 16.8, kepadatan: 19463, ndvi: 0.17, temp_avg: 30.1, skor: 66, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Sukasari', rth_admin: 40.2, rth_ai: 36.5, kepadatan: 12201, ndvi: 0.38, temp_avg: 26.2, skor: 20, urgensi: 'LOW PRIORITY' },
    { kecamatan: 'Sumur Bandung', rth_admin: 20.1, rth_ai: 17.5, kepadatan: 10866, ndvi: 0.18, temp_avg: 29.8, skor: 58, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Ujungberung', rth_admin: 26.5, rth_ai: 23.5, kepadatan: 14424, ndvi: 0.25, temp_avg: 28.5, skor: 38, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Antapani', rth_admin: 23.2, rth_ai: 20.5, kepadatan: 19046, ndvi: 0.22, temp_avg: 29.2, skor: 50, urgensi: 'MEDIUM PRIORITY' },
    { kecamatan: 'Arcamanik', rth_admin: 35.0, rth_ai: 31.5, kepadatan: 10505, ndvi: 0.33, temp_avg: 26.9, skor: 24, urgensi: 'LOW PRIORITY' }
];

// Enrich data dengan lat/lng (posisi Bandung) dan ndvi_delta
const baseLat = -6.9147;
const baseLng = 107.6098;

const DUMMY_DATA = ORIGINAL_DATA.map((d, i) => {
    // Generate pseudo-random lat/lng di sekitar Bandung berdasarkan index
    const seed = i * 1.5;
    const lat = baseLat + (Math.sin(seed) * 0.05);
    const lng = baseLng + (Math.cos(seed) * 0.05);
    
    // Hitung Penurunan NDVI Delta secara logis: kecamatan urgensi tinggi mengalami delta negatif paling besar
    let delta = 0;
    if (d.urgensi === 'HIGH PRIORITY') delta = - (Math.random() * 3 + 4); // -4% to -7%
    else if (d.urgensi === 'MEDIUM PRIORITY') delta = - (Math.random() * 2 + 1.5); // -1.5% to -3.5%
    else delta = (Math.random() * 2 - 0.5); // -0.5% to 1.5%

    return { ...d, lat, lng, ndvi_delta: parseFloat(delta.toFixed(1)) };
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('header-date').innerText = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    
    populateDropdown();
    initMap();
    updateDashboard();
    initCharts();
});

// TAB NAVIGATION
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');

    // Resize Leaflet and ApexCharts to avoid rendering issues in hidden containers
    if(tabId === 'tab-spasial' && state.map) {
        setTimeout(() => state.map.invalidateSize(), 100);
    }
    if(tabId === 'tab-waktu' && state.timeChart) {
        window.dispatchEvent(new Event('resize'));
    }
    if(tabId === 'tab-banding' && state.compareChart) {
        window.dispatchEvent(new Event('resize'));
    }
}

// DROPDOWN FILTER
function populateDropdown() {
    const sel = document.getElementById('kecamatan-filter');
    DUMMY_DATA.sort((a,b) => a.kecamatan.localeCompare(b.kecamatan)).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.kecamatan;
        opt.innerText = `📍 Kec. ${d.kecamatan}`;
        sel.appendChild(opt);
    });
}

window.onKecamatanChange = function() {
    state.selectedKecamatan = document.getElementById('kecamatan-filter').value;
    updateDashboard();
    
    if (state.selectedKecamatan !== 'ALL') {
        const data = DUMMY_DATA.find(d => d.kecamatan === state.selectedKecamatan);
        if (data) {
            state.map.flyTo([data.lat, data.lng], 14, { duration: 1.5 });
        }
    } else {
        state.map.flyTo([-6.92, 107.60], 12, { duration: 1.5 });
    }
}

// METRICS & INSIGHTS
function updateDashboard() {
    let filtered = DUMMY_DATA;
    if (state.selectedKecamatan !== 'ALL') {
        filtered = DUMMY_DATA.filter(d => d.kecamatan === state.selectedKecamatan);
    }

    // Hitung inkonsistensi
    const sortedKritis = [...DUMMY_DATA].sort((a,b) => (b.rth_admin - b.rth_ai) - (a.rth_admin - a.rth_ai));
    const mostKritis = sortedKritis[0];

    const avgDelta = (filtered.reduce((sum, d) => sum + d.ndvi_delta, 0) / filtered.length).toFixed(1);
    const avgSelisih = (filtered.reduce((sum, d) => sum + (d.rth_admin - d.rth_ai), 0) / filtered.length).toFixed(1);

    document.getElementById('metric-kritis').innerText = state.selectedKecamatan === 'ALL' ? mostKritis.kecamatan : state.selectedKecamatan;
    
    // Task 3: Color coding angka perubahan (Delta)
    const deltaEl = document.getElementById('metric-delta');
    const isPositive = avgDelta >= 0;
    deltaEl.innerText = `${isPositive ? '+' : ''}${avgDelta}%`;
    deltaEl.className = `metric-val ${isPositive ? 'text-emerald' : 'text-red'}`;
    if(isPositive) { deltaEl.style.color = 'var(--emerald)'; } else { deltaEl.style.color = ''; }

    document.getElementById('metric-selisih').innerText = `${avgSelisih}%`;

    // Dynamic Insight Strategy (Content Efficiency)
    const insightBox = document.getElementById('data-insight');
    if (state.selectedKecamatan === 'ALL') {
        insightBox.innerHTML = `Secara agregat, Kota Bandung mengalami <strong>penurunan vegetasi sebesar ${Math.abs(avgDelta)}%</strong>. Terdapat rata-rata <strong>overclaim selisih data ${avgSelisih}%</strong> antara RTH administratif yang dilaporkan pemerintah dengan kondisi riil di lapangan berdasarkan satelit AI. Kecamatan <strong>${mostKritis.kecamatan}</strong> memiliki inkonsistensi tertinggi.`;
    } else {
        insightBox.innerHTML = `Kecamatan ${state.selectedKecamatan} memiliki selisih laporan RTH sebesar <strong>${avgSelisih}%</strong> dan mengalami penurunan kualitas NDVI sebesar <strong>${Math.abs(avgDelta)}%</strong> dalam 12 bulan terakhir. Intervensi penambahan ruang hijau mendesak diperlukan.`;
    }
}

// SPATIAL MAP (Binary Vegetation & Overlay)
function initMap() {
    state.map = L.map('bandung-map', { zoomControl: true }).setView([-6.92, 107.60], 12);
    
    // Light Mode / High Contrast Basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(state.map);

    // Fungsi Layering Choropleth Warna-warni (Gradient Light Green to Dark Blue)
    function getChoroplethColor(value) {
        return value > 25 ? '#08519c' : // Biru Gelap (RTH Tinggi)
               value > 20 ? '#3182bd' : // Biru Sedang
               value > 15 ? '#6baed6' : // Biru Muda
               value > 10 ? '#a1d99b' : // Hijau Muda
                            '#c7e9c0';  // Hijau Pucat (RTH Sangat Rendah)
    }

    state.layerAdmin = L.layerGroup();
    state.layerAI = L.layerGroup();

    // Task 2: GeoJSON Boundary Fetch & Interaction Overlay
    fetch('./data/bandung.geojson')
        .then(res => {
            if (!res.ok) throw new Error("Gagal fetch batas geojson lokal");
            return res.json();
        })
        .then(data => {
            const geojsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    const kecName = feature.properties.KECAMATAN || feature.properties.kecamatan || feature.properties.name || "Kecamatan";
                    const matchingData = DUMMY_DATA.find(d => d.kecamatan.toLowerCase() === kecName.toLowerCase());
                    const rthVal = matchingData ? matchingData.rth_ai : 0;
                    
                    return {
                        color: '#ffffff', // Outline putih tegas antar wilayah
                        fillColor: getChoroplethColor(rthVal), // Layering warna sesuai metrik
                        fillOpacity: 0.85,
                        weight: 1.5
                    };
                },
                onEachFeature: function (feature, layer) {
                    const kecName = feature.properties.KECAMATAN || feature.properties.kecamatan || feature.properties.name || "Kecamatan";
                    
                    // Interaction Overlay (Hover & Click)
                    layer.on({
                        mouseover: function(e) {
                            const l = e.target;
                            l.setStyle({ fillOpacity: 1, weight: 3, color: '#000000' });
                            l.bringToFront();
                        },
                        mouseout: function(e) {
                            geojsonLayer.resetStyle(e.target);
                        },
                        click: function(e) {
                            const matchingData = DUMMY_DATA.find(d => d.kecamatan.toLowerCase() === kecName.toLowerCase());
                            if(matchingData) {
                                document.getElementById('kecamatan-filter').value = matchingData.kecamatan;
                                window.onKecamatanChange(); // Memperbarui metrik di sidebar
                            }
                        }
                    });
                    layer.bindPopup(`<b>${kecName}</b><br>Klik untuk melihat metrik wilayah ini.`);
                }
            });
            state.layerAdmin.addLayer(geojsonLayer);
        })
        .catch(err => {
            console.warn("Fallback ke poligon sirkular:", err);
            DUMMY_DATA.forEach(d => {
                const poly = L.circle([d.lat, d.lng], {
                    color: '#ffffff',
                    fillColor: getChoroplethColor(d.rth_ai), // Layering warna pada fallback
                    fillOpacity: 0.85,
                    weight: 1.5,
                    radius: d.rth_admin * 60
                }).bindPopup(`<b>${d.kecamatan}</b><br>Kondisi RTH (AI): ${d.rth_ai}%`);
                state.layerAdmin.addLayer(poly);
            });
        });

    DUMMY_DATA.forEach(d => {
        // Layer B: Raw Scatter Data Pixel-Based
        // Titik putih: Vegetasi. Titik hitam: Non-tanaman.
        const pixelCount = 150; // Jumlah sampel piksel per kecamatan
        for (let i = 0; i < pixelCount; i++) {
            // Distribusi radius acak
            const latOff = (Math.random() - 0.5) * 0.035;
            const lngOff = (Math.random() - 0.5) * 0.035;
            
            // Probabilitas menjadi titik hijau/putih sesuai rth_ai riil
            const isVegetation = Math.random() < (d.rth_ai / 100);
            
            const pixel = L.circleMarker([d.lat + latOff, d.lng + lngOff], {
                radius: 2,
                color: isVegetation ? '#94a3b8' : 'none', // Outline tipis untuk titik putih agar kontras di peta light
                weight: isVegetation ? 1 : 0,
                fillColor: isVegetation ? '#ffffff' : '#000000',
                fillOpacity: isVegetation ? 0.9 : 0.6
            });
            state.layerAI.addLayer(pixel);
        }
    });

    // Add both initially
    state.layerAdmin.addTo(state.map);
    state.layerAI.addTo(state.map);
}

window.updateMapLayers = function() {
    const showAdmin = document.getElementById('layer-admin').checked;
    const showAI = document.getElementById('layer-ai').checked;

    if (showAdmin) state.map.addLayer(state.layerAdmin);
    else state.map.removeLayer(state.layerAdmin);

    if (showAI) state.map.addLayer(state.layerAI);
    else state.map.removeLayer(state.layerAI);
}

// ANALYTICS & CHARTS (ApexCharts)
function initCharts() {
    // 1. Time-Series Chart (Zoomable)
    // Simulasi data bulanan
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const tempTrend = [28, 28.5, 29, 30.1, 31, 31.5, 32, 32.8, 33.1, 32.5, 31, 30];
    const ndviTrend = [0.4, 0.38, 0.35, 0.32, 0.30, 0.28, 0.25, 0.22, 0.20, 0.21, 0.24, 0.25];

    const timeOptions = {
        series: [{
            name: 'Rata-rata Suhu Permukaan (°C)',
            type: 'line',
            data: tempTrend
        }, {
            name: 'Kerapatan NDVI',
            type: 'area',
            data: ndviTrend
        }],
        chart: {
            height: '100%',
            type: 'line',
            toolbar: { 
                show: true,
                tools: { zoom: true, pan: true, reset: true }
            },
            fontFamily: 'Inter, sans-serif'
        },
        colors: ['#dc2626', '#059669'], // Merah tegas, Hijau emerald
        stroke: { curve: 'smooth', width: [3, 2] },
        fill: {
            type: ['solid', 'gradient'],
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.1,
            }
        },
        labels: months,
        xaxis: { title: { text: 'Sumbu Waktu (Bulan)' } },
        yaxis: [
            { title: { text: 'Suhu Permukaan (°C)' }, min: 25, max: 35 },
            { opposite: true, title: { text: 'Indeks NDVI' }, min: 0, max: 0.6 }
        ],
        legend: { position: 'top' }
    };

    state.timeChart = new ApexCharts(document.querySelector("#time-series-chart"), timeOptions);
    state.timeChart.render();

    // 2. Comparison Bar Chart
    const sortedData = [...DUMMY_DATA].sort((a,b) => (b.rth_admin - b.rth_ai) - (a.rth_admin - a.rth_ai));
    const categories = sortedData.map(d => d.kecamatan);
    const adminData = sortedData.map(d => d.rth_admin);
    const aiData = sortedData.map(d => d.rth_ai);

    const compareOptions = {
        series: [{
            name: 'Layer A: Data Administratif (Laporan)',
            data: adminData
        }, {
            name: 'Layer B: Hasil Satelit AI (Riil)',
            data: aiData
        }],
        chart: {
            type: 'bar',
            height: '100%',
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif'
        },
        colors: ['#2563eb', '#059669'], // Biru untuk data pemerintah, Emerald untuk riil AI
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: categories, title: { text: 'Kecamatan' } },
        yaxis: { title: { text: 'Persentase Luasan (%)' } },
        fill: { opacity: 1 },
        tooltip: {
            y: { formatter: function (val) { return val + "%" } }
        }
    };

    state.compareChart = new ApexCharts(document.querySelector("#comparison-chart"), compareOptions);
    state.compareChart.render();
}
