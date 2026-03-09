import serial
import requests
import re
import time
from datetime import datetime

# =========================
# CONFIG
# =========================
SERIAL_PORT = "COM3"
BAUD_RATE = 115200
API_URL = "http://127.0.0.1:8003/api/readings"
DEVICE_ID = "unit_01_A_Block"

# Regex to extract values
pattern = re.compile(r"ADS ADC:\s*(-?\d+)\s+Voltage:\s*([0-9.]+)")

def connect_serial():
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            print("Connected to Serial:", SERIAL_PORT)
            return ser
        except Exception as e:
            print("Serial connection failed. Retrying in 5 sec...")
            time.sleep(5)

def send_to_api(adc, voltage):

    # Example calibration (YOU must adjust)
    offset = 0.5      # sensor zero voltage
    scale = 50        # kPa per volt

    pressure = (voltage - offset) * scale
    if pressure < 0:
        pressure = 0

    payload = {
        "pressure": round(pressure, 2),
        "tank_id": "1"
    }

    response = requests.post(API_URL, json=payload, timeout=10)
    print("Status:", response.status_code)
    print(response.text)

    try:
        response = requests.post(API_URL, json=payload, timeout=10)
        print("API Status:", response.status_code)
        if response.status_code != 200:
            print("Response:", response.text)
    except Exception as e:
        print("API Error:", e)

def main():
    ser = connect_serial()

    while True:
        try:
            line = ser.readline().decode(errors="ignore").strip()
            if not line:
                continue

            print("Serial:", line)

            match = pattern.search(line)
            if match:
                adc = int(match.group(1))
                voltage = float(match.group(2))

                print("Parsed → ADC:", adc, "Voltage:", voltage)
                send_to_api(adc, voltage)

        except serial.SerialException:
            print("Serial disconnected. Reconnecting...")
            ser.close()
            ser = connect_serial()

        except Exception as e:
            print("Unexpected Error:", e)

if __name__ == "__main__":
    main()