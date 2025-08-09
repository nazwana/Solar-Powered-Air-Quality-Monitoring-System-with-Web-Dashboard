// Firebase Configurations
const firebaseConfigs = {
    kkn: {
        apiKey: "AIzaSyAO587KrT4Agx2L6bsyVqauQNz6c_VVQeQ",
        databaseURL: "https://air-quality-monitoring-kkn-default-rtdb.firebaseio.com/",
        projectId: "air-quality-monitoring-kkn"
    },
    ppk: {
        apiKey: "AIzaSyDM_Gxf6i-uesZf4e6SfXEd7-eAHHt9LXk",
        databaseURL: "https://air-quality-monitoring-ppk-default-rtdb.firebaseio.com/",
        projectId: "air-quality-monitoring-ppk"
    }
};

// Initialize Firebase Apps
let databases = {
    kkn: firebase.initializeApp(firebaseConfigs.kkn, 'kkn'),
    ppk: firebase.initializeApp(firebaseConfigs.ppk, 'ppk')
};

let currentDatabase = 'kkn';
let database = databases[currentDatabase].database();

// DOM Elements
const elements = {
    // Dashboard elements
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    connectionStatus: document.getElementById('connectionStatus'),
    overallStatus: document.getElementById('overallStatus'),
    actionRecommendation: document.getElementById('actionRecommendation'),
    alertNotification: document.getElementById('alertNotification'),
    alertMessage: document.getElementById('alertMessage'),
    closeAlert: document.getElementById('closeAlert'),
    databaseSource: document.getElementById('databaseSource'),
    
    // Sensor values
    temperatureValue: document.getElementById('temperatureValue'),
    humidityValue: document.getElementById('humidityValue'),
    co2Value: document.getElementById('co2Value'),
    h2sValue: document.getElementById('h2sValue'),
    nh3Value: document.getElementById('nh3Value'),
    coValue: document.getElementById('coValue'),
    no2Value: document.getElementById('no2Value'),
    pm1Value: document.getElementById('pm1Value'),
    pm25Value: document.getElementById('pm25Value'),
    pm10Value: document.getElementById('pm10Value'),
    
    // Sensor statuses
    temperatureStatus: document.getElementById('temperatureStatus'),
    humidityStatus: document.getElementById('humidityStatus'),
    co2Status: document.getElementById('co2Status'),
    h2sStatus: document.getElementById('h2sStatus'),
    nh3Status: document.getElementById('nh3Status'),
    coStatus: document.getElementById('coStatus'),
    no2Status: document.getElementById('no2Status'),
    pm1Status: document.getElementById('pm1Status'),
    pm25Status: document.getElementById('pm25Status'),
    pm10Status: document.getElementById('pm10Status'),
    
    // Sensor times
    temperatureTime: document.getElementById('temperatureTime'),
    humidityTime: document.getElementById('humidityTime'),
    co2Time: document.getElementById('co2Time'),
    h2sTime: document.getElementById('h2sTime'),
    nh3Time: document.getElementById('nh3Time'),
    coTime: document.getElementById('coTime'),
    no2Time: document.getElementById('no2Time'),
    pm1Time: document.getElementById('pm1Time'),
    pm25Time: document.getElementById('pm25Time'),
    pm10Time: document.getElementById('pm10Time'),
    
    // Chart elements
    parameterSelect: document.getElementById('parameterSelect'),
    timeRangeSelect: document.getElementById('timeRangeSelect'),
    customRangeControls: document.getElementById('customRangeControls'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    applyCustomRange: document.getElementById('applyCustomRange'),
    downloadData: document.getElementById('downloadData'),
    historyTable: document.getElementById('historyTable'),
    
    // Tab elements
    tabs: document.querySelectorAll('.tabs li'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Weather elements
    weatherTemp: document.getElementById('weatherTemp'),
    weatherHumidity: document.getElementById('weatherHumidity'),
    weatherWind: document.getElementById('weatherWind'),
    weatherCondition: document.getElementById('weatherCondition'),
};

// Chart Variables
let mainChart;
let historicalData = [];
let sensorLocations = {
    kkn: [-7.40193, 112.45805],
    ppk: [-7.40169, 112.45459]  // New location for PPK sensor
};
let map;
let markers = {};

// Thresholds for air quality (based on Indonesian standards and WHO)
const thresholds = {
    temperature: { 
        good: [20, 27], 
        moderate: [27, 30], 
        unhealthy: [30, 35], 
        veryUnhealthy: [35, 40], 
        hazardous: [40, Infinity] 
    },
    humidity: { 
        good: [30, 60], 
        moderate: [60, 70], 
        unhealthy: [70, 80], 
        veryUnhealthy: [80, 90], 
        hazardous: [90, Infinity] 
    },
    co2: { 
        good: [0, 600], 
        moderate: [600, 1000], 
        unhealthy: [1000, 1500], 
        veryUnhealthy: [1500, 2000], 
        hazardous: [2000, Infinity] 
    },
    h2s: { 
        good: [0, 0.005], 
        moderate: [0.005, 0.1], 
        unhealthy: [0.1, 20], 
        veryUnhealthy: [20, 50], 
        hazardous: [50, Infinity] 
    },
    nh3: { 
        good: [0, 10], 
        moderate: [10, 25], 
        unhealthy: [25, 50], 
        veryUnhealthy: [50, 100], 
        hazardous: [100, Infinity] 
    },
    co: { 
        good: [0, 4], 
        moderate: [4, 9], 
        unhealthy: [9, 15], 
        veryUnhealthy: [15, 30], 
        hazardous: [30, Infinity] 
    },
    no2: { 
        good: [0, 0.05], 
        moderate: [0.05, 0.1], 
        unhealthy: [0.1, 0.2], 
        veryUnhealthy: [0.2, 0.5], 
        hazardous: [0.5, Infinity] 
    },
    pm1: { 
        good: [0, 15], 
        moderate: [15, 30], 
        unhealthy: [30, 55], 
        veryUnhealthy: [55, 110], 
        hazardous: [110, Infinity] 
    },
    pm25: { 
        good: [0, 12], 
        moderate: [12, 35.4], 
        unhealthy: [35.4, 55.4], 
        veryUnhealthy: [55.4, 150.4], 
        hazardous: [150.4, Infinity] 
    },
    pm10: { 
        good: [0, 54], 
        moderate: [54, 154], 
        unhealthy: [154, 254], 
        veryUnhealthy: [254, 354], 
        hazardous: [354, Infinity] 
    }
};

// Action recommendations based on air quality
const recommendations = {
    good: "Kualitas udara sangat baik. Aktivitas luar ruangan dapat dilakukan dengan nyaman.",
    moderate: "Kualitas udara cukup baik. Orang dengan sensitivitas tertentu mungkin merasakan efek ringan.",
    unhealthy: "Kualitas udara tidak sehat untuk kelompok sensitif (anak-anak, lansia, penderita asma). Kurangi aktivitas luar ruangan yang berat.",
    veryUnhealthy: "Kualitas udara tidak sehat untuk semua orang. Hindari aktivitas luar ruangan yang lama dan gunakan masker jika harus keluar.",
    hazardous: "Kualitas udara berbahaya. Tetap di dalam ruangan dengan ventilasi yang baik dan gunakan masker N95 jika harus keluar. Segera laporkan ke pihak berwenang."
};

// Alert messages for dangerous levels
const alertMessages = {
    h2s: "Peringatan! Level H₂S melebihi ambang batas aman (0.1 ppm). Hindari area tersebut dan gunakan masker gas.",
    nh3: "Peringatan! Level NH₃ melebihi ambang batas aman (25 ppm). Ventilasi area dan hindari paparan langsung.",
    co: "Peringatan! Level CO melebihi ambang batas aman (9 ppm). Segera cari udara segar dan laporkan ke petugas.",
    no2: "Peringatan! Level NO₂ melebihi ambang batas aman (0.1 ppm). Hindari aktivitas fisik berat di luar ruangan.",
    pm25: "Peringatan! Level PM2.5 melebihi ambang batas aman (35.4 µg/m³). Gunakan masker N95 jika harus keluar ruangan."
};

// Initialize the application
function init() {
    setupTabs();
    setupChart();
    setupMap();
    setupEventListeners();
    fetchWeatherData();
    startDataListening();
    
    // Set default time range to last 24 hours
    fetchHistoricalData('24h');
    
    // Initialize custom date pickers with current date
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    
    elements.startDate.value = yesterday.toISOString().slice(0, 16);
    elements.endDate.value = now.toISOString().slice(0, 16);
}

// Set up tab navigation
function setupTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Resize chart when chart tab is activated
            if (tabId === 'charts' && mainChart) {
                setTimeout(() => {
                    mainChart.resize();
                    updateChartData();
                }, 100);
            }
            
            // Update map size when map tab is activated
            if (tabId === 'map' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
        });
    });
}

// Set up the main chart
function setupChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Data Historis Kualitas Udara',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'dd/MM/yyyy HH:mm',
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'dd/MM'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Waktu'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Nilai'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Set up the map with both sensor locations
function setupMap() {
    // Calculate center point between both locations
    const centerLat = (sensorLocations.kkn[0] + sensorLocations.ppk[0]) / 2;
    const centerLng = (sensorLocations.kkn[1] + sensorLocations.ppk[1]) / 2;
    
    map = L.map('sensorMap').setView([centerLat, centerLng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    const sensorIcon = L.divIcon({
        className: 'sensor-marker',
        html: '<i class="fas fa-wind"></i>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    // Add marker for KKN sensor
    markers.kkn = L.marker(sensorLocations.kkn, { icon: sensorIcon })
        .addTo(map)
        .bindPopup(`
            <b>Sensor KKN-PM ITS</b><br>
            SDN Mojolebak<br>
            Koordinat: ${sensorLocations.kkn[0]}, ${sensorLocations.kkn[1]}<br>
            Dipasang: 10 Agustus 2025
        `);
    
    // Add marker for PPK sensor
    markers.ppk = L.marker(sensorLocations.ppk, { icon: sensorIcon })
        .addTo(map)
        .bindPopup(`
            <b>Sensor PPK-ORMAWA</b><br>
            Balai Desa Mojolebak<br>
            Koordinat: ${sensorLocations.ppk[0]}, ${sensorLocations.ppk[1]}<br>
            Dipasang: 10 Agustus 2025
        `);
    
    // Open popup for current database's marker
    markers[currentDatabase].openPopup();
}

// Set up event listeners
function setupEventListeners() {
    // Close alert button
    elements.closeAlert.addEventListener('click', () => {
        elements.alertNotification.classList.remove('show');
    });
    
    // Time range selector
    elements.timeRangeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            elements.customRangeControls.style.display = 'flex';
        } else {
            elements.customRangeControls.style.display = 'none';
            fetchHistoricalData(e.target.value);
        }
    });
    
    // Apply custom range button
    elements.applyCustomRange.addEventListener('click', () => {
        const start = new Date(elements.startDate.value);
        const end = new Date(elements.endDate.value);
        
        if (start && end && start < end) {
            fetchHistoricalData('custom', start, end);
        } else {
            alert('Mohon pilih rentang waktu yang valid (waktu mulai harus sebelum waktu akhir)');
        }
    });
    
    // Parameter selector
    elements.parameterSelect.addEventListener('change', () => {
        updateChartData();
    });
    
    // Download data button
    elements.downloadData.addEventListener('click', downloadData);
    
    // Database source selector
    elements.databaseSource.addEventListener('change', (e) => {
        switchDatabase(e.target.value);
    });
}

// Switch between databases
function switchDatabase(db) {
    currentDatabase = db;
    database = databases[db].database();
    
    // Update UI to reflect database change
    document.querySelector('.logo h1 span').textContent = 
        db === 'kkn' ? ' Balai Desa Mojolebak, Mojokerto' : ' SDN Mojolebak, Mojokerto';
    
    // Highlight the active marker on the map
    Object.keys(markers).forEach(key => {
        if (key === db) {
            markers[key].openPopup();
        } else {
            markers[key].closePopup();
        }
    });
    
    // Clear existing data
    historicalData = [];
    
    // Start listening to new database
    startDataListening();
    
    // Refresh chart and table
    if (document.querySelector('.tabs li[data-tab="charts"].active')) {
        fetchHistoricalData(elements.timeRangeSelect.value);
    }
}

// Start listening for real-time data changes
function startDataListening() {
    // Remove any existing listeners
    database.ref('sensor').off();
    
    database.ref('sensor').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateConnectionStatus(true);
            updateDashboard(data);
            addToHistoricalData(data);
            checkForAlerts(data);
        }
    }, (error) => {
        updateConnectionStatus(false);
        console.error('Error reading data:', error);
    });
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    elements.connectionStatus.className = 'status-indicator ' + (connected ? 'connected' : 'disconnected');
}

// Update the dashboard with new data
function updateDashboard(data) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID');
    const dateString = now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    elements.lastUpdateTime.textContent = `Terakhir Update: ${timeString}, ${dateString}`;
    
    // Update sensor values
    if (data.suhu !== undefined) updateSensor('temperature', data.suhu, '°C', now);
    if (data.kelembapan !== undefined) updateSensor('humidity', data.kelembapan, '%', now);
    if (data.CO2 !== undefined) updateSensor('co2', data.CO2, 'ppm', now);
    if (data.H2S !== undefined) updateSensor('h2s', data.H2S, 'ppm', now);
    if (data.NH3 !== undefined) updateSensor('nh3', data.NH3, 'ppm', now);
    if (data.CO !== undefined) updateSensor('co', data.CO, 'ppm', now);
    if (data.NO2 !== undefined) updateSensor('no2', data.NO2, 'ppm', now);
    if (data.PM1_0 !== undefined) updateSensor('pm1', data.PM1_0, 'µg/m³', now);
    if (data.PM2_5 !== undefined) updateSensor('pm25', data.PM2_5, 'µg/m³', now);
    if (data.PM10 !== undefined) updateSensor('pm10', data.PM10, 'µg/m³', now);
    
    // Update overall air quality status
    updateOverallStatus(data);
}

// Update individual sensor display
function updateSensor(sensor, value, unit, timestamp) {
    const valueElement = elements[`${sensor}Value`];
    const statusElement = elements[`${sensor}Status`];
    const timeElement = elements[`${sensor}Time`];
    
    // Update value
    if (valueElement) {
        valueElement.textContent = typeof value === 'number' ? value.toFixed(sensor === 'temperature' || sensor === 'humidity' ? 1 : 2) : '-';
    }
    
    // Update status
    if (statusElement) {
        const status = getAirQualityStatus(sensor, value);
        statusElement.textContent = status.text;
        statusElement.className = `sensor-status status-${status.level}-text`;
    }
    
    // Update time
    if (timeElement) {
        timeElement.textContent = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
}

// Get air quality status for a given sensor and value
function getAirQualityStatus(sensor, value) {
    if (value === undefined || value === null) return { level: 'unknown', text: '-' };
    
    const threshold = thresholds[sensor];
    if (!threshold) return { level: 'unknown', text: '-' };
    
    if (value < threshold.good[1]) return { level: 'good', text: 'Baik' };
    if (value < threshold.moderate[1]) return { level: 'moderate', text: 'Cukup' };
    if (value < threshold.unhealthy[1]) return { level: 'unhealthy', text: 'Tidak Sehat' };
    if (value < threshold.veryUnhealthy[1]) return { level: 'veryUnhealthy', text: 'Sangat Tidak Sehat' };
    return { level: 'hazardous', text: 'Berbahaya' };
}

// Update overall air quality status
function updateOverallStatus(data) {
    // Calculate overall status based on the worst parameter
    let overallStatus = 'good';
    let worstParameter = '';
    let worstValue = 0;
    
    // Check each parameter
    const parameters = ['co2', 'h2s', 'nh3', 'co', 'no2', 'pm25', 'pm10'];
    parameters.forEach(param => {
        const value = data[param.toUpperCase()] || data[param] || 0;
        const status = getAirQualityStatus(param, value);
        
        // Convert status to numerical value for comparison
        const statusLevels = { good: 1, moderate: 2, unhealthy: 3, veryUnhealthy: 4, hazardous: 5 };
        const currentLevel = statusLevels[status.level];
        const overallLevel = statusLevels[overallStatus];
        
        if (currentLevel > overallLevel) {
            overallStatus = status.level;
            worstParameter = param;
            worstValue = value;
        }
    });
    
    // Update overall status display
    const statusCircle = elements.overallStatus.querySelector('.status-circle');
    const statusIcon = statusCircle.querySelector('i');
    const statusText = statusCircle.querySelector('span');
    const statusMessage = elements.overallStatus.querySelector('.status-message h3');
    const statusDescription = elements.overallStatus.querySelector('.status-message p');
    
    // Remove all status classes
    statusCircle.className = 'status-circle';
    statusCircle.classList.add(`status-${overallStatus}`);
    
    // Set appropriate icon
    const statusIcons = {
        good: 'fa-smile',
        moderate: 'fa-meh',
        unhealthy: 'fa-frown',
        veryUnhealthy: 'fa-sad-tear',
        hazardous: 'fa-skull'
    };
    
    statusIcon.className = `fas ${statusIcons[overallStatus]}`;
    statusText.textContent = overallStatus === 'good' ? 'Baik' : 
                           overallStatus === 'moderate' ? 'Cukup' :
                           overallStatus === 'unhealthy' ? 'Tidak Sehat' :
                           overallStatus === 'veryUnhealthy' ? 'Sangat Tidak Sehat' : 'Berbahaya';
    
    // Set status message
    const statusMessages = {
        good: 'Kualitas Udara Baik',
        moderate: 'Kualitas Udara Cukup',
        unhealthy: 'Kualitas Udara Tidak Sehat',
        veryUnhealthy: 'Kualitas Udara Sangat Tidak Sehat',
        hazardous: 'Kualitas Udara Berbahaya'
    };
    
    statusMessage.textContent = statusMessages[overallStatus];
    
    // Set description if there's a worst parameter
    if (worstParameter) {
        const paramNames = {
            co2: 'CO₂',
            h2s: 'H₂S',
            nh3: 'NH₃',
            co: 'CO',
            no2: 'NO₂',
            pm25: 'PM2.5',
            pm10: 'PM10'
        };
        
        statusDescription.textContent = `Parameter terburuk: ${paramNames[worstParameter]} (${worstValue.toFixed(2)})`;
    }
    
    // Update action recommendation
    elements.actionRecommendation.innerHTML = `
        <h3><i class="fas fa-lightbulb"></i> Rekomendasi Tindakan</h3>
        <p>${recommendations[overallStatus]}</p>
    `;
}

// Check for dangerous levels and show alerts
function checkForAlerts(data) {
    const alertParams = {
        h2s: data.H2S,
        nh3: data.NH3,
        co: data.CO,
        no2: data.NO2,
        pm25: data.PM2_5
    };
    
    let showAlert = false;
    let alertParam = '';
    let alertValue = 0;
    
    // Check each parameter for dangerous levels
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
    
    // Show alert if needed
    if (showAlert) {
        elements.alertMessage.textContent = alertMessages[alertParam] || `Level ${alertParam} mencapai ${alertValue.toFixed(2)} yang berbahaya!`;
        elements.alertNotification.classList.add('show');
        
        // Auto-hide alert after 10 seconds
        setTimeout(() => {
            elements.alertNotification.classList.remove('show');
        }, 10000);
    }
}

// Add new data to historical data array
function addToHistoricalData(data) {
    const now = new Date();
    const timestamp = now.getTime();
    
    historicalData.unshift({
        timestamp,
        temperature: data.suhu,
        humidity: data.kelembapan,
        co2: data.CO2,
        h2s: data.H2S,
        nh3: data.NH3,
        co: data.CO,
        no2: data.NO2,
        pm1: data.PM1_0,
        pm25: data.PM2_5,
        pm10: data.PM10
    });
    
    // Keep only the last 1000 data points to prevent memory issues
    if (historicalData.length > 1000) {
        historicalData.pop();
    }
    
    // Update chart if on charts tab
    if (document.querySelector('.tabs li[data-tab="charts"].active')) {
        updateChartData();
    }
}

// Fetch historical data based on time range
async function fetchHistoricalData(range, startDate, endDate) {
    try {
        // Show loading state
        const tbody = elements.historyTable.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Memuat data...</td></tr>';
        
        // In a real implementation, you would fetch from Firebase here
        // For demo purposes, we'll use the in-memory historicalData
        
        let filteredData = [...historicalData];
        const now = Date.now();
        
        switch (range) {
            case '1h':
                filteredData = filteredData.filter(d => now - d.timestamp <= 3600000);
                break;
            case '6h':
                filteredData = filteredData.filter(d => now - d.timestamp <= 21600000);
                break;
            case '12h':
                filteredData = filteredData.filter(d => now - d.timestamp <= 43200000);
                break;
            case '24h':
                filteredData = filteredData.filter(d => now - d.timestamp <= 86400000);
                break;
            case '3d':
                filteredData = filteredData.filter(d => now - d.timestamp <= 259200000);
                break;
            case '7d':
                filteredData = filteredData.filter(d => now - d.timestamp <= 604800000);
                break;
            case '14d':
                filteredData = filteredData.filter(d => now - d.timestamp <= 1209600000);
                break;
            case '30d':
                filteredData = filteredData.filter(d => now - d.timestamp <= 2592000000);
                break;
            case 'custom':
                if (startDate && endDate) {
                    const startTime = startDate.getTime();
                    const endTime = endDate.getTime();
                    filteredData = filteredData.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
                }
                break;
        }
        
        // Sort by timestamp (newest first)
        filteredData.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update historical data display
        updateHistoricalDataDisplay(filteredData);
        
        // Update chart
        updateChartData();
        
    } catch (error) {
        console.error('Error fetching historical data:', error);
        const tbody = elements.historyTable.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: red;">Gagal memuat data. Silakan coba lagi.</td></tr>';
    }
}

// Update the chart with current data
function updateChartData() {
    if (!mainChart) return;
    
    const selectedParam = elements.parameterSelect.value;
    const filteredData = [...historicalData]; // Use filtered data in real implementation
    
    if (selectedParam === 'all') {
        // Show all parameters
        const datasets = [
            { label: 'Suhu (°C)', data: [], borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', yAxisID: 'y' },
            { label: 'Kelembapan (%)', data: [], borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)', yAxisID: 'y' },
            { label: 'CO₂ (ppm)', data: [], borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)', yAxisID: 'y' },
            { label: 'H₂S (ppm)', data: [], borderColor: '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.1)', yAxisID: 'y' },
            { label: 'NH₃ (ppm)', data: [], borderColor: '#9b59b6', backgroundColor: 'rgba(155, 89, 182, 0.1)', yAxisID: 'y' },
            { label: 'CO (ppm)', data: [], borderColor: '#1abc9c', backgroundColor: 'rgba(26, 188, 156, 0.1)', yAxisID: 'y' },
            { label: 'NO₂ (ppm)', data: [], borderColor: '#d35400', backgroundColor: 'rgba(211, 84, 0, 0.1)', yAxisID: 'y' },
            { label: 'PM1.0 (µg/m³)', data: [], borderColor: '#34495e', backgroundColor: 'rgba(52, 73, 94, 0.1)', yAxisID: 'y' },
            { label: 'PM2.5 (µg/m³)', data: [], borderColor: '#7f8c8d', backgroundColor: 'rgba(127, 140, 141, 0.1)', yAxisID: 'y' },
            { label: 'PM10 (µg/m³)', data: [], borderColor: '#c0392b', backgroundColor: 'rgba(192, 57, 43, 0.1)', yAxisID: 'y' }
        ];
        
        filteredData.forEach(point => {
            const date = new Date(point.timestamp);
            
            datasets[0].data.push({ x: date, y: point.temperature });
            datasets[1].data.push({ x: date, y: point.humidity });
            datasets[2].data.push({ x: date, y: point.co2 });
            datasets[3].data.push({ x: date, y: point.h2s });
            datasets[4].data.push({ x: date, y: point.nh3 });
            datasets[5].data.push({ x: date, y: point.co });
            datasets[6].data.push({ x: date, y: point.no2 });
            datasets[7].data.push({ x: date, y: point.pm1 });
            datasets[8].data.push({ x: date, y: point.pm25 });
            datasets[9].data.push({ x: date, y: point.pm10 });
        });
        
        mainChart.data.labels = filteredData.map(point => new Date(point.timestamp));
        mainChart.data.datasets = datasets;
    } else {
        // Show single parameter
        const paramConfig = {
            temperature: { label: 'Suhu (°C)', color: '#e74c3c' },
            humidity: { label: 'Kelembapan (%)', color: '#3498db' },
            co2: { label: 'CO₂ (ppm)', color: '#2ecc71' },
            h2s: { label: 'H₂S (ppm)', color: '#f39c12' },
            nh3: { label: 'NH₃ (ppm)', color: '#9b59b6' },
            co: { label: 'CO (ppm)', color: '#1abc9c' },
            no2: { label: 'NO₂ (ppm)', color: '#d35400' },
            pm1: { label: 'PM1.0 (µg/m³)', color: '#34495e' },
            pm25: { label: 'PM2.5 (µg/m³)', color: '#7f8c8d' },
            pm10: { label: 'PM10 (µg/m³)', color: '#c0392b' }
        };
        
        const config = paramConfig[selectedParam];
        const dataset = {
            label: config.label,
            data: filteredData.map(point => ({
                x: new Date(point.timestamp),
                y: point[selectedParam]
            })),
            borderColor: config.color,
            backgroundColor: config.color.replace(')', ', 0.1)'),
            fill: true,
            tension: 0.1
        };
        
        mainChart.data.labels = filteredData.map(point => new Date(point.timestamp));
        mainChart.data.datasets = [dataset];
    }
    
    mainChart.update();
}

// Update historical data table display
function updateHistoricalDataDisplay(data) {
    const tableBody = elements.historyTable.querySelector('tbody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Tidak ada data dalam rentang waktu ini</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    data.forEach((point, index) => {
        const row = document.createElement('tr');
        const date = new Date(point.timestamp);
        
        // Alternate row colors
        if (index % 2 === 0) {
            row.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
        }
        
        row.innerHTML = `
            <td>${date.toLocaleString('id-ID')}</td>
            <td>${point.temperature !== undefined ? point.temperature.toFixed(1) : '-'}</td>
            <td>${point.humidity !== undefined ? point.humidity.toFixed(1) : '-'}</td>
            <td>${point.co2 !== undefined ? point.co2.toFixed(2) : '-'}</td>
            <td>${point.h2s !== undefined ? point.h2s.toFixed(2) : '-'}</td>
            <td>${point.nh3 !== undefined ? point.nh3.toFixed(2) : '-'}</td>
            <td>${point.co !== undefined ? point.co.toFixed(2) : '-'}</td>
            <td>${point.no2 !== undefined ? point.no2.toFixed(2) : '-'}</td>
            <td>${point.pm1 !== undefined ? point.pm1.toFixed(2) : '-'}</td>
            <td>${point.pm25 !== undefined ? point.pm25.toFixed(2) : '-'}</td>
            <td>${point.pm10 !== undefined ? point.pm10.toFixed(2) : '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Download data as Excel file
async function downloadData() {
    try {
        elements.downloadData.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyiapkan...';
        elements.downloadData.disabled = true;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!window.XLSX) throw new Error('Library Excel tidak tersedia');
        if (historicalData.length === 0) throw new Error('Tidak ada data');

        const now = new Date();
        const excelData = historicalData.map(item => ({
            Waktu: new Date(item.timestamp).toLocaleString('id-ID'),
            'Suhu (°C)': item.temperature?.toFixed(1) || '-',
            'Kelembapan (%)': item.humidity?.toFixed(1) || '-',
            'CO₂ (ppm)': item.co2?.toFixed(2) || '-',
            'H₂S (ppm)': item.h2s?.toFixed(2) || '-',
            'NH₃ (ppm)': item.nh3?.toFixed(2) || '-',
            'CO (ppm)': item.co?.toFixed(2) || '-',
            'NO₂ (ppm)': item.no2?.toFixed(2) || '-',
            'PM1.0 (µg/m³)': item.pm1?.toFixed(2) || '-',
            'PM2.5 (µg/m³)': item.pm25?.toFixed(2) || '-',
            'PM10 (µg/m³)': item.pm10?.toFixed(2) || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Udara");
        XLSX.writeFile(wb, `Data_Udara_${currentDatabase === 'kkn' ? 'KKN' : 'PPK'}_${now.toISOString().slice(0,10)}.xlsx`);

    } catch (error) {
        console.error('Export error:', error);
        alert('Gagal export: ' + error.message);
    } finally {
        elements.downloadData.innerHTML = '<i class="fas fa-download"></i> Unduh Data';
        elements.downloadData.disabled = false;
    }
}

// Fetch weather data for the sensor location (mock for this demo)
function fetchWeatherData() {
    // In a real app, this would call a weather API
    setTimeout(() => {
        elements.weatherTemp.textContent = '28.5';
        elements.weatherHumidity.textContent = '65';
        elements.weatherWind.textContent = '12';
        elements.weatherCondition.textContent = 'Cerah Berawan';
    }, 1000);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);