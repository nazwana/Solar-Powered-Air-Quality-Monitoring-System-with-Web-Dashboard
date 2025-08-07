#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <SoftwareSerial.h>

#define DHTPIN 7
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 20, 4);

SoftwareSerial zhSerial(9, 10); // RX, TX
uint8_t buffer[24];
uint16_t pm1_0 = 0, pm2_5 = 0, pm10 = 0;

const int pinCO2 = A0;
const int pinH2S = A1;
const int pinNH3 = A2;
const int pinNO2 = A3;
const int pinCO  = A4;

float mapFloat(int x, int in_min, int in_max, float out_min, float out_max) {
  return (float)(x - in_min) * (out_max - out_min) / (float)(in_max - in_min) + out_min;
}

void printCenter(int row, String text) {
  int spaces = (20 - text.length()) / 2;
  lcd.setCursor(spaces, row);
  lcd.print(text);
}

int slide = -1;
unsigned long lastSwitch = 0;
const unsigned long interval = 2000;

void setup() {
  Serial.begin(115200);
  zhSerial.begin(9600);
  lcd.init();
  lcd.backlight();
  dht.begin();

  printCenter(0, "PPK-ORMAWA 2025");
  printCenter(1, "Air Quality Report");
  printCenter(2, "Institut Teknologi");
  printCenter(3, "Sepuluh Nopember");
  delay(5000);
  lcd.clear();
  slide = 0;
}

void loop() {
  if (zhSerial.available() >= 24) {
    if (zhSerial.read() == 0x42 && zhSerial.read() == 0x4D) {
      buffer[0] = 0x42;
      buffer[1] = 0x4D;
      for (int i = 2; i < 24; i++) {
        buffer[i] = zhSerial.read();
      }

      uint16_t checksum = 0;
      for (int i = 0; i < 22; i++) checksum += buffer[i];
      uint16_t receivedChecksum = (buffer[22] << 8) | buffer[23];

      if (checksum == receivedChecksum) {
        pm1_0 = (buffer[10] << 8) | buffer[11];
        pm2_5 = (buffer[12] << 8) | buffer[13];
        pm10  = (buffer[14] << 8) | buffer[15];
      }
    }
  }

  int adcCO2 = analogRead(pinCO2);
  int adcH2S = analogRead(pinH2S);
  int adcNH3 = analogRead(pinNH3);
  int adcCO  = analogRead(pinCO);
  int adcNO2 = analogRead(pinNO2);

  float ppmCO2 = mapFloat(adcCO2, 0, 1023, 0.0, 2000.0);
  float ppmH2S = mapFloat(adcH2S, 0, 1023, 0.0, 80.0);
  float ppmNH3 = mapFloat(adcNH3, 0, 1023, 0.0, 100.0);
  float ppmCO  = mapFloat(adcCO,  0, 1023, 1000.0, 0.0);
  float ppmNO2 = mapFloat(adcNO2, 0, 1023, 0.0, 5.0);

  float suhu = dht.readTemperature();
  float rh   = dht.readHumidity();

  Serial.println("=== Air Quality Monitoring ===");
  Serial.print("CO2  : "); Serial.print(ppmCO2); Serial.println(" ppm");
  Serial.print("H2S  : "); Serial.print(ppmH2S); Serial.println(" ppm");
  Serial.print("NH3  : "); Serial.print(ppmNH3); Serial.println(" ppm");
  Serial.print("CO   : "); Serial.print(ppmCO);  Serial.println(" ppm");
  Serial.print("NO2  : "); Serial.print(ppmNO2, 2); Serial.println(" ppm");
  Serial.print("Temp : "); Serial.print(suhu); Serial.println(" *C");
  Serial.print("Hum  : "); Serial.print(rh); Serial.println(" %");
  Serial.print("PM1.0: "); Serial.print(pm1_0); Serial.println(" µg/m3");
  Serial.print("PM2.5: "); Serial.print(pm2_5); Serial.println(" µg/m3");
  Serial.print("PM10 : "); Serial.print(pm10);  Serial.println(" µg/m3");
  Serial.println("------------------------");

  if (millis() - lastSwitch >= interval) {
    lcd.clear();

    if (slide == 0) {
      printCenter(0, "GAS SENSOR");
      lcd.setCursor(0, 1); lcd.print("CO2 : "); lcd.print((int)ppmCO2); lcd.print(" ppm");
      lcd.setCursor(0, 2); lcd.print("CO  : "); lcd.print((int)ppmCO);  lcd.print(" ppm");
      lcd.setCursor(0, 3); lcd.print("H2S : "); lcd.print((int)ppmH2S); lcd.print(" ppm");
      slide = 1;

    } else if (slide == 1) {
      printCenter(0, "GAS SENSOR");
      lcd.setCursor(0, 1); lcd.print("NH3 : "); lcd.print((int)ppmNH3); lcd.print(" ppm");
      lcd.setCursor(0, 2); lcd.print("NO2 : "); lcd.print(ppmNO2, 2);  lcd.print(" ppm");
      slide = 2;

    } else if (slide == 2) {
      printCenter(0, "PARTICULATES");
      lcd.setCursor(0, 1); lcd.print("PM1.0 : "); lcd.print(pm1_0);  lcd.print(" ug/m3");
      lcd.setCursor(0, 2); lcd.print("PM2.5 : "); lcd.print(pm2_5);  lcd.print(" ug/m3");
      lcd.setCursor(0, 3); lcd.print("PM10  : "); lcd.print(pm10);   lcd.print(" ug/m3");
      slide = 3;

    } else if (slide == 3) {
      printCenter(0, "ENVIRONMENT STATUS");
      lcd.setCursor(0, 1); lcd.print("Temp : ");
      isnan(suhu) ? lcd.print("Err") : lcd.print(suhu, 1), lcd.print((char)223), lcd.print("C");

      lcd.setCursor(0, 2); lcd.print("Hum  : ");
      isnan(rh) ? lcd.print("Err") : lcd.print(rh, 1), lcd.print(" %");
      slide = 0;
    }

    lastSwitch = millis();
  }
}