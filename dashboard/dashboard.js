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

// Simulasi data untuk 10 Kecamatan dengan delta NDVI dan selisih data
const DUMMY_DATA = [
    { kecamatan: 'Andir', rth_admin: 15.0, rth_ai: 8.5, ndvi_delta: -4.2, temp_avg: 32.4, lat: -6.914, lng: 107.585 },
    { kecamatan: 'Astana Anyar', rth_admin: 13.5, rth_ai: 7.1, ndvi_delta: -5.5, temp_avg: 33.1, lat: -6.932, lng: 107.598 },
    { kecamatan: 'Babakan Ciparay', rth_admin: 16.8, rth_ai: 10.2, ndvi_delta: -3.8, temp_avg: 31.8, lat: -6.939, lng: 107.575 },
    { kecamatan: 'Bandung Kidul', rth_admin: 21.0, rth_ai: 18.5, ndvi_delta: -1.0, temp_avg: 29.5, lat: -6.965, lng: 107.625 },
    { kecamatan: 'Buahbatu', rth_admin: 31.2, rth_ai: 28.5, ndvi_delta: 0.5, temp_avg: 27.5, lat: -6.950, lng: 107.645 },
    { kecamatan: 'Coblong', rth_admin: 45.5, rth_ai: 40.2, ndvi_delta: -1.2, temp_avg: 25.5, lat: -6.885, lng: 107.613 },
    { kecamatan: 'Kiaracondong', rth_admin: 15.0, rth_ai: 6.5, ndvi_delta: -6.1, temp_avg: 32.5, lat: -6.925, lng: 107.643 },
    { kecamatan: 'Sumur Bandung', rth_admin: 20.1, rth_ai: 12.5, ndvi_delta: -3.2, temp_avg: 29.8, lat: -6.916, lng: 107.610 },
    { kecamatan: 'Ujungberung', rth_admin: 23.5, rth_ai: 21.5, ndvi_delta: -0.5, temp_avg: 28.5, lat: -6.905, lng: 107.705 },
    { kecamatan: 'Antapani', rth_admin: 20.5, rth_ai: 18.2, ndvi_delta: -1.5, temp_avg: 29.2, lat: -6.918, lng: 107.656 }
];

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
    document.getElementById('metric-delta').innerText = `${avgDelta}%`;
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

    state.layerAdmin = L.layerGroup();
    state.layerAI = L.layerGroup();

    DUMMY_DATA.forEach(d => {
        // Layer A: Poligon Administratif (Simulasi menggunakan circle besar)
        const poly = L.circle([d.lat, d.lng], {
            color: '#059669', // Emerald
            fillColor: '#34d399',
            fillOpacity: 0.3,
            weight: 2,
            radius: d.rth_admin * 60 // Skala representasi administratif
        }).bindPopup(`<b>${d.kecamatan}</b><br>Klaim RTH Pemerintah: ${d.rth_admin}%`);
        state.layerAdmin.addLayer(poly);

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
