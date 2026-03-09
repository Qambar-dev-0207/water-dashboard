# SmartTank Industrial Dashboard 🚰

A modern, minimalist skeuomorphic dashboard for water tank monitoring, featuring a Python backend designed for ESP32 integration.

## Project Structure
- **/client**: React 19 + Vite + Tailwind CSS v4 + TypeScript.
- **/backend_python**: FastAPI backend for real-time telemetry and ESP32 connectivity.
- **/server**: (Legacy) Node.js/Express backend.

## Getting Started

### 1. Prerequisites
- Node.js (for frontend)
- Python 3.10+ (for backend)

### 2. Setup

#### Backend (Python)
```bash
cd backend_python
pip install -r requirements.txt
python main.py
```
The backend will run on `http://localhost:8003`.

#### Frontend (React)
```bash
cd client
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 3. ESP32 Connection
The Python backend is ready to receive data from an ESP32.
- **Endpoint**: `POST http://[YOUR_IP]:8003/api/readings`
- **Payload**: `{"pressure": float}`

You can test the connection using the provided mock script:
```bash
python backend_python/esp32_mock.py
```

## Dashboard Features
- **Minimal Skeuomorphic UI**: Tactile neumorphic design with physical depth.
- **Real-time Telemetry**: Monitoring hydrostatic pressure and volume.
- **Interactive Trends**: Usage history visualized with Recharts.
- **ESP32 Ready**: Built-in endpoints for external hardware sensors.
