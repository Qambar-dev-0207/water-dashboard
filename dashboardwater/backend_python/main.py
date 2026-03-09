from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
import uvicorn
import math
from typing import Dict, List, Optional

app = FastAPI()

# ==========================
# CORS
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# STORAGE
# ==========================
tank_configs: Dict[str, Dict[str, float]] = {
    str(i): {"tankHeight": 200.0, "tankRadius": 50.0}
    for i in range(1, 17)
}

tank_storage: Dict[str, List[dict]] = {
    str(i): []
    for i in range(1, 17)
}

# ==========================
# MODELS
# ==========================
class TankConfig(BaseModel):
    tankHeight: float = Field(gt=0)
    tankRadius: float = Field(gt=0)

class Reading(BaseModel):
    pressure: float = Field(ge=0)  # kPa
    tank_id: Optional[str] = "1"

# ==========================
# CORE CALCULATION
# ==========================
def calculate(pressure_kpa: float, tank_id: str):

    config = tank_configs.get(tank_id)
    height_limit = config["tankHeight"]
    radius = config["tankRadius"]

    # Hydrostatic conversion
    height_m = pressure_kpa / 9.81
    height_cm = height_m * 100

    actual_height = min(height_cm, height_limit)

    volume_l = (math.pi * radius**2 * actual_height) / 1000
    capacity_l = (math.pi * radius**2 * height_limit) / 1000

    percent = (volume_l / capacity_l) * 100 if capacity_l else 0

    status = "Normal"
    if percent < 10:
        status = "Critical"
    elif percent < 30:
        status = "Low"

    forecast = "Stable"
    history = tank_storage.get(tank_id, [])
    if len(history) >= 1:
        last_percent = history[-1]["fillPercent"]
        if percent > last_percent + 0.1:
            forecast = "Filling"
        elif percent < last_percent - 0.1:
            forecast = "Decreasing"

    return {
        "tank_id": tank_id,
        "pressure_kpa": round(pressure_kpa, 2),
        "height_cm": round(actual_height, 2),
        "volume_liters": round(volume_l, 2),
        "fillPercent": round(percent, 2),
        "status": status,
        "forecast": forecast,
        "timestamp": datetime.utcnow().isoformat()
    }

# ==========================
# HANDLER
# ==========================
async def handle_reading(tank_id: str, pressure: float):

    if tank_id not in tank_configs:
        tank_configs[tank_id] = {"tankHeight": 200.0, "tankRadius": 50.0}
        tank_storage[tank_id] = []

    data = calculate(pressure, tank_id)

    tank_storage[tank_id].append(data)

    if len(tank_storage[tank_id]) > 200:
        tank_storage[tank_id].pop(0)

    return data

# ==========================
# ROUTES
# ==========================
@app.post("/api/readings")
async def receive(reading: Reading):
    tank_id = reading.tank_id or "1"
    return await handle_reading(tank_id, reading.pressure)

@app.post("/api/readings/{tank_id}")
async def receive_for_tank(tank_id: str, reading: Reading):
    return await handle_reading(tank_id, reading.pressure)

@app.get("/api/status/{tank_id}")
async def get_status(tank_id: str):
    if not tank_storage.get(tank_id):
        return calculate(0, tank_id)
    return tank_storage[tank_id][-1]

@app.get("/api/history/{tank_id}")
async def get_history(tank_id: str):
    return tank_storage.get(tank_id, [])

@app.get("/api/config/{tank_id}")
async def get_config(tank_id: str):
    return tank_configs.get(tank_id, {"tankHeight": 200.0, "tankRadius": 50.0})

@app.post("/api/config/{tank_id}")
async def update_config(tank_id: str, config: TankConfig):
    tank_configs[tank_id] = config.dict()
    return {"status": "success", "config": tank_configs[tank_id]}

@app.get("/api/fleet/status")
async def fleet_status():
    result = {}
    for tid in tank_configs.keys():
        if tank_storage.get(tid):
            result[tid] = tank_storage[tid][-1]
        else:
            result[tid] = calculate(0, tid)
    return result

# ==========================
# RUN
# ==========================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)