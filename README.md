# 🌍 Solar-Powered Air Quality Monitoring System with Web Dashboard

**KKN-PM & PPK ORMAWA ITS 2025**  
A real-time, solar-powered air quality monitoring solution using various gas and particulate sensors, complete with an LCD display and Firebase integration for remote data visualization.

---

## 📌 About This Project

This project is part of the **KKN-PM & PPK ORMAWA ITS 2025** initiative, aiming to empower communities with affordable, real-time environmental monitoring tools. The system utilizes **gas sensors**, **particulate sensors**, and **DHT22 for temperature and humidity**, with all data displayed locally on an **I2C LCD** and remotely on a **Firebase-connected web dashboard**.

---

## ⚙️ Features

- 🌞 **Solar-powered and energy-efficient**
- 📡 **Real-time data collection** from:
  - PM1.0 / PM2.5 / PM10 (Dust)
  - CO2, CO, NH3, H2S, NO2 (Gas pollutants)
  - Temperature and humidity (DHT22)
- 💾 **Data logging to Firebase Realtime Database**
- 📊 **Web-based dashboard** (via Firebase RTDB)
- 🖥️ **LCD Display with rotating sensor info**
- 🔄 Automatic data refresh and reconnection handling

---

## 🧰 Technologies Used

### 🔌 Hardware
- Arduino Uno / Mega
- ESP8266 (NodeMCU/WeMos)
- PMS7003 / ZH03B (Particulate Sensor)
- MQ-Series Sensors (MQ-135, MQ-136, etc.)
- DHT22 (Temperature & Humidity)
- LCD 20x4 with I2C interface
- Solar panel & battery pack (12V)

### 🧪 Software
- Arduino IDE
- Firebase Realtime Database
- C++ with Arduino Libraries:
  - `DHT.h`
  - `LiquidCrystal_I2C.h`
  - `SoftwareSerial.h`
  - `Firebase_ESP_Client.h`

---

## 🚀 How It Works

### 🔁 Arduino (Sensor Node)
1. Reads sensor data (gas, dust, temp, humidity)
2. Displays readings on 20x4 LCD screen with slide mode
3. Sends data via Serial to ESP8266

### ☁️ ESP8266 (IoT Node)
1. Connects to Wi-Fi and Firebase
2. Parses Serial input from Arduino
3. Uploads data to Firebase every 60 seconds
4. Automatically reconnects if Wi-Fi/Firebase drops

---
