"""
Voice Recognition & Audio Feedback Service

Provides offline voice command recognition and audio response generation.
Uses simple keyword matching for demonstration; production would use ML models.

Voice Commands:
- "help", "next", "back", "replay", "repeat", "alert", "stop", "forward", "stop", "emergency"
"""

import logging
from typing import List, Tuple
from enum import Enum
from datetime import datetime


logger = logging.getLogger(__name__)


class VoiceCommand(Enum):
    """Recognized voice commands"""
    HELP = "help"
    NEXT = "next"
    BACK = "back"
    REPEAT = "repeat"
    REPLAY = "replay"
    START = "start"
    STOP = "stop"
    EMERGENCY = "emergency"
    FORWARD = "forward"
    BACKWARD = "backward"
    LEFT = "left"
    RIGHT = "right"
    DESTINATION = "destination"
    UNKNOWN = "unknown"


class AudioFeedbackType(Enum):
    """Types of audio feedback"""
    INSTRUCTION = "instruction"
    ALERT = "alert"
    CONFIRMATION = "confirmation"
    WARNING = "warning"
    EMERGENCY = "emergency"


class VoiceRecognitionEngine:
    """
    Simple offline voice command recognition.
    
    In production, integrate:
    - Android: Google Speech Recognition API
    - iOS: SiriKit
    - Server: Vosk or similar offline recognizer
    """

    # Command keywords and aliases
    COMMAND_MAPPINGS = {
        VoiceCommand.HELP: ["help", "assist", "support", "aid"],
        VoiceCommand.NEXT: ["next", "continue", "go ahead", "proceed"],
        VoiceCommand.BACK: ["back", "backward", "go back", "reverse"],
        VoiceCommand.REPEAT: ["repeat", "again", "say again", "what"],
        VoiceCommand.REPLAY: ["replay", "listen again", "read again"],
        VoiceCommand.START: ["start", "begin", "go", "let's go"],
        VoiceCommand.STOP: ["stop", "pause", "halt", "freeze"],
        VoiceCommand.EMERGENCY: ["emergency", "sos", "help me", "accident"],
        VoiceCommand.FORWARD: ["forward", "ahead", "move forward"],
        VoiceCommand.LEFT: ["left", "turn left"],
        VoiceCommand.RIGHT: ["right", "turn right"],
    }

    # Confidence thresholds
    EXACT_MATCH_CONFIDENCE = 1.0
    PARTIAL_MATCH_CONFIDENCE = 0.8
    FUZZY_MATCH_CONFIDENCE = 0.6

    def __init__(self):
        self.last_command = None
        self.command_history = []
        self.is_listening = False

    def recognize_command(self, audio_text: str) -> dict:
        """
        Recognize voice command from audio transcript.
        
        Args:
            audio_text: Transcribed text from voice input
            
        Returns:
            dict: Recognized command with confidence
        """
        if not audio_text or len(audio_text.strip()) == 0:
            return {
                "command": VoiceCommand.UNKNOWN.value,
                "confidence": 0.0,
                "transcript": audio_text,
                "matched": False,
            }

        text_lower = audio_text.lower().strip()
        best_match = None
        best_confidence = 0.0

        # Try exact matches first
        for command, keywords in self.COMMAND_MAPPINGS.items():
            for keyword in keywords:
                if text_lower == keyword:
                    best_match = command
                    best_confidence = self.EXACT_MATCH_CONFIDENCE
                    break

        # Try partial matches if no exact
        if best_confidence < self.EXACT_MATCH_CONFIDENCE:
            for command, keywords in self.COMMAND_MAPPINGS.items():
                for keyword in keywords:
                    if keyword in text_lower:
                        confidence = self.PARTIAL_MATCH_CONFIDENCE
                        if confidence > best_confidence:
                            best_match = command
                            best_confidence = confidence

        # Try fuzzy matching (edit distance)
        if best_confidence < self.PARTIAL_MATCH_CONFIDENCE:
            best_match, best_confidence = self._fuzzy_match(text_lower)

        if best_match is None:
            best_match = VoiceCommand.UNKNOWN
            best_confidence = 0.0

        # Log command
        self.last_command = best_match
        self.command_history.append(
            {"command": best_match.value, "confidence": best_confidence, "timestamp": datetime.utcnow()}
        )

        return {
            "command": best_match.value,
            "confidence": round(best_confidence, 2),
            "transcript": audio_text,
            "matched": best_confidence > 0.5,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _fuzzy_match(self, text: str) -> Tuple[VoiceCommand, float]:
        """
        Simple fuzzy matching using edit distance.
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (best_command, confidence)
        """
        best_match = None
        best_score = 0.0

        for command, keywords in self.COMMAND_MAPPINGS.items():
            for keyword in keywords:
                # Calculate similarity (simple: character overlap)
                overlap = sum(1 for c in text if c in keyword)
                similarity = overlap / max(len(text), len(keyword))

                if similarity > best_score and similarity > 0.6:
                    best_match = command
                    best_score = similarity

        confidence = self._similarity_to_confidence(best_score)
        return best_match or VoiceCommand.UNKNOWN, confidence

    @staticmethod
    def _similarity_to_confidence(similarity: float) -> float:
        """Convert similarity score to confidence (0-1)"""
        if similarity >= 0.8:
            return 0.85
        elif similarity >= 0.6:
            return 0.65
        else:
            return 0.0

    def set_listening(self, is_listening: bool):
        """Set listening state"""
        self.is_listening = is_listening

    def get_command_history(self, last_n: int = 10) -> List[dict]:
        """Get recent command history"""
        return [
            {
                "command": cmd["command"],
                "confidence": cmd["confidence"],
                "timestamp": cmd["timestamp"].isoformat(),
            }
            for cmd in self.command_history[-last_n:]
        ]


class AudioFeedbackGenerator:
    """
    Generate audio feedback responses.
    
    In production, integrate text-to-speech:
    - Android: TextToSpeech API
    - iOS: AVSpeechSynthesizer
    - Server: gTTS, pyttsx3, etc.
    """

    # Response templates
    RESPONSES = {
        AudioFeedbackType.INSTRUCTION: {
            "route_updated": "Route has been updated. Proceeding on safer path.",
            "turn_left": "Turn left ahead.",
            "turn_right": "Turn right ahead.",
            "straight": "Continue straight.",
            "arriving": "You are arriving at your destination.",
        },
        AudioFeedbackType.ALERT: {
            "obstacle_nearby": "Obstacle detected nearby. Proceeding with caution.",
            "unsafe_path": "This path is unsafe. Rerouting to a safer alternative.",
            "user_not_reacting": "Warning: Please acknowledge. Are you responding?",
        },
        AudioFeedbackType.CONFIRMATION: {
            "route_confirmed": "Route confirmed. Starting navigation.",
            "location_updated": "Location updated successfully.",
            "report_submitted": "Obstacle report submitted. Thank you.",
        },
        AudioFeedbackType.WARNING: {
            "low_battery": "Low battery warning.",
            "connection_lost": "Connection lost. Using offline data.",
            "inactivity_warning": "No movement detected. Please respond.",
        },
        AudioFeedbackType.EMERGENCY: {
            "emergency_triggered": "Emergency alert sent to caregivers.",
            "emergency_response": "Emergency response initiated.",
        },
    }

    def __init__(self):
        self.feedback_history = []
        self.audio_enabled = True

    def generate_feedback(self, feedback_type: AudioFeedbackType, message_key: str) -> dict:
        """
        Generate audio feedback message.
        
        Args:
            feedback_type: Type of feedback
            message_key: Key for the message template
            
        Returns:
            dict: Audio feedback data (text + metadata for TTS)
        """
        text = self.RESPONSES.get(feedback_type, {}).get(
            message_key, f"{feedback_type.value}: {message_key}"
        )

        audio_data = {
            "type": feedback_type.value,
            "text": text,
            "messageKey": message_key,
            "duration_estimated_ms": len(text.split()) * 500,  # Rough estimate
            "pitch": self._get_pitch(feedback_type),
            "speed": self._get_speed(feedback_type),
            "timestamp": datetime.utcnow().isoformat(),
        }

        if self.audio_enabled:
            self.feedback_history.append(audio_data)

        return audio_data

    @staticmethod
    def _get_pitch(feedback_type: AudioFeedbackType) -> float:
        """Get TTS pitch (1.0 = normal)"""
        pitch_map = {
            AudioFeedbackType.INSTRUCTION: 1.0,
            AudioFeedbackType.ALERT: 1.2,
            AudioFeedbackType.CONFIRMATION: 1.0,
            AudioFeedbackType.WARNING: 1.3,
            AudioFeedbackType.EMERGENCY: 1.5,
        }
        return pitch_map.get(feedback_type, 1.0)

    @staticmethod
    def _get_speed(feedback_type: AudioFeedbackType) -> float:
        """Get TTS speed (1.0 = normal)"""
        speed_map = {
            AudioFeedbackType.INSTRUCTION: 1.0,
            AudioFeedbackType.ALERT: 0.9,
            AudioFeedbackType.CONFIRMATION: 1.0,
            AudioFeedbackType.WARNING: 0.85,
            AudioFeedbackType.EMERGENCY: 0.8,
        }
        return speed_map.get(feedback_type, 1.0)

    def set_audio_enabled(self, enabled: bool):
        """Enable/disable audio output"""
        self.audio_enabled = enabled

    def get_feedback_history(self, last_n: int = 10) -> List[dict]:
        """Get recent feedback history"""
        return self.feedback_history[-last_n:]

    def text_to_speech_estimate(self, text: str) -> dict:
        """
        Estimate TTS metadata for frontend to prepare UI.
        
        Args:
            text: Text to synthesize
            
        Returns:
            Metadata for TTS rendering
        """
        words = len(text.split())
        return {
            "text": text,
            "estimatedDurationMs": words * 500,
            "wordCount": words,
            "requiresUserAttention": any(
                keyword in text.lower()
                for keyword in ["warning", "obstacle", "emergency", "caution"]
            ),
        }
