"""
Biosignal Processing Service

Handles real-time ingestion, preprocessing, and classification of EEG and EMG signals.
Pipelines data directly to the MLIntentClassifier.
"""

import logging
import numpy as np
from typing import List, Dict, Any
from .ml_intent_classifier import MLIntentClassifier, WheelchairCommand

logger = logging.getLogger(__name__)

class BiosignalProcessor:
    def __init__(self):
        self.classifier = MLIntentClassifier()
        self.eeg_buffer = []
        self.emg_buffer = []
        self.last_prediction = None
        self.command_history = []
        
        # Preprocessing params
        self.EMG_THRESHOLD = 1.5
        self.BUFFER_SIZE = 50

    def preprocess_signal(self, signal: List[float], signal_type: str) -> List[float]:
        """
        Apply bandpass filters and noise reduction to raw signals.
        """
        if not signal:
            return []
            
        # Simplified bandpass and smoothing
        smoothed = []
        for i in range(len(signal)):
            if i == 0 or i == len(signal) - 1:
                smoothed.append(signal[i])
            else:
                avg = (signal[i-1] + signal[i] + signal[i+1]) / 3.0
                smoothed.append(avg)
                
        # artifact removal
        if signal_type == 'eeg':
            return [min(max(s, -100.0), 100.0) for s in smoothed]
        return [abs(s) for s in smoothed]  # Rectify EMG

    def ingest_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming websocket payload containing biosignals.
        Expected payload format: { "eeg": [...], "emg": [...] }
        """
        raw_eeg = payload.get("eeg", [])
        raw_emg = payload.get("emg", [])
        
        # 1. Preprocess
        clean_eeg = self.preprocess_signal(raw_eeg, 'eeg')
        clean_emg = self.preprocess_signal(raw_emg, 'emg')
        
        # Update buffers
        self.eeg_buffer.extend(clean_eeg)
        self.emg_buffer.extend(clean_emg)
        
        # Keep buffer size manageable
        self.eeg_buffer = self.eeg_buffer[-self.BUFFER_SIZE:]
        self.emg_buffer = self.emg_buffer[-self.BUFFER_SIZE:]
        
        # 2. Classify intent
        prediction = self.classifier.predict_intent(self.eeg_buffer, self.emg_buffer)
        
        # 3. Format response
        result = {
            "valid": True,
            "command": prediction["command"],
            "confidence": prediction["confidence"],
            "eeg_status": "active" if len(clean_eeg) > 0 else "inactive",
            "emg_status": "active" if len(clean_emg) > 0 else "inactive",
            "metrics": {
                "eeg_variance": round(np.var(clean_eeg) if clean_eeg else 0, 2),
                "emg_rms": round(np.sqrt(np.mean(np.array(clean_emg)**2)) if clean_emg else 0, 2)
            }
        }
        
        self.last_prediction = result
        self.command_history.append((prediction["command"], prediction["confidence"]))
        self.command_history = self.command_history[-10:]
        
        return result
        
    def generate_text_from_eeg(self, eeg_signal: List[float]) -> str:
        """
        Experimental: P300 Speller simulation based on EEG peaks.
        Returns a selected character.
        """
        if not eeg_signal:
            return ""
            
        clean_eeg = self.preprocess_signal(eeg_signal, 'eeg')
        peak = max(clean_eeg) if clean_eeg else 0
        
        if peak > 50.0:  # Simulated P300 threshold
            # Return a generic selection token
            return "SELECT"
        return "IDLE"
