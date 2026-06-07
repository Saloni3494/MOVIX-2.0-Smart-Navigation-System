"""
Hardware Configuration & Simulation Setup Guide

This file demonstrates how to configure and use the hardware simulator
for demonstration and testing purposes.
"""

# ============================================================================
# HARDWARE SIMULATOR MODES
# ============================================================================
#
# The hardware simulator supports three modes:
#
# 1. SIMULATOR - Uses pure simulation (for demo/testing without hardware)
# 2. HARDWARE - Uses only real hardware (will fail if not connected)
# 3. HYBRID - Tries real hardware first, falls back to simulator (recommended)
#

# ============================================================================
# QUICK START - SIMULATOR MODE
# ============================================================================
#
# To use simulator for demonstration:
#
# from src.hardware.simulator import get_simulator, SensorMode
#
# simulator = get_simulator(SensorMode.SIMULATOR)
# location = simulator.get_gps_location()
# print(location)  # Returns realistic GPS data with drift
#
# ultrasonic = simulator.read_ultrasonic_distance()
# print(ultrasonic)  # Distance reading with obstacle detection
#

# ============================================================================
# HARDWARE SERVICE USAGE (AUTOMATIC FALLBACK)
# ============================================================================
#
# The HardwareService automatically uses simulator as fallback:
#
# from src.services.hardware_service import HardwareService
#
# # These automatically work with simulator if hardware not available
# location = HardwareService.get_gps_location()
# distance = HardwareService.read_ultrasonic_sensor()
# status = HardwareService.check_hardware_connection()
#

# ============================================================================
# FEATURE-SPECIFIC CONFIGURATION
# ============================================================================

# --- AI OBSTACLE DETECTION ---
AI_CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence for detections
AI_MODELS = ["YOLO_v5", "MobileNet"]  # Available models
AI_DETECTION_CLASSES = [
    "stairs", "steep_slope", "pothole", "narrow_path", "ramp_missing",
    "blocked_road", "construction", "spill", "debris", "vehicle"
]

# --- BIOSIGNAL (BCI) PROCESSING ---
# Supported Hardware: OpenBCI Cyton, NeuroSky MindWave, custom ESP32 + AD8232
EEG_SAMPLE_RATE_HZ = 250
EMG_SAMPLE_RATE_HZ = 1000
SIGNAL_FILTER_LOW_HZ = 0.5  # Delta waves start
SIGNAL_FILTER_HIGH_HZ = 50.0 # Remove mains noise
BCI_SIGNAL_THRESHOLD_MV = 1.5  # Activation threshold for intent
BCI_DEBOUNCE_SAMPLES = 5  # Noise immunity for classification
INTENT_CLASSIFICATION_WEIGHTS = {
    "forward": 0.35,
    "left": 0.20,
    "right": 0.20,
    "backward": 0.15,
    "stop": 0.10,
}

# --- VOICE RECOGNITION ---
VOICE_COMMANDS = [
    "help", "next", "back", "repeat", "replay", "start", "stop",
    "emergency", "forward", "backward", "left", "right"
]
VOICE_CONFIDENCE_THRESHOLD = 0.6

# --- SAFETY SYSTEM ---
INACTIVITY_THRESHOLD_SECONDS = 15  # Time before auto-stop
AUTO_BRAKING_ENABLED = True
OBSTACLE_ALERT_RADIUS_M = 50
CRITICAL_OBSTACLE_THRESHOLD = "high"

# --- GPS SIMULATOR ---
DEFAULT_LOCATION = [73.8567, 18.5204]  # Pune coordinates
GPS_DRIFT_SIGMA = 0.00009  # Standard deviation for drift
GPS_ACCURACY_M_RANGE = (5, 15)  # Realistic accuracy range

# --- ULTRASONIC SENSOR ---
ULTRASONIC_MIN_CM = 2
ULTRASONIC_MAX_CM = 400
OBSTACLE_THRESHOLD_CM = 50
OBSTACLE_DETECTION_PROBABILITY = 0.3

# --- ACCELEROMETER ---
GRAVITY_MS2 = 9.81
FALL_DETECTION_THRESHOLD_MS2 = 14.81  # gravity + 5
MOVEMENT_NOISE_SIGMA = 0.2

# ============================================================================
# DEMO SCENARIOS
# ============================================================================

DEMO_SCENARIOS = {
    "normal_navigation": {
        "description": "User navigating normally",
        "emg_active": True,
        "obstacle_probability": 0.2,
        "movement_speed": 0.5,  # m/s
    },
    "obstacle_ahead": {
        "description": "Obstacle detected, system reroutes",
        "emg_active": True,
        "obstacle_probability": 0.9,
        "hazard_type": "pothole",
        "movement_speed": 0.5,
    },
    "user_inactive": {
        "description": "User not responding, auto-brake triggered",
        "emg_active": False,
        "voice_active": False,
        "inactivity_seconds": 20,
        "expected_action": "emergency_stop",
    },
    "emergency_response": {
        "description": "User triggers emergency, location sent to caregivers",
        "emergency_triggered": True,
        "expected_action": "send_location_alert",
    },
    "voice_command": {
        "description": "User issues voice command",
        "voice_input": "help",
        "expected_response": "audio_feedback",
    },
    "emg_control": {
        "description": "User controls wheelchair via BCI (EEG/EMG) signals",
        "emg_command": "forward",
        "expected_action": "movement_command",
    },
    "p300_speller": {
        "description": "User generates text via EEG P300 Speller",
        "expected_action": "text_generation",
    }
}

# ============================================================================
# TESTING THE SYSTEM
# ============================================================================

# Example test script:
"""
from src.hardware.simulator import get_simulator, SensorMode
from src.services.ai_obstacle_detector import AIObstacleDetector
from src.services.emg_processor import EMGSignalProcessor
from src.services.voice_service import VoiceRecognitionEngine
from src.services.safety_service import get_safety_system

# Initialize components
simulator = get_simulator(SensorMode.SIMULATOR)
ai_detector = AIObstacleDetector()
emg_processor = EMGSignalProcessor()
voice_engine = VoiceRecognitionEngine()
safety_system = get_safety_system()

# Test GPS
location = simulator.get_gps_location()
print(f"Location: {location}")

# Test ultrasonic
distance = simulator.read_ultrasonic_distance()
print(f"Distance: {distance}")

# Test EMG
emg_raw = simulator.read_emg_raw_signal()
emg_processed = emg_processor.process_signal(emg_raw['rawSignal'])
print(f"EMG Command: {emg_processed['command']}")

# Test AI obstacle detection
frame = simulator.simulate_camera_frame()
obstacles = ai_detector.detect_obstacles_in_frame(frame, location['coordinates'])
print(f"Detected obstacles: {len(obstacles)}")

# Test voice recognition
result = voice_engine.recognize_command("help me")
print(f"Voice command: {result['command']}")

# Test safety check
safety_check = safety_system.perform_safety_check()
print(f"Safety status: {safety_check['safetyLevel']}")
"""

# ============================================================================
# API ENDPOINTS FOR DEMO
# ============================================================================

API_ENDPOINTS = {
    "AI Obstacle Detection": {
        "POST /api/ai/detection/obstacles": "Detect obstacles in view",
        "GET /api/ai/detection/metrics": "Get detection metrics",
    },
    "Voice & Audio": {
        "POST /api/voice/recognize": "Recognize voice command",
        "POST /api/voice/interaction": "Full voice interaction",
        "POST /api/voice/feedback/generate": "Generate audio feedback",
    },
    "Safety System": {
        "POST /api/safety/check": "Perform safety check",
        "POST /api/safety/activity": "Record user activity",
        "POST /api/safety/brake/emergency": "Trigger emergency brake",
        "GET /api/safety/inactivity/status": "Get inactivity status",
    },
    "Hardware Simulation": {
        "GET /api/hardware/snapshot": "Get hardware sensor snapshot",
        "POST /api/hardware/sensory/emg": "Get EMG signal processing",
        "POST /api/hardware/camera/capture": "Capture camera frame",
    },
    "Admin Dashboard": {
        "GET /api/admin/insights/accessibility": "Accessibility insights",
        "GET /api/admin/heatmap": "Heatmap data",
        "GET /api/admin/insights/system": "System analytics",
    },
}

# ============================================================================
# ENVIRONMENT VARIABLES FOR SIMULATION
# ============================================================================

RECOMMENDED_ENV_VARS = {
    "HARDWARE_MODE": "simulator",  # or "hardware" or "hybrid"
    "SIMULATOR_GPS_DRIFT": "0.00009",
    "EMG_THRESHOLD": "2.0",
    "INACTIVITY_TIMEOUT": "15",
    "AUTO_BRAKE_ENABLED": "true",
    "DEBUG_HARDWARESIM": "false",  # Set to true for verbose logging
}
