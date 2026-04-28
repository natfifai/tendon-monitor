# Device Firmware

Reference firmware for the hardware device that captures tendon vibrations and sends them to the backend.

## What's Here

- `esp32-template.ino` — example implementation for ESP32 boards, as reference for whatever hardware you're using.

## How The Device Talks To The Backend

The device does two things:

1. **Polls for commands** by making a GET request to `/functions/v1/device-command?deviceId=YOUR_ID` every few seconds. The response contains the most recent unacknowledged command, if any. Commands are `start`, `stop`, `reset`, `calibrate`.

2. **Sends vibration samples** when recording is active. POST to `/functions/v1/process-vibration` with body:

```json
{
  "deviceId": "default",
  "samples": [0.12, 0.34, ...],
  "sampleRateHz": 2000,
  "deviceTimestamp": "2025-01-01T00:00:00Z"
}
```

Both endpoints require an `Authorization: Bearer YOUR_DEVICE_TOKEN` header.

## Sample Format

The `samples` array should contain floats in the range roughly -1.0 to 1.0 representing the sensor voltage normalized around zero. The backend runs FFT (or your classifier) on this data to extract the dominant frequency.

Batch size is flexible. 256 to 1024 samples works well. Match your sample rate to the expected frequency range. For tendon vibrations up to 1000 Hz, 2000 Hz sample rate (Nyquist) is the minimum.

## Environment Variables For Backend

The backend needs these set for device authentication to work:

- `DEVICE_AUTH_TOKEN` — any long random string, also put in device firmware
- `CLASSIFIER_URL` — URL to your external AI classifier (optional, falls back to built in FFT)
- `CLASSIFIER_API_KEY` — auth for the classifier (optional)

## Testing Without Real Hardware

You can test the flow by running a tiny Python script that POSTs fake samples to `/functions/v1/process-vibration`. The app will receive the results through realtime subscription.

```python
import requests, math, time

URL = "https://yourproject.supabase.co/functions/v1/process-vibration"
TOKEN = "your_device_auth_token"

while True:
    # Generate a 200 Hz sine wave
    samples = [math.sin(2 * math.pi * 200 * (i / 2000)) for i in range(256)]
    r = requests.post(URL,
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={
            "deviceId": "default",
            "samples": samples,
            "sampleRateHz": 2000,
        }
    )
    print(r.json())
    time.sleep(1)
```
