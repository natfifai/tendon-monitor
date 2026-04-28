// Tendon Monitor ESP32 Firmware Template
//
// This is a reference implementation showing how the device should talk to
// the Supabase backend. Adapt pin assignments and sensor library calls to
// match your actual hardware.
//
// Requires:
//   - ESP32 board support
//   - WiFi (built in)
//   - HTTPClient (built in)
//   - ArduinoJson library
//
// What this does:
//   1. Connects to WiFi
//   2. Polls the device-command endpoint every few seconds when idle
//   3. When a "start" command is received, begins sampling the sensor
//   4. Sends batches of samples to process-vibration
//   5. Stops when "stop" command is received

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =============================================
// CONFIGURATION: change these for your setup
// =============================================
const char* WIFI_SSID = "your_wifi_ssid";
const char* WIFI_PASSWORD = "your_wifi_password";

const char* SUPABASE_URL = "https://yourproject.supabase.co";
const char* DEVICE_AUTH_TOKEN = "your_device_auth_token";
const char* DEVICE_ID = "default";

const char* PROCESS_ENDPOINT = "/functions/v1/process-vibration";
const char* COMMAND_ENDPOINT = "/functions/v1/device-command";

const int SENSOR_PIN = 34;            // analog input pin for vibration sensor
const int SAMPLE_RATE_HZ = 2000;      // how fast to sample
const int BATCH_SIZE = 256;           // samples per batch sent to backend
const int COMMAND_POLL_MS = 3000;     // how often to check for commands when idle

// =============================================
// STATE
// =============================================
bool recording = false;
String currentCommandId = "";
unsigned long lastPollMs = 0;
float sampleBuffer[BATCH_SIZE];
int bufferIndex = 0;

// =============================================
// SETUP
// =============================================
void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);

  connectWiFi();
  Serial.println("[device] ready");
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[wifi] connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("\n[wifi] connected, ip: ");
  Serial.println(WiFi.localIP());
}

// =============================================
// MAIN LOOP
// =============================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (recording) {
    sampleAndMaybeSend();
  } else {
    if (millis() - lastPollMs > COMMAND_POLL_MS) {
      pollForCommand();
      lastPollMs = millis();
    }
    delay(50);
  }
}

// =============================================
// SAMPLING
// =============================================
void sampleAndMaybeSend() {
  unsigned long sampleIntervalUs = 1000000 / SAMPLE_RATE_HZ;
  unsigned long start = micros();

  int raw = analogRead(SENSOR_PIN);
  float normalized = (raw / 4095.0f) * 2.0f - 1.0f;
  sampleBuffer[bufferIndex++] = normalized;

  if (bufferIndex >= BATCH_SIZE) {
    sendBatch();
    bufferIndex = 0;

    // While sending, also check for stop command
    pollForCommand();
  }

  unsigned long elapsed = micros() - start;
  if (elapsed < sampleIntervalUs) {
    delayMicroseconds(sampleIntervalUs - elapsed);
  }
}

// =============================================
// HTTP: send batch of samples
// =============================================
void sendBatch() {
  HTTPClient http;
  String url = String(SUPABASE_URL) + PROCESS_ENDPOINT;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_AUTH_TOKEN);
  http.setTimeout(10000);

  StaticJsonDocument<8192> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["sampleRateHz"] = SAMPLE_RATE_HZ;
  doc["deviceTimestamp"] = millis();
  JsonArray samples = doc.createNestedArray("samples");
  for (int i = 0; i < BATCH_SIZE; i++) {
    samples.add(sampleBuffer[i]);
  }

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code >= 200 && code < 300) {
    // optional: read response for classifier output
  } else {
    Serial.printf("[send] error %d\n", code);
  }
  http.end();
}

// =============================================
// HTTP: poll for pending commands
// =============================================
void pollForCommand() {
  HTTPClient http;
  String url = String(SUPABASE_URL) + COMMAND_ENDPOINT + "?deviceId=" + DEVICE_ID;

  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + DEVICE_AUTH_TOKEN);
  http.setTimeout(5000);

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    if (!deserializeJson(doc, payload) && !doc["command"].isNull()) {
      String commandId = doc["command"]["id"].as<String>();
      String commandType = doc["command"]["command"].as<String>();
      handleCommand(commandId, commandType);
    }
  }
  http.end();
}

// =============================================
// COMMAND HANDLING
// =============================================
void handleCommand(const String& commandId, const String& command) {
  Serial.printf("[command] received: %s\n", command.c_str());

  if (command == "start") {
    recording = true;
    bufferIndex = 0;
  } else if (command == "stop") {
    recording = false;
    bufferIndex = 0;
  } else if (command == "reset") {
    recording = false;
    bufferIndex = 0;
  }

  acknowledgeCommand(commandId);
}

void acknowledgeCommand(const String& commandId) {
  HTTPClient http;
  String url = String(SUPABASE_URL) + COMMAND_ENDPOINT;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_AUTH_TOKEN);

  StaticJsonDocument<128> doc;
  doc["commandId"] = commandId;
  String body;
  serializeJson(doc, body);

  http.POST(body);
  http.end();
}
