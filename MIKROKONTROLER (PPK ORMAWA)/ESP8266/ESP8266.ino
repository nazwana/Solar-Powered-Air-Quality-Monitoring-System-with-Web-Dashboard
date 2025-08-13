#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#define WIFI_SSID "GRATIS"
#define WIFI_PASSWORD "Gakgratis"

#define DEVICE_ID "device-2" // PPK Ormawa

const char* serverUrl = "https://udaramojolebak.com/api/save_data.php";

unsigned long lastSend = 0;
const unsigned long intervalSend = 60000;

float suhu = NAN, hum = NAN, co2 = NAN, h2s = NAN, nh3 = NAN, co = NAN, no2 = NAN;
int pm1 = -1, pm25 = -1, pm10 = -1;

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
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

bool sendData(const String &url, const String &payload) {
  WiFiClientSecure client;
  client.setInsecure(); // lewati verifikasi sertifikat (testing)
  HTTPClient http;

  String currentUrl = url;
  int redirectCount = 0;
  const int maxRedirects = 3;

  while (redirectCount < maxRedirects) {
    http.begin(client, currentUrl);
    http.addHeader("Content-Type", "application/json");

    Serial.println("📤 Mengirim data ke server...");
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      if (httpResponseCode == HTTP_CODE_MOVED_PERMANENTLY || httpResponseCode == HTTP_CODE_FOUND) {
        // Redirect
        String location = http.getLocation();
        Serial.print("🔄 Redirect ke: ");
        Serial.println(location);
        currentUrl = location;
        redirectCount++;
        http.end();
        continue; // ulang request ke URL baru
      } else {
        Serial.print("✅ Server response code: ");
        Serial.println(httpResponseCode);
        Serial.print("Response: ");
        Serial.println(http.getString());
        http.end();
        return true;
      }
    } else {
      Serial.print("❌ Error code: ");
      Serial.println(httpResponseCode);
      Serial.print("Error: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
      http.end();
      return false;
    }
  }
  Serial.println("⚠ Terlalu banyak redirect, hentikan.");
  return false;
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

  if (millis() - lastSend > intervalSend && !isnan(suhu)) {
    if (WiFi.status() == WL_CONNECTED) {
      DynamicJsonDocument doc(512);
      doc["device_id"] = DEVICE_ID;
      doc["suhu"] = suhu;
      doc["kelembapan"] = hum;
      doc["co2"] = co2;
      doc["h2s"] = h2s;
      doc["nh3"] = nh3;
      doc["co"] = co;
      doc["no2"] = no2;
      doc["pm1_0"] = pm1;
      doc["pm2_5"] = pm25;
      doc["pm10"] = pm10;

      String payload;
      serializeJson(doc, payload);

      if (sendData(serverUrl, payload)) {
        // Reset nilai setelah terkirim
        suhu = NAN; hum = NAN; co2 = NAN; h2s = NAN; nh3 = NAN; co = NAN; no2 = NAN;
        pm1 = -1; pm25 = -1; pm10 = -1;
      }
    } else {
      Serial.println("⚠ WiFi terputus, mencoba menghubungkan kembali...");
      WiFi.reconnect();
    }
    lastSend = millis();
  }
}