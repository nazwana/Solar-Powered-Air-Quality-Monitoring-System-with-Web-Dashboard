#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define WIFI_SSID "GRATIS"
#define WIFI_PASSWORD "Gakgratis"
#define API_KEY "AIzaSyDM_Gxf6i-uesZf4e6SfXEd7-eAHHt9LXk"
#define DATABASE_URL "https://air-quality-monitoring-ppk-default-rtdb.firebaseio.com/"
#define USER_EMAIL "airquality011@gmail.com"
#define USER_PASSWORD "kkn12345"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

float suhu = NAN, hum = NAN, co2 = NAN, h2s = NAN, nh3 = NAN, co = NAN, no2 = NAN;
int pm1 = -1, pm25 = -1, pm10 = -1;

unsigned long lastSend = 0;
const unsigned long intervalSend = 60000;
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000; 

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);
}

void setup() {
  Serial.begin(115200);
  delay(500);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("🔌 Menghubungkan WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi terhubung");

  setupFirebase();

  Serial.println("🔐 Login Firebase...");
  while (!Firebase.ready()) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\n✅ Firebase siap");
}

bool checkFirebaseConnection() {
  if (!Firebase.ready() || WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Koneksi Firebase/WiFi terputus, mencoba menghubungkan kembali...");
    
    if (WiFi.status() != WL_CONNECTED) {
      WiFi.reconnect();
      delay(1000);
    }
    
    if (millis() - lastReconnectAttempt > reconnectInterval) {
      lastReconnectAttempt = millis();
      setupFirebase();
    }
    return false;
  }
  return true;
}

void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();

    if (line.startsWith("CO2"))       co2 = line.substring(7).toFloat();
    else if (line.startsWith("H2S"))  h2s = line.substring(7).toFloat();
    else if (line.startsWith("NH3"))  nh3 = line.substring(7).toFloat();
    else if (line.startsWith("CO"))   co  = line.substring(7).toFloat();
    else if (line.startsWith("NO2"))  no2 = line.substring(7).toFloat();
    else if (line.startsWith("Temp")) suhu = line.substring(7).toFloat();
    else if (line.startsWith("Hum"))  hum  = line.substring(7).toFloat();
    else if (line.startsWith("PM1.0")) pm1 = line.substring(7).toInt();
    else if (line.startsWith("PM2.5")) pm25 = line.substring(7).toInt();
    else if (line.startsWith("PM10"))  pm10 = line.substring(7).toInt();
  }

  if (millis() - lastSend > intervalSend && !isnan(suhu) && !isnan(hum)) {
    if (checkFirebaseConnection()) {
      Serial.println("📤 Kirim data ke Firebase...");

      bool ok = true;
      FirebaseJson json;
      json.set("suhu", suhu);
      json.set("kelembapan", hum);
      json.set("CO2", co2);
      json.set("H2S", h2s);
      json.set("NH3", nh3);
      json.set("CO", co);
      json.set("NO2", no2);
      json.set("PM1_0", pm1);
      json.set("PM2_5", pm25);
      json.set("PM10", pm10);

      ok = Firebase.RTDB.setJSON(&fbdo, "/sensor", &json);

      if (ok) {
        Serial.println("✅ Data berhasil dikirim");
        suhu = NAN; hum = NAN; co2 = NAN; h2s = NAN; nh3 = NAN; co = NAN; no2 = NAN;
        pm1 = -1; pm25 = -1; pm10 = -1;
      } else {
        Serial.print("❌ Gagal: ");
        Serial.println(fbdo.errorReason());
      }

      lastSend = millis();
    }
  }
}