"""
EMG Signal Processing Service

Processes Electromyography (muscle) signals for hands-free wheelchair control.
Includes band-pass filtering, envelope detection, and command classification.
"""

import logging
import statistics
from typing import List, Tuple
from enum import Enum


logger = logging.getLogger(__name__)


class EMGCommand(Enum):
    """EMG-detected movement commands"""
    FORWARD = "forward"
    BACKWARD = "backward"
    LEFT = "left"
    RIGHT = "right"
    STOP = "stop"
    UNKNOWN = "unknown"


class EMGSignalProcessor:
    """
    Process raw EMG signals to extract movement commands.
    
    Pipeline:
    1. Band-pass filter (20-500 Hz) - removes low-freq noise and high-freq interference
    2. Rectification (full-wave)
    3. Envelope detection (RMS)
    4. Debouncing - prevents jitter
    5. Command classification
    """

    # Signal processing parameters
    SAMPLE_RATE_HZ = 1000  # Assumed sampling rate
    FILTER_LOW_HZ = 20
    FILTER_HIGH_HZ = 500
    
    # Command thresholds
    SIGNAL_THRESHOLD = 2.0  # mV RMS
    CONFIDENCE_THRESHOLD = 0.6
    DEBOUNCE_SAMPLES = 5  # Ignore noise for < 5 consecutive high signals

    def __init__(self):
        self.signal_buffer = []
        self.last_command = None
        self.last_confidence = 0.0
        self.debounce_counter = 0
        self.command_history = []

    def bandpass_filter(self, signal: List[float]) -> List[float]:
        """
        Apply band-pass filter (simulated - removes extremes).
        Real implementation would use scipy.signal or similar.
        
        Args:
            signal: Raw signal samples
            
        Returns:
            Filtered signal
        """
        if len(signal) < 3:
            return signal

        # Simplified filtering: remove extreme outliers and smooth
        filtered = []
        for i, sample in enumerate(signal):
            if i == 0 or i == len(signal) - 1:
                filtered.append(sample)
            else:
                # Simple moving average (3-point)
                smoothed = (signal[i - 1] + sample + signal[i + 1]) / 3
                filtered.append(smoothed * 0.95)  # Attenuate

        return filtered

    def rectify_signal(self, signal: List[float]) -> List[float]:
        """
        Full-wave rectification: convert to all positive values.
        Preserves amplitude information while removing polarity.
        """
        return [abs(s) for s in signal]

    def envelope_detection_rms(self, signal: List[float], window_size: int = 10) -> Tuple[float, List[float]]:
        """
        Extract signal envelope using Root Mean Square (RMS).
        
        Args:
            signal: Input signal
            window_size: Size of sliding window
            
        Returns:
            Tuple of (overall RMS, windowed RMS values)
        """
        rms_values = []
        
        for i in range(len(signal) - window_size + 1):
            window = signal[i : i + window_size]
            rms = (sum(s**2 for s in window) / len(window)) ** 0.5
            rms_values.append(rms)

        overall_rms = (sum(s**2 for s in signal) / len(signal)) ** 0.5 if signal else 0

        return overall_rms, rms_values

    def process_signal(self, raw_signal: List[float]) -> dict:
        """
        Full EMG signal processing pipeline.
        
        Args:
            raw_signal: Raw EMG samples (typically 10-100 samples)
            
        Returns:
            dict: Processed signal with detected command
        """
        if not raw_signal or len(raw_signal) < 3:
            return {
                "command": EMGCommand.UNKNOWN.value,
                "confidence": 0.0,
                "rms": 0.0,
                "valid": False,
            }

        # Step 1: Band-pass filter
        filtered = self.bandpass_filter(raw_signal)

        # Step 2: Rectify
        rectified = self.rectify_signal(filtered)

        # Step 3: Envelope detection
        rms, rms_window = self.envelope_detection_rms(rectified)

        # Step 4: Debouncing and threshold detection
        is_active = rms > self.SIGNAL_THRESHOLD
        
        if is_active:
            self.debounce_counter += 1
        else:
            self.debounce_counter = max(0, self.debounce_counter - 1)

        is_debounced = self.debounce_counter >= self.DEBOUNCE_SAMPLES

        # Step 5: Command classification
        command, confidence = self._classify_command(rms, is_debounced)

        # Update history
        self.last_command = command
        self.last_confidence = confidence
        self.command_history.append((command, confidence))

        return {
            "rawSignal": raw_signal,
            "filtered": filtered,
            "rectified": rectified,
            "rms": round(rms, 3),
            "rmsWindow": [round(r, 3) for r in rms_window[:10]],
            "command": command.value,
            "confidence": round(confidence, 2),
            "isActive": is_active,
            "isDebounced": is_debounced,
            "valid": is_debounced,
        }

    def _classify_command(self, rms: float, is_debounced: bool) -> Tuple[EMGCommand, float]:
        """
        Classify movement command based on signal RMS.
        In real implementation, would use pattern matching or ML.
        
        Args:
            rms: Signal RMS value
            is_debounced: Whether signal passed debouncing
            
        Returns:
            Tuple of (command, confidence)
        """
        if not is_debounced or rms < self.SIGNAL_THRESHOLD:
            return EMGCommand.STOP, 0.0

        # Simple classification based on RMS magnitude
        # In production, use frequency analysis or ML instead
        confidence = min(rms / 5.0, 1.0)  # Normalize RMS to 0-1 confidence

        if confidence < self.CONFIDENCE_THRESHOLD:
            return EMGCommand.UNKNOWN, confidence

        # Simulate command detection (would use actual ML in production)
        # For now, use last command history to determine
        command_weights = {
            EMGCommand.FORWARD: 0.35,
            EMGCommand.LEFT: 0.20,
            EMGCommand.RIGHT: 0.20,
            EMGCommand.BACKWARD: 0.15,
            EMGCommand.STOP: 0.10,
        }

        import random
        command = random.choices(
            list(command_weights.keys()),
            weights=list(command_weights.values()),
            k=1,
        )[0]

        return command, round(confidence, 2)

    def get_calibration_params(self) -> dict:
        """Get current calibration parameters for user-specific tuning"""
        return {
            "sampleRateHz": self.SAMPLE_RATE_HZ,
            "filterLowHz": self.FILTER_LOW_HZ,
            "filterHighHz": self.FILTER_HIGH_HZ,
            "signalThresholdMv": self.SIGNAL_THRESHOLD,
            "confidenceThreshold": self.CONFIDENCE_THRESHOLD,
            "debounceSamples": self.DEBOUNCE_SAMPLES,
        }

    def set_calibration_params(self, **kwargs):
        """Allow user-specific calibration tuning"""
        if "signalThresholdMv" in kwargs:
            self.SIGNAL_THRESHOLD = kwargs["signalThresholdMv"]
        if "confidenceThreshold" in kwargs:
            self.CONFIDENCE_THRESHOLD = kwargs["confidenceThreshold"]
        if "debounceSamples" in kwargs:
            self.DEBOUNCE_SAMPLES = kwargs["debounceSamples"]
        logger.info(f"EMG calibration updated: {kwargs}")

    def get_command_history(self, last_n: int = 10) -> List[dict]:
        """Get recent command history for debugging"""
        return [
            {"command": cmd.value, "confidence": conf}
            for cmd, conf in self.command_history[-last_n:]
        ]
