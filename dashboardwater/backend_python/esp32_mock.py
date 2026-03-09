import requests
import time
import random

# Use the IP address of the computer running the FastAPI server
SERVER_URL = "http://localhost:8003/api/readings"

def simulate_esp32():
    print("✨ Starting Multi-Tank Simulation (16 Nodes)...")
    # Initialize pressures for each tank in kPa (0-20 kPa range for 200cm tank)
    tank_pressures = {str(i): 5.0 + (random.random() * 10.0) for i in range(1, 17)}
    
    while True:
        for i in range(1, 17):
            tank_id = str(i)
            try:
                # Simulate small changes
                change = (random.random() - 0.45) * 1.0 # Bias slightly upwards for simulation
                tank_pressures[tank_id] += change
                
                # Range 0 to 22 kPa
                tank_pressures[tank_id] = max(0.0, min(22.0, tank_pressures[tank_id]))
                
                payload = {"pressure": round(tank_pressures[tank_id], 2)}
                url = f"http://localhost:8003/api/readings/{tank_id}"
                response = requests.post(url, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"📡 [Node {tank_id.zfill(2)}] P: {tank_pressures[tank_id]:.2f}kPa | Level: {data['fillPercent']}% | Status: {data['status']}")
                else:
                    print(f"❌ [Node {tank_id.zfill(2)}] Failed: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ [Node {tank_id.zfill(2)}] Connection Error: {e}")
            
            time.sleep(0.1)  # Faster sequence
                
        time.sleep(2)  # Wait before next cycle

if __name__ == "__main__":
    simulate_esp32()
