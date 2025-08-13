// ====================== KONFIGURASI SISTEM ======================
const config = {
    api: {
        baseUrl: 'http://udaramojolebak.com/api/',
        endpoints: {
            getData: 'get_data.php',
        },
        devices: {
            kkn: { id: 'device-1', name: 'SDN Mojolebak' },
            ppk: { id: 'device-2', name: 'Balai Desa' }
        }
    },
    thresholds: {
        temperature: { good: [20, 27], moderate: [27, 30], unhealthy: [30, 35], veryUnhealthy: [35, 40], hazardous: [40, Infinity] },
        humidity: { good: [30, 60], moderate: [60, 70], unhealthy: [70, 80], veryUnhealthy: [80, 90], hazardous: [90, Infinity] },
        co2: { good: [0, 600], moderate: [600, 1000], unhealthy: [1000, 1500], veryUnhealthy: [1500, 2000], hazardous: [2000, Infinity] },
        h2s: { good: [0, 0.005], moderate: [0.005, 0.1], unhealthy: [0.1, 20], veryUnhealthy: [20, 50], hazardous: [50, Infinity] },
        nh3: { good: [0, 10], moderate: [10, 25], unhealthy: [25, 50], veryUnhealthy: [50, 100], hazardous: [100, Infinity] },
        co: { good: [0, 4], moderate: [4, 9], unhealthy: [9, 15], veryUnhealthy: [15, 30], hazardous: [30, Infinity] },
        no2: { good: [0, 0.05], moderate: [0.05, 0.1], unhealthy: [0.1, 0.2], veryUnhealthy: [0.2, 0.5], hazardous: [0.5, Infinity] },
        pm1: { good: [0, 15], moderate: [15, 30], unhealthy: [30, 55], veryUnhealthy: [55, 110], hazardous: [110, Infinity] },
        pm25: { good: [0, 12], moderate: [12, 35.4], unhealthy: [35.4, 55.4], veryUnhealthy: [55.4, 150.4], hazardous: [150.4, Infinity] },
        pm10: { good: [0, 54], moderate: [54, 154], unhealthy: [154, 254], veryUnhealthy: [254, 354], hazardous: [354, Infinity] }
    },
    colors: {
        good: '#2ecc71',
        moderate: '#f1c40f',
        unhealthy: '#e67e22',
        veryUnhealthy: '#e74c3c',
        hazardous: '#8e44ad',
        parameter: {
            temperature: '#e74c3c',
            humidity: '#3498db',
            co2: '#2ecc71',
            h2s: '#f39c12',
            nh3: '#9b59b6',
            co: '#1abc9c',
            no2: '#d35400',
            pm1: '#34495e',
            pm25: '#7f8c8d',
            pm10: '#c0392b'
        }
    },
    recommendations: {
        good: "Kualitas udara sangat baik. Aktivitas luar ruangan dapat dilakukan dengan nyaman.",
        moderate: "Kualitas udara cukup baik. Orang dengan sensitivitas tertentu mungkin merasakan efek ringan.",
        unhealthy: "Kualitas udara tidak sehat untuk kelompok sensitif (anak-anak, lansia, penderita asma). Kurangi aktivitas luar ruangan yang berat.",
        veryUnhealthy: "Kualitas udara tidak sehat untuk semua orang. Hindari aktivitas luar ruangan yang lama dan gunakan masker jika harus keluar.",
        hazardous: "Kualitas udara berbahaya. Tetap di dalam ruangan dengan ventilasi yang baik dan gunakan masker N95 jika harus keluar. Segera laporkan ke pihak berwenang."
    },
    alerts: {
        h2s: "Peringatan! Level H₂S melebihi ambang batas aman (0.1 ppm). Hindari area tersebut dan gunakan masker gas.",
        nh3: "Peringatan! Level NH₃ melebihi ambang batas aman (25 ppm). Ventilasi area dan hindari paparan langsung.",
        co: "Peringatan! Level CO melebihi ambang batas aman (9 ppm). Segera cari udara segar dan laporkan ke petugas.",
        no2: "Peringatan! Level NO₂ melebihi ambang batas aman (0.1 ppm). Hindari aktivitas fisik berat di luar ruangan.",
        pm25: "Peringatan! Level PM2.5 melebihi ambang batas aman (35.4 µg/m³). Gunakan masker N95 jika harus keluar ruangan."
    }
};

// ====================== VARIABEL GLOBAL ======================
let appState = {
    currentDevice: 'kkn',
    currentTimeRange: '24h',
    currentParameter: 'all',
    historicalData: [],
    latestData: null,
    chart: null,
    dataFetchInterval: null,
    chartDataCache: {},
    map: null,
    markers: {},
    sensorLocations: {
        kkn: [-7.40193, 112.45805],
        ppk: [-7.40169, 112.45459]
    }
};

// ====================== INISIALISASI APLIKASI ======================
function initApplication() {
    setupUIElements();
    setupEventListeners();
    setupChart();
    setupMap();
    startDataPolling();
    initializeDateTimePickers();
    updateDeviceTitle();
}

function setupUIElements() {
    // Inisialisasi elemen UI yang diperlukan
    if (!document.getElementById('databaseSource')) {
        console.error('Element databaseSource tidak ditemukan');
        return;
    }
}

function initializeDateTimePickers() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    document.getElementById('startDate').value = yesterday.toISOString().slice(0, 16);
    document.getElementById('endDate').value = now.toISOString().slice(0, 16);
}

// ====================== MANAJEMEN DATA ======================
function startDataPolling() {
    clearInterval(appState.dataFetchInterval);
    fetchLatestData();
    fetchHistoricalData(appState.currentTimeRange);
    appState.dataFetchInterval = setInterval(fetchLatestData, 60000);
}

async function fetchLatestData() {
    try {
        const url = `${config.api.baseUrl}${config.api.endpoints.getData}?device_id=${config.api.devices[appState.currentDevice].id}&limit=1`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            appState.latestData = result.data[0];
            updateDashboard(appState.latestData);
            checkForAlerts(appState.latestData);
        }
    } catch (error) {
        console.error('Error fetching latest data:', error);
        updateConnectionStatus(false);
    }
}

async function fetchHistoricalData(range, startDate, endDate) {
    const cacheKey = `${appState.currentDevice}-${range}-${startDate}-${endDate}`;
    
    if (appState.chartDataCache[cacheKey]) {
        updateChartView();
        updateTable(appState.chartDataCache[cacheKey]);
        return;
    }

    try {
        let url = `${config.api.baseUrl}${config.api.endpoints.getData}?device_id=${config.api.devices[appState.currentDevice].id}&limit=100`;
        
        if (range === 'custom' && startDate && endDate) {
            const startStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
            const endStr = endDate.toISOString().slice(0, 19).replace('T', ' ');
            url += `&start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}`;
        } else if (range !== 'custom') {
            const hoursMap = {
                '1h': 1, '6h': 6, '12h': 12, '24h': 24,
                '3d': 72, '7d': 168, '14d': 336, '30d': 720
            };
            url += `&last_hours=${hoursMap[range]}`;
        }

        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            const processedData = processHistoricalData(result.data);
            appState.chartDataCache[cacheKey] = processedData;
            appState.historicalData = processedData;
            
            updateChartView();
            updateTable(processedData);
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
        showErrorInTable('Gagal memuat data. Silakan coba lagi.');
    }
}

function processHistoricalData(data) {
    return data.map(item => ({
        timestamp: new Date(item.timestamp).getTime(),
        temperature: item.suhu,
        humidity: item.kelembapan,
        co2: item.co2,
        h2s: item.h2s,
        nh3: item.nh3,
        co: item.co,
        no2: item.no2,
        pm1: item.pm1_0,
        pm25: item.pm2_5,
        pm10: item.pm10
    })).sort((a, b) => b.timestamp - a.timestamp);
}

// ====================== TAMPILAN DASHBOARD ======================
function updateDashboard(data) {
    if (!data) return;
    
    updateConnectionStatus(true);
    updateLastUpdateTime(data.timestamp);
    updateSensorDisplays(data);
    updateOverallStatus(data);
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
    }
}

function updateLastUpdateTime(timestamp) {
    const timeElement = document.getElementById('lastUpdateTime');
    if (!timeElement) return;
    
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('id-ID');
    const dateString = date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    timeElement.textContent = `Terakhir Update: ${timeString}, ${dateString}`;
}

function updateSensorDisplays(data) {
    const sensors = [
        { key: 'temperature', value: data.suhu, unit: '°C', element: 'temperatureValue', status: 'temperatureStatus', time: 'temperatureTime' },
        { key: 'humidity', value: data.kelembapan, unit: '%', element: 'humidityValue', status: 'humidityStatus', time: 'humidityTime' },
        { key: 'co2', value: data.co2, unit: 'ppm', element: 'co2Value', status: 'co2Status', time: 'co2Time' },
        { key: 'h2s', value: data.h2s, unit: 'ppm', element: 'h2sValue', status: 'h2sStatus', time: 'h2sTime' },
        { key: 'nh3', value: data.nh3, unit: 'ppm', element: 'nh3Value', status: 'nh3Status', time: 'nh3Time' },
        { key: 'co', value: data.co, unit: 'ppm', element: 'coValue', status: 'coStatus', time: 'coTime' },
        { key: 'no2', value: data.no2, unit: 'ppm', element: 'no2Value', status: 'no2Status', time: 'no2Time' },
        { key: 'pm1', value: data.pm1_0, unit: 'µg/m³', element: 'pm1Value', status: 'pm1Status', time: 'pm1Time' },
        { key: 'pm25', value: data.pm2_5, unit: 'µg/m³', element: 'pm25Value', status: 'pm25Status', time: 'pm25Time' },
        { key: 'pm10', value: data.pm10, unit: 'µg/m³', element: 'pm10Value', status: 'pm10Status', time: 'pm10Time' }
    ];

    sensors.forEach(sensor => {
        updateSensorDisplay(
            sensor.key,
            sensor.value,
            sensor.unit,
            new Date(data.timestamp),
            sensor.element,
            sensor.status,
            sensor.time
        );
    });
}

function updateSensorDisplay(sensor, value, unit, timestamp, valueElementId, statusElementId, timeElementId) {
    const valueElement = document.getElementById(valueElementId);
    const statusElement = document.getElementById(statusElementId);
    const timeElement = document.getElementById(timeElementId);
    
    if (valueElement) {
        valueElement.textContent = typeof value === 'number' ? 
            value.toFixed(sensor === 'temperature' || sensor === 'humidity' ? 1 : 2) : '-';
    }
    
    if (statusElement) {
        const status = getAirQualityStatus(sensor, value);
        statusElement.textContent = status.text;
        statusElement.className = `sensor-status status-${status.level}-text`;
    }
    
    if (timeElement) {
        timeElement.textContent = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
}

function getAirQualityStatus(sensor, value) {
    if (value === undefined || value === null) return { level: 'unknown', text: '-' };
    
    const threshold = config.thresholds[sensor];
    if (!threshold) return { level: 'unknown', text: '-' };
    
    if (value < threshold.good[1]) return { level: 'good', text: 'Baik' };
    if (value < threshold.moderate[1]) return { level: 'moderate', text: 'Cukup' };
    if (value < threshold.unhealthy[1]) return { level: 'unhealthy', text: 'Tidak Sehat' };
    if (value < threshold.veryUnhealthy[1]) return { level: 'veryUnhealthy', text: 'Sangat Tidak Sehat' };
    return { level: 'hazardous', text: 'Berbahaya' };
}

function updateOverallStatus(data) {
    let overallStatus = 'good';
    let worstParameter = '';
    let worstValue = 0;
    
    const parameters = ['co2', 'h2s', 'nh3', 'co', 'no2', 'pm25', 'pm10'];
    parameters.forEach(param => {
        const value = data[param] || 0;
        const status = getAirQualityStatus(param, value);
        const statusLevels = { good: 1, moderate: 2, unhealthy: 3, veryUnhealthy: 4, hazardous: 5 };
        const currentLevel = statusLevels[status.level];
        const overallLevel = statusLevels[overallStatus];
        
        if (currentLevel > overallLevel) {
            overallStatus = status.level;
            worstParameter = param;
            worstValue = value;
        }
    });
    
    updateStatusCircle(overallStatus);
    updateStatusMessage(overallStatus, worstParameter, worstValue);
    updateRecommendation(overallStatus);
}

function updateStatusCircle(status) {
    const statusCircle = document.querySelector('.status-circle');
    if (!statusCircle) return;
    
    statusCircle.className = 'status-circle';
    statusCircle.classList.add(`status-${status}`);
    
    const statusIcons = {
        good: 'fa-smile',
        moderate: 'fa-meh',
        unhealthy: 'fa-frown',
        veryUnhealthy: 'fa-sad-tear',
        hazardous: 'fa-skull'
    };
    
    const statusIcon = statusCircle.querySelector('i');
    const statusText = statusCircle.querySelector('span');
    
    if (statusIcon) statusIcon.className = `fas ${statusIcons[status]}`;
    if (statusText) {
        statusText.textContent = {
            good: 'Baik',
            moderate: 'Cukup',
            unhealthy: 'Tidak Sehat',
            veryUnhealthy: 'Sangat Tidak Sehat',
            hazardous: 'Berbahaya'
        }[status];
    }
}

function updateStatusMessage(status, worstParameter, worstValue) {
    const statusMessage = document.querySelector('.status-message h3');
    const statusDescription = document.querySelector('.status-message p');
    
    if (statusMessage) {
        statusMessage.textContent = {
            good: 'Kualitas Udara Baik',
            moderate: 'Kualitas Udara Cukup',
            unhealthy: 'Kualitas Udara Tidak Sehat',
            veryUnhealthy: 'Kualitas Udara Sangat Tidak Sehat',
            hazardous: 'Kualitas Udara Berbahaya'
        }[status];
    }
    
    if (statusDescription && worstParameter) {
        const paramNames = {
            co2: 'CO₂', h2s: 'H₂S', nh3: 'NH₃', co: 'CO',
            no2: 'NO₂', pm25: 'PM2.5', pm10: 'PM10'
        };
        statusDescription.textContent = `Parameter terburuk: ${paramNames[worstParameter]} (${worstValue.toFixed(2)})`;
    }
}

function updateRecommendation(status) {
    const recommendationElement = document.getElementById('actionRecommendation');
    if (recommendationElement) {
        recommendationElement.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Rekomendasi Tindakan</h3>
            <p>${config.recommendations[status]}</p>
        `;
    }
}

// ====================== MANAJEMEN ALERT ======================
function checkForAlerts(data) {
    const alertParams = {
        h2s: data.h2s,
        nh3: data.nh3,
        co: data.co,
        no2: data.no2,
        pm25: data.pm2_5
    };
    
    let showAlert = false;
    let alertParam = '';
    let alertValue = 0;
    
    Object.keys(alertParams).forEach(param => {
        const value = alertParams[param];
        if (value !== undefined && value !== null) {
            const status = getAirQualityStatus(param, value);
            if (status.level === 'veryUnhealthy' || status.level === 'hazardous') {
                showAlert = true;
                alertParam = param;
                alertValue = value;
            }
        }
    });
    
    if (showAlert) {
        showAlertNotification(alertParam, alertValue);
    }
}

function showAlertNotification(param, value) {
    const alertNotification = document.getElementById('alertNotification');
    const alertMessage = document.getElementById('alertMessage');
    
    if (alertNotification && alertMessage) {
        alertMessage.textContent = config.alerts[param] || `Level ${param} mencapai ${value.toFixed(2)} yang berbahaya!`;
        alertNotification.classList.add('show');
        
        setTimeout(() => {
            alertNotification.classList.remove('show');
        }, 10000);
    }
}

// ====================== MANAJEMEN CHART ======================
function setupChart() {
    const ctx = document.getElementById('mainChart')?.getContext('2d');
    if (!ctx) return;
    
    appState.chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Data Historis Kualitas Udara' },
                tooltip: { mode: 'index', intersect: false },
                zoom: {
                    zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                    pan: { enabled: true, mode: 'xy' }
                }
            },
            scales: {
                x: { 
                    type: 'time', 
                    time: { 
                        tooltipFormat: 'dd/MM/yyyy HH:mm',
                        displayFormats: { hour: 'HH:mm', day: 'dd/MM' }
                    },
                    title: { display: true, text: 'Waktu' }
                },
                y: { title: { display: true, text: 'Nilai' } }
            },
            interaction: { intersect: false, mode: 'nearest' }
        }
    });
}

function updateChartView() {
    if (!appState.chart || appState.historicalData.length === 0) return;
    
    const selectedParam = document.getElementById('parameterSelect')?.value || 'all';
    appState.currentParameter = selectedParam;
    
    const datasets = selectedParam === 'all' ? 
        getAllParametersDataset() : 
        getSingleParameterDataset(selectedParam);
    
    appState.chart.data.datasets = datasets;
    appState.chart.data.labels = appState.historicalData.map(point => new Date(point.timestamp));
    appState.chart.update();
}

function getAllParametersDataset() {
    return [
        createDataset('temperature', 'Suhu (°C)'),
        createDataset('humidity', 'Kelembapan (%)'),
        createDataset('co2', 'CO₂ (ppm)'),
        createDataset('h2s', 'H₂S (ppm)'),
        createDataset('nh3', 'NH₃ (ppm)'),
        createDataset('co', 'CO (ppm)'),
        createDataset('no2', 'NO₂ (ppm)'),
        createDataset('pm1', 'PM1.0 (µg/m³)'),
        createDataset('pm25', 'PM2.5 (µg/m³)'),
        createDataset('pm10', 'PM10 (µg/m³)')
    ];
}

function getSingleParameterDataset(param) {
    const paramConfig = {
        temperature: { label: 'Suhu (°C)', color: config.colors.parameter.temperature },
        humidity: { label: 'Kelembapan (%)', color: config.colors.parameter.humidity },
        co2: { label: 'CO₂ (ppm)', color: config.colors.parameter.co2 },
        h2s: { label: 'H₂S (ppm)', color: config.colors.parameter.h2s },
        nh3: { label: 'NH₃ (ppm)', color: config.colors.parameter.nh3 },
        co: { label: 'CO (ppm)', color: config.colors.parameter.co },
        no2: { label: 'NO₂ (ppm)', color: config.colors.parameter.no2 },
        pm1: { label: 'PM1.0 (µg/m³)', color: config.colors.parameter.pm1 },
        pm25: { label: 'PM2.5 (µg/m³)', color: config.colors.parameter.pm25 },
        pm10: { label: 'PM10 (µg/m³)', color: config.colors.parameter.pm10 }
    };
    
    return [createDataset(param, paramConfig[param].label, paramConfig[param].color)];
}

function createDataset(param, label, color = null) {
    const defaultColor = config.colors.parameter[param] || '#3498db';
    return {
        label,
        data: appState.historicalData.map(point => ({
            x: new Date(point.timestamp),
            y: point[param] || null
        })),
        borderColor: color || defaultColor,
        backgroundColor: (color || defaultColor) + '20',
        fill: param !== 'all',
        tension: 0.1
    };
}

// ====================== MANAJEMEN TABEL ======================
function updateTable(data) {
    const tableBody = document.querySelector('#historyTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        showErrorInTable('Tidak ada data dalam rentang waktu ini');
        return;
    }
    
    data.forEach((point, index) => {
        const row = document.createElement('tr');
        if (index % 2 === 0) row.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
        
        row.innerHTML = `
            <td>${new Date(point.timestamp).toLocaleString('id-ID')}</td>
            <td>${formatTableValue(point.temperature, 1)}</td>
            <td>${formatTableValue(point.humidity, 1)}</td>
            <td>${formatTableValue(point.co2, 2)}</td>
            <td>${formatTableValue(point.h2s, 2)}</td>
            <td>${formatTableValue(point.nh3, 2)}</td>
            <td>${formatTableValue(point.co, 2)}</td>
            <td>${formatTableValue(point.no2, 2)}</td>
            <td>${formatTableValue(point.pm1, 2)}</td>
            <td>${formatTableValue(point.pm25, 2)}</td>
            <td>${formatTableValue(point.pm10, 2)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function showErrorInTable(message) {
    const tableBody = document.querySelector('#historyTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: red;">${message}</td></tr>`;
    }
}

function formatTableValue(value, decimals) {
    return value !== undefined && value !== null ? value.toFixed(decimals) : '-';
}

// ====================== MANAJEMEN MAP ======================
function setupMap() {
    const centerLat = (appState.sensorLocations.kkn[0] + appState.sensorLocations.ppk[0]) / 2;
    const centerLng = (appState.sensorLocations.kkn[1] + appState.sensorLocations.ppk[1]) / 2;
    
    appState.map = L.map('sensorMap').setView([centerLat, centerLng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(appState.map);
    
    const sensorIcon = L.divIcon({
        className: 'sensor-marker',
        html: '<i class="fas fa-wind"></i>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    // Add markers for both locations
    appState.markers.kkn = L.marker(appState.sensorLocations.kkn, { icon: sensorIcon })
        .addTo(appState.map)
        .bindPopup(createPopupContent('KKN-PM ITS', 'SDN Mojolebak', appState.sensorLocations.kkn));
    
    appState.markers.ppk = L.marker(appState.sensorLocations.ppk, { icon: sensorIcon })
        .addTo(appState.map)
        .bindPopup(createPopupContent('PPK-ORMAWA', 'Balai Desa Mojolebak', appState.sensorLocations.ppk));
    
    // Open popup for current device
    appState.markers[appState.currentDevice].openPopup();
}

function createPopupContent(title, location, coordinates) {
    return `
        <b>${title}</b><br>
        ${location}<br>
        Koordinat: ${coordinates[0]}, ${coordinates[1]}<br>
        Dipasang: 10 Agustus 2025
    `;
}

// ====================== DOWNLOAD DATA ======================
// ====================== FUNGSI DOWNLOAD YANG DIPERBAIKI ======================
async function downloadData() {
    const button = document.getElementById('downloadData');
    if (!button) return;
    
    try {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyiapkan...';
        button.disabled = true;

        // Dapatkan parameter yang sedang aktif
        const deviceId = config.api.devices[appState.currentDevice].id;
        let url = `${config.api.baseUrl}${config.api.endpoints.getData}?device_id=${deviceId}&download_all=true`;

        // Tambahkan parameter waktu berdasarkan selektor
        if (appState.currentTimeRange === 'custom') {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            if (startDate && endDate) {
                url += `&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
            }
        } else if (appState.currentTimeRange !== 'all') {
            const hoursMap = {
                '1h': 1, '6h': 6, '12h': 12, '24h': 24,
                '3d': 72, '7d': 168, '14d': 336, '30d': 720
            };
            if (hoursMap[appState.currentTimeRange]) {
                url += `&last_hours=${hoursMap[appState.currentTimeRange]}`;
            }
        }

        // Fetch semua data dari server
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status !== 'success' || !result.data) {
            throw new Error('Data tidak valid diterima dari server');
        }

        // Format data untuk Excel
        const excelData = result.data.map(item => ({
            'Waktu': new Date(item.timestamp).toLocaleString('id-ID'),
            'Suhu (°C)': item.suhu !== null ? Number(item.suhu) : null,
            'Kelembapan (%)': item.kelembapan !== null ? Number(item.kelembapan) : null,
            'CO₂ (ppm)': item.co2 !== null ? Number(item.co2) : null,
            'H₂S (ppm)': item.h2s !== null ? Number(item.h2s) : null,
            'NH₃ (ppm)': item.nh3 !== null ? Number(item.nh3) : null,
            'CO (ppm)': item.co !== null ? Number(item.co) : null,
            'NO₂ (ppm)': item.no2 !== null ? Number(item.no2) : null,
            'PM1.0 (µg/m³)': item.pm1_0 !== null ? Number(item.pm1_0) : null,
            'PM2.5 (µg/m³)': item.pm2_5 !== null ? Number(item.pm2_5) : null,
            'PM10 (µg/m³)': item.pm10 !== null ? Number(item.pm10) : null
        }));

        // Buat file Excel
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Udara");
        
        // Generate nama file
        const now = new Date();
        const deviceName = appState.currentDevice === 'kkn' ? 'KKN' : 'PPK';
        const timeRange = appState.currentTimeRange === 'custom' ? 
            `${document.getElementById('startDate').value}_to_${document.getElementById('endDate').value}` : 
            appState.currentTimeRange;
        
        XLSX.writeFile(wb, `Data_Udara_${deviceName}_${timeRange}_${now.toISOString().slice(0,10)}.xlsx`);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Gagal export data: ' + error.message);
    } finally {
        button.innerHTML = '<i class="fas fa-download"></i> Unduh Data';
        button.disabled = false;
    }
}

function formatExcelValue(value, decimals) {
    return value !== undefined && value !== null ? Number(value.toFixed(decimals)) : null;
}

// ====================== EVENT HANDLERS ======================
function setupEventListeners() {
    // Device selector change
    document.getElementById('databaseSource')?.addEventListener('change', handleDeviceChange);
    
    // Time range selector change
    document.getElementById('timeRangeSelect')?.addEventListener('change', handleTimeRangeChange);
    
    // Parameter selector change
    document.getElementById('parameterSelect')?.addEventListener('change', handleParameterChange);
    
    // Apply custom range button
    document.getElementById('applyCustomRange')?.addEventListener('click', handleCustomRangeApply);
    
    // Download data button
    document.getElementById('downloadData')?.addEventListener('click', downloadData);
    
    // Close alert button
    document.getElementById('closeAlert')?.addEventListener('click', () => {
        document.getElementById('alertNotification')?.classList.remove('show');
    });
    
    // Tab navigation
    document.querySelectorAll('.tabs li').forEach(tab => {
        tab.addEventListener('click', handleTabChange);
    });
}

function handleDeviceChange(e) {
    appState.currentDevice = e.target.value;
    updateDeviceTitle();
    refreshData();
    updateMapMarker();
}

function handleTimeRangeChange(e) {
    appState.currentTimeRange = e.target.value;
    
    if (appState.currentTimeRange === 'custom') {
        document.getElementById('customRangeControls').style.display = 'flex';
    } else {
        document.getElementById('customRangeControls').style.display = 'none';
        fetchHistoricalData(appState.currentTimeRange);
    }
}

function handleParameterChange() {
    updateChartView();
}

function handleCustomRangeApply() {
    const start = new Date(document.getElementById('startDate').value);
    const end = new Date(document.getElementById('endDate').value);
    
    if (start && end && start < end) {
        fetchHistoricalData('custom', start, end);
    } else {
        alert('Mohon pilih rentang waktu yang valid (waktu mulai harus sebelum waktu akhir)');
    }
}

function handleTabChange(e) {
    const tab = e.currentTarget;
    const tabId = tab.getAttribute('data-tab');
    
    // Update active tab
    document.querySelectorAll('.tabs li').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');
    
    // Handle specific tab actions
    if (tabId === 'charts' && appState.chart) {
        setTimeout(() => {
            appState.chart.resize();
            updateChartView();
        }, 100);
    }
    
    if (tabId === 'map' && appState.map) {
        setTimeout(() => {
            appState.map.invalidateSize();
        }, 100);
    }
}

// ====================== FUNGSI UTILITAS ======================
function updateDeviceTitle() {
    const titleElement = document.querySelector('.logo h1');
    if (!titleElement) return;
    
    const locations = {
        ppk: "Balai Desa Mojolebak, Mojokerto",
        kkn: "SDN Mojolebak, Mojokerto"
    };
    
    const span = titleElement.querySelector('span');
    if (span) {
        span.textContent = locations[appState.currentDevice];
    }
}

function updateMapMarker() {
    if (!appState.map || !appState.markers[appState.currentDevice]) return;
    
    Object.keys(appState.markers).forEach(key => {
        if (key === appState.currentDevice) {
            appState.markers[key].openPopup();
        } else {
            appState.markers[key].closePopup();
        }
    });
}

function refreshData() {
    clearInterval(appState.dataFetchInterval);
    appState.historicalData = [];
    fetchLatestData();
    fetchHistoricalData(appState.currentTimeRange);
    appState.dataFetchInterval = setInterval(fetchLatestData, 60000);
}

// ====================== INISIALISASI APLIKASI ======================
document.addEventListener('DOMContentLoaded', initApplication);