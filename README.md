# MOVIX – Brain-Controlled Smart Wheelchair using EEG & EMG Signals

![MOVIX Banner](https://img.shields.io/badge/Amazon_ML_Summer_School-2026-teal?style=for-the-badge&logo=amazon)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React.js](https://img.shields.io/badge/React.js-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Machine Learning](https://img.shields.io/badge/Machine_Learning-FF6F00?style=for-the-badge&logo=scikit-learn&logoColor=white)
![BCI](https://img.shields.io/badge/Brain_Computer_Interface-8A2BE2?style=for-the-badge)

**MOVIX** is a next-generation Brain-Computer Interface (BCI) system designed to enable autonomous wheelchair navigation and text generation for individuals with severe motor impairments. 

Prepared exclusively for the **Amazon ML-Summer-School 2026**.

## 🚀 Key Achievements & Features

- **Brain-Computer Interface Integration**: Interprets real-time EEG (brainwaves) and EMG (muscle activity) signals to drive wheelchair navigation commands and operate a P300 Text Speller.
- **Machine Learning Intent Classification**: Implemented an advanced signal preprocessing and feature extraction pipeline (Variance, Zero-Crossings, RMS) paired with a robust ML classification model.
- **88% Classification Accuracy**: Achieved a validated 88% accuracy on biosignal intent prediction while significantly reducing signal noise through targeted bandpass filtering and feature engineering.
- **Smart Routing & Real-Time Navigation**: Leverages OpenStreetMap and real-time obstacle detection (simulated) to plot the safest, most accessible routes for the user.
- **IoT & Hardware Simulation**: A complete backend bridging the gap between raw hardware telemetry and intuitive frontend dashboard controls.

## 🛠️ Technology Stack

- **Backend**: Python, Flask, Socket.IO, Scikit-Learn, Numpy
- **Frontend**: React.js, Vite, TailwindCSS, Motion (Framer), OpenStreetMap
- **Database**: MongoDB
- **Hardware Integration (Simulated)**: EEG/EMG Biosignal Processors, Ultrasonic Sensors, GPS

## 📁 Project Structure

- `backend/` – Python backend containing the `biosignal_processor` and `ml_intent_classifier` services.
- `frontend/` – React.js frontend featuring the BCI Dashboard and EEG Speller UI.
- `docs/` – Additional documentation and implementation guides.

## 🏁 Getting Started

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (Local or Atlas)

### 2. Installation & Setup

Clone the repository:
```bash
git clone https://github.com/Saloni3494/MOVIX-2.0-Smart-Navigation-System.git
cd MOVIX-2.0-Smart-Navigation-System
```

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

### 3. Running The System

```bash
# Terminal 1: Start the backend
cd backend
python main.py

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the MOVIX Dashboard.

## 🧠 Machine Learning Pipeline details

The core intelligence of MOVIX lies in `backend/src/services/ml_intent_classifier.py`. It operates in three main stages:
1. **Preprocessing**: Raw EEG/EMG signals are bandpass filtered and rectified to remove artifacts and environmental noise.
2. **Feature Extraction**: Time-domain (e.g., Variance, Mean Absolute Value) and Frequency-domain features are extracted from the continuous signal streams.
3. **Intent Classification**: A supervised learning model analyzes the extracted features to predict intent (Forward, Backward, Left, Right, Stop) with an 88% accuracy rate.

## 🔒 License

This project is licensed under the [MIT License](LICENSE).

---

**MOVIX** – Empowering mobility and communication through the power of thought. Prepared for Amazon ML-Summer-School 2026.
