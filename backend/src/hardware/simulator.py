"""
Hardware Simulator Module

Simulates IoT hardware components (ESP32, sensors) when physical hardware is not connected.
This enables full feature demonstration and testing without actual hardware.

Simulated Components:
- Ultrasonic Distance Sensor
- EMG Sensor (Electromyography)
- GPS Module
- Camera Module (image preprocessing)
- Movement Accelerometer
"""

import logging
import random
import math
from datetime import datetime, timedelta
from enum import Enum


logger = logging.getLogger(__name__)


class SensorMode(Enum):
    """Sensor operating modes"""
    SIMULATOR = "simulator"
    HARDWARE = "hardware"
    HYBRID = "hybrid"  # Uses real hardware if available, falls back to simulator


class HardwareSimulator:
    """Central hardware simulator with realistic sensor data"""

    def __init__(self, mode: SensorMode = SensorMode.SIMULATOR):
        self.mode = mode
        self.is_hardware_connected = False
        self.base_location = [73.8567, 18.5204]  # Default: Pune coordinates
        self.current_location = self.base_location.copy()
        self.movement_history = [self.current_location.copy()]
        self.last_update = datetime.utcnow()
        
        # EMG simulation state
        self.emg_signal_buffer = []
        self.emg_command_state = None
        self.last_emg_command = None
        
        # Movement state
        self.simulated_speed = 0.0  # m/s
        self.simulated_heading = 0.0  # degrees
        self.is_moving = False
        self.idle_counter = 0
        
        logger.info(f"Hardware Simulator initialized in {mode.value} mode")

    def check_hardware_connection(self) -> dict:
        """
        Check if physical hardware is connected.
        Used to determine whether to use real sensors or simulator.
        
        Returns:
            dict: Connection status for each component
        """
        return {
            "ultrasonic": self.is_hardware_connected,
            "emg": self.is_hardware_connected,
            "gps": self.is_hardware_connected,
            "camera": self.is_hardware_connected,
            "accelerometer": self.is_hardware_connected,
            "mode": self.mode.value,
            "timestamp": datetime.utcnow().isoformat(),
        }

    # =========================
    # ULTRASONIC SENSOR
    # =========================

    def read_ultrasonic_distance(self) -> dict:
        """
        Simulate ultrasonic distance sensor readings.
        Range: 2cm - 400cm (realistic for HC-SR04)
        
        Returns:
            dict: Distance reading with reliability score
        """
        # Simulate obstacles: 30% chance of detecting something close
        if random.random() < 0.3:
            distance_cm = random.uniform(15, 50)  # Object nearby
            confidence = random.uniform(0.7, 1.0)
        else:
            distance_cm = random.uniform(150, 400)  # Clear path
            confidence = random.uniform(0.8, 1.0)

        # Add noise (realistic sensor noise)
        noise = random.gauss(0, distance_cm * 0.02)
        distance_cm = max(2, min(400, distance_cm + noise))

        return {
            "distanceCm": round(distance_cm, 2),
            "confidence": round(confidence, 2),
            "isObstacleNearby": distance_cm < 50,
            "obstacleThresholdCm": 50,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def read_ultrasonic_stream(self, duration_seconds: float = 2.0) -> list:
        """
        Stream multiple ultrasonic readings to simulate continuous monitoring.
        
        Args:
            duration_seconds: How long to stream data
            
        Returns:
            list: Series of ultrasonic readings
        """
        readings = []
        interval = 0.1  # 100ms between readings
        count = int(duration_seconds / interval)
        
        for _ in range(count):
            readings.append(self.read_ultrasonic_distance())
        
        return readings

    # =========================
    # EMG SENSOR (Electromyography)
    # =========================

    def read_emg_raw_signal(self, num_samples: int = 10) -> dict:
        """
        Simulate raw EMG signal from muscle sensors.
        EMG signals typically: 0-10 mV, processed via band-pass filter (20-500 Hz)
        
        Args:
            num_samples: Number of signal samples to generate
            
        Returns:
            dict: Raw EMG signal data with frequency info
        """
        # Simulate realistic EMG signal (mixture of noise + muscle activity)
        signal_samples = []
        
        for _ in range(num_samples):
            # Base noise (1-2 mV)
            noise = random.gauss(0, 0.5)
            
            # Muscle activity (if moving/tensing)
            if self.is_moving or self.emg_command_state:
                muscle_signal = random.uniform(2, 4)
            else:
                muscle_signal = random.uniform(0.1, 0.5)
            
            signal = noise + muscle_signal
            signal_samples.append(round(signal, 3))

        return {
            "rawSignal": signal_samples,
            "numSamples": num_samples,
            "amplitudeRange": [0, 10],  # mV
            "signalStrength": round(sum(signal_samples) / len(signal_samples), 2),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def process_emg_signal(self, raw_signal: list = None) -> dict:
        """
        Process raw EMG signal through:
        1. Band-pass filter (20-500 Hz)
        2. Envelope detection (RMS)
        3. Debouncing
        
        Args:
            raw_signal: Optional raw signal samples
            
        Returns:
            dict: Processed signal with detected command
        """
        if raw_signal is None:
            raw_data = self.read_emg_raw_signal(10)
            raw_signal = raw_data["rawSignal"]

        # Band-pass filter (simulated)
        filtered = [s * 0.95 for s in raw_signal]  # Simplified filter

        # Envelope detection (RMS - Root Mean Square)
        rms = math.sqrt(sum(s**2 for s in filtered) / len(filtered))

        # Command detection via threshold
        command = None
        confidence = 0.0
        
        if rms > 2.5:
            # High muscle activity - detect command
            dominant_freq = random.choice(["forward", "backward", "left", "right", "stop"])
            confidence = min(rms / 5.0, 1.0)  # Normalize to 0-1
            self.emg_command_state = dominant_freq
            command = dominant_freq
        else:
            self.emg_command_state = None

        return {
            "rms": round(rms, 3),
            "filtered_signal": [round(s, 3) for s in filtered],
            "command": command,
            "confidence": round(confidence, 2),
            "debounced": True,
            "timestamp": datetime.utcnow().isoformat(),
        }

    # =========================
    # GPS MODULE
    # =========================

    def simulate_movement(self, heading: float, speed_ms: float = 0.5):
        """
        Simulate movement in a direction and speed.
        
        Args:
            heading: Direction in degrees (0-360)
            speed_ms: Speed in meters per second
        """
        self.simulated_heading = heading % 360
        self.simulated_speed = speed_ms
        self.is_moving = speed_ms > 0.1

    def get_gps_location(self) -> dict:
        """
        Get simulated GPS location with realistic accuracy.
        Simulates GPS drift and accuracy variations.
        
        Returns:
            dict: GeoJSON point with accuracy
        """
        # Simulate GPS drift (±10 meters)
        drift_lng = random.gauss(0, 0.00009)
        drift_lat = random.gauss(0, 0.00009)

        # Apply movement if active
        if self.is_moving:
            time_delta = (datetime.utcnow() - self.last_update).total_seconds()
            distance_m = self.simulated_speed * time_delta

            # Convert bearing and distance to lat/lon change
            distance_km = distance_m / 1000
            lat_change = (distance_km / 111.32)
            lng_change = (distance_km / (111.32 * math.cos(math.radians(self.current_location[1]))))

            self.current_location[1] += lat_change
            self.current_location[0] += lng_change

        self.current_location[0] += drift_lng
        self.current_location[1] += drift_lat
        self.movement_history.append(self.current_location.copy())
        self.last_update = datetime.utcnow()

        # Realistic GPS accuracy: 5-15 meters in open area
        accuracy = random.uniform(5, 15)

        return {
            "type": "Point",
            "coordinates": [
                round(self.current_location[0], 6),
                round(self.current_location[1], 6),
            ],
            "accuracy_m": round(accuracy, 2),
            "heading": round(self.simulated_heading, 1),
            "speed_ms": round(self.simulated_speed, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_gps_stream(self, duration_seconds: float = 5.0) -> list:
        """Stream GPS locations over time"""
        locations = []
        interval = 1.0  # 1 second between readings
        count = int(duration_seconds / interval)
        
        for _ in range(count):
            locations.append(self.get_gps_location())
        
        return locations

    # =========================
    # CAMERA MODULE
    # =========================

    def simulate_camera_frame(self) -> dict:
        """
        Simulate camera frame capture for obstacle detection.
        Returns dummy frame data that would be sent to YOLO/ML model.
        
        Returns:
            dict: Camera frame metadata and preprocessing info
        """
        frame_id = random.randint(10000, 99999)
        
        # Simulate 30% chance of detecting obstacles in frame
        has_obstacles = random.random() < 0.3
        
        return {
            "frameId": frame_id,
            "timestamp": datetime.utcnow().isoformat(),
            "resolution": "640x480",
            "format": "JPEG",
            "frameSize_bytes": random.randint(15000, 35000),
            "hasObstacles": has_obstacles,
            "preprocessed": True,
            "preprocessingSteps": [
                "gray_scale_conversion",
                "histogram_equalization",
                "edge_detection",
            ],
        }

    # =========================
    # ACCELEROMETER / MOVEMENT
    # =========================

    def read_accelerometer(self) -> dict:
        """
        Simulate 3-axis accelerometer for movement/fall detection.
        
        Returns:
            dict: X, Y, Z acceleration values in m/s²
        """
        # Simulate gravitational acceleration (9.81 m/s²)
        gravity = 9.81
        
        # Add movement acceleration
        if self.is_moving:
            accel_x = random.gauss(self.simulated_speed * 2, 0.5)
            accel_y = random.gauss(self.simulated_speed * 2, 0.5)
        else:
            accel_x = random.gauss(0, 0.2)
            accel_y = random.gauss(0, 0.2)
        
        # Z-axis includes gravity
        accel_z = gravity + random.gauss(0, 0.3)

        # Detect if falling (sudden increase in Z acceleration)
        total_accel = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
        is_falling = total_accel > gravity + 5

        return {
            "accelerationX_ms2": round(accel_x, 2),
            "accelerationY_ms2": round(accel_y, 2),
            "accelerationZ_ms2": round(accel_z, 2),
            "totalAcceleration": round(total_accel, 2),
            "isFalling": is_falling,
            "timestamp": datetime.utcnow().isoformat(),
        }

    # =========================
    # BATTERY & SYSTEM STATUS
    # =========================

    def get_system_status(self) -> dict:
        """Get overall hardware system status"""
        return {
            "batteryLevel": round(random.uniform(20, 100), 1),
            "cpuUsage": round(random.uniform(10, 50), 1),
            "memoryUsage": round(random.uniform(30, 70), 1),
            "connectionStatus": "connected" if self.is_hardware_connected else "simulating",
            "lastSync": datetime.utcnow().isoformat(),
            "components": {
                "ultrasonic": "ok",
                "emg": "ok",
                "gps": "ok",
                "camera": "ok",
                "accelerometer": "ok",
            },
        }

    # =========================
    # INACTIVITY DETECTION
    # =========================

    def update_activity(self, is_active: bool):
        """Track user activity for inactivity detection"""
        if is_active:
            self.idle_counter = 0
            self.is_moving = True
        else:
            self.idle_counter += 1

    def get_inactivity_status(self) -> dict:
        """
        Detect if user is inactive (not reacting to route/obstacles).
        
        Returns:
            dict: Inactivity metrics
        """
        # Consider inactive if idle_counter > 10 (each increment = check cycle)
        is_inactive = self.idle_counter > 10
        inactivity_duration_s = self.idle_counter * 2  # ~2 seconds per check

        return {
            "isInactive": is_inactive,
            "inactivityDurationSeconds": inactivity_duration_s,
            "requiresAutoStop": is_inactive,
            "idleCounter": self.idle_counter,
        }


# Global simulator instance
_simulator = None


def get_simulator(mode: SensorMode = SensorMode.SIMULATOR) -> HardwareSimulator:
    """Get or create global hardware simulator instance"""
    global _simulator
    if _simulator is None:
        _simulator = HardwareSimulator(mode)
    return _simulator


def reset_simulator():
    """Reset the hardware simulator"""
    global _simulator
    _simulator = None
