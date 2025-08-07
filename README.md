# 🌍 Solar-Powered Air Quality Monitoring System with Web Dashboard

**KKN-PM & PPK ORMAWA ITS 2025**  
A real-time, solar-powered air quality monitoring solution using gas and particulate sensors, complete with LCD display and Firebase integration for remote data visualization and health recommendations.

---

## 📌 About This Project

This project is part of the **KKN-PM & PPK ORMAWA ITS 2025** initiative, aiming to empower communities with affordable, real-time environmental monitoring tools. The system is deployed at **SDN Mojolebak, Mojokerto**, utilizing **gas sensors**, **particulate matter sensors**, and a **DHT22 for temperature and humidity**, with all data displayed locally on an **I2C LCD** and remotely via a **Firebase-connected web dashboard**.

---

## ⚙️ Features

- 🌞 Solar-powered and energy-efficient
- 📡 Real-time data collection from:
  - PM1.0 / PM2.5 / PM10 (Dust)
  - CO₂, CO, NH₃, H₂S, NO₂ (Gas pollutants)
  - Temperature and Humidity (DHT22)
- 💾 Data logging to Firebase Realtime Database
- 🖥️ LCD Display with rotating sensor info
- 📊 Web-based dashboard for real-time and historical visualization
- ⛑️ Health risk classification based on pollutant thresholds
- 📥 Downloadable CSV reports for further analysis
- 🔄 Auto-refresh and reconnection handling

---

## 🧰 Technologies Used

### 🔌 Hardware
- Arduino Uno / Mega (Sensor Node)
- ESP8266 (NodeMCU/WeMos) (IoT Node)
- PMS7003 or ZH03B (Particulate Sensor)
- MQ-Series Sensors (e.g. MQ-135, MQ-136)
- DHT22 (Temperature & Humidity)
- LCD 20x4 with I2C interface
- 12V Solar Panel + Battery Pack

### 🧪 Software
- Arduino IDE (C++ / Arduino Framework)
- Firebase Realtime Database
- Firebase Hosting (Web UI)
- Web Frontend: HTML + CSS + JavaScript

### 📦 JavaScript Libraries
- `Chart.js` — live data plotting
- `Leaflet.js` — map and location visualization
- `FileSaver.js` — download sensor data as CSV
- `Firebase JS SDK` — real-time data fetch

---

## 🚀 How It Works

### 🔁 Arduino (Sensor Node)
1. Collects air quality data from sensors.
2. Displays readings on the 20x4 LCD with a sliding info loop.
3. Sends data via Serial to the ESP8266.

### ☁️ ESP8266 (IoT Node)
1. Connects to Wi-Fi and Firebase.
2. Reads and parses data from Arduino.
3. Sends JSON objects to Firebase every 60 seconds.
4. Handles disconnection and auto-reconnection.

---

## 🌐 Web Dashboard Features

The dashboard is hosted on Firebase and offers:

- 📊 **Live Data Charts** (PM, gas, temperature, humidity)
- 📍 **Sensor Map** showing current location
- 🚦 **Air Quality Status**: Good, Moderate, Unhealthy, Hazardous
- 🧭 **Health Recommendations** based on real-time conditions
- 🕓 **Auto-refresh** every 1 minute
- 📥 **Download Data** button for exporting Excel logs
