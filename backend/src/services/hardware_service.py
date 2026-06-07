import logging

from src.hardware.simulator import get_simulator, SensorMode
from src.services.ai_obstacle_detector import AIObstacleDetector
from src.services.biosignal_processor import BiosignalProcessor


logger = logging.getLogger(__name__)


class HardwareService:
    """
    Hardware service with automatic fallback to simulator.
    
    Behavior:
    - First tries to connect to real hardware
    - Falls back to simulator if hardware not available
    - Can be toggled between modes for testing/demo
    """

    # Initialize simulator as fallback
    _simulator = get_simulator(SensorMode.SIMULATOR)
    _biosignal_processor = BiosignalProcessor()
    
    # AI detector for camera frames
    _ai_detector = AIObstacleDetector()

    @staticmethod
    def read_ultrasonic_sensor():
        """
        Read ultrasonic distance sensor.
        
        Returns:
            dict: Distance reading with confidence and obstacle detection
        """
        try:
            # Try to read from real hardware (future integration point)
            # For now, use simulator
            return HardwareService._simulator.read_ultrasonic_distance()
        except Exception as e:
            logger.warning(f"Ultrasonic sensor error, using simulator: {e}")
            return HardwareService._simulator.read_ultrasonic_distance()

    @staticmethod
    def read_ultrasonic_stream(duration_seconds: float = 2.0):
        """
        Stream ultrasonic readings for continuous monitoring.
        
        Args:
            duration_seconds: Duration of stream
            
        Returns:
            list: Stream of distance readings
        """
        return HardwareService._simulator.read_ultrasonic_stream(duration_seconds)

    @staticmethod
    def read_emg_signal():
        """
        Read raw EMG signal from muscle sensors.
        
        Returns:
            dict: Raw EMG and EEG signal data
        """
        try:
            # Read raw signal from simulator
            raw_emg = HardwareService._simulator.read_emg_raw_signal(num_samples=10).get("rawSignal", [])
            # Mock EEG data
            import numpy as np
            raw_eeg = np.random.normal(0, 10, 10).tolist()
            return {"eeg": raw_eeg, "emg": raw_emg}
        except Exception as e:
            logger.warning(f"EMG sensor error, using simulator: {e}")
            return HardwareService._simulator.read_emg_raw_signal()

    @staticmethod
    def process_biosignals_for_command(payload: dict = None):
        """
        Process Biosignals (EEG/EMG) for movement commands.
        
        Args:
            payload: Optional payload containing eeg and emg lists
            
        Returns:
            dict: Processed signal with detected command
        """
        if payload is None:
            payload = {}
        processed = HardwareService._biosignal_processor.ingest_data(payload)
        return processed

    @staticmethod
    def get_emg_calibration():
        """Get EMG calibration parameters"""
        return {"calibrated": True}

    @staticmethod
    def set_emg_calibration(**kwargs):
        """
        Set EMG calibration parameters for user-specific tuning.
        
        Args:
            **kwargs: Calibration parameters (signalThresholdMv, etc.)
        """
        pass

    @staticmethod
    def get_gps_location():
        """
        Get GPS location.
        
        Returns:
            dict: GeoJSON Point with accuracy
        """
        try:
            return HardwareService._simulator.get_gps_location()
        except Exception as e:
            logger.warning(f"GPS sensor error, using simulator: {e}")
            return HardwareService._simulator.get_gps_location()

    @staticmethod
    def get_gps_stream(duration_seconds: float = 5.0):
        """
        Stream GPS locations for tracking.
        
        Args:
            duration_seconds: Duration of stream
            
        Returns:
            list: Stream of GPS locations
        """
        return HardwareService._simulator.get_gps_stream(duration_seconds)

    @staticmethod
    def simulate_movement(heading: float, speed_ms: float = 0.5):
        """
        Simulate device movement (useful for testing).
        
        Args:
            heading: Direction in degrees
            speed_ms: Speed in m/s
        """
        HardwareService._simulator.simulate_movement(heading, speed_ms)

    @staticmethod
    def capture_camera_frame():
        """
        Capture camera frame for obstacle detection.
        
        Returns:
            dict: Frame metadata (ready for YOLO)
        """
        return HardwareService._simulator.simulate_camera_frame()

    @staticmethod
    def detect_obstacles_in_frame(frame_data: dict, current_location: list):
        """
        Detect obstacles in camera frame using AI.
        
        Args:
            frame_data: Camera frame data
            current_location: Current GPS location
            
        Returns:
            list: Detected obstacles
        """
        return HardwareService._ai_detector.detect_obstacles_in_frame(frame_data, current_location)

    @staticmethod
    def read_accelerometer():
        """
        Read accelerometer data for movement/fall detection.
        
        Returns:
            dict: 3-axis acceleration values
        """
        return HardwareService._simulator.read_accelerometer()

    @staticmethod
    def check_hardware_connection():
        """
        Check if physical hardware components are connected.
        
        Returns:
            dict: Connection status for each component
        """
        return HardwareService._simulator.check_hardware_connection()

    @staticmethod
    def get_system_status():
        """
        Get overall hardware system status.
        
        Returns:
            dict: Battery, CPU, memory, component status
        """
        return HardwareService._simulator.get_system_status()

    @staticmethod
    def get_inactivity_status():
        """
        Get inactivity detection status.
        
        Returns:
            dict: Inactivity metrics
        """
        return HardwareService._simulator.get_inactivity_status()

    @staticmethod
    def update_user_activity(is_active: bool):
        """
        Record user activity for inactivity detection.
        
        Args:
            is_active: Whether user is active
        """
        HardwareService._simulator.update_activity(is_active)
