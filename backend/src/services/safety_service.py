"""
Safety Control Service

Implements auto-braking and inactivity detection for user safety.
Monitors user responsiveness and automatically halts wheelchair if danger detected.
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


logger = logging.getLogger(__name__)


class SafetyLevel(Enum):
    """Safety alert levels"""
    NORMAL = "normal"
    CAUTION = "caution"
    WARNING = "warning"
    CRITICAL = "critical"


class SafetyStatus(Enum):
    """Overall safety status"""
    OPERATIONAL = "operational"
    MONITORING = "monitoring"
    ALERT = "alert"
    EMERGENCY_STOP = "emergency_stop"


class InactivityDetector:
    """
    Detects user inactivity or non-responsiveness.
    
    Triggers:
    - No EMG signal for X seconds
    - No voice command/interaction for X seconds
    - Obstacle detected + user not responding
    """

    def __init__(self, inactivity_threshold_seconds: int = 15):
        self.inactivity_threshold_seconds = inactivity_threshold_seconds
        self.last_activity_time = datetime.utcnow()
        self.last_emg_command_time = None
        self.last_voice_command_time = None
        self.last_touch_input_time = None
        self.inactivity_alerts_sent = 0
        self.is_inactive = False

    def record_activity(self, activity_type: str = "generic"):
        """Record user activity of any type"""
        self.last_activity_time = datetime.utcnow()
        logger.debug(f"Activity recorded: {activity_type}")

    def record_emg_command(self, command: str):
        """Record EMG-based movement command"""
        self.last_emg_command_time = datetime.utcnow()
        self.last_activity_time = datetime.utcnow()

    def record_voice_command(self, command: str):
        """Record voice command"""
        self.last_voice_command_time = datetime.utcnow()
        self.last_activity_time = datetime.utcnow()

    def record_touch_input(self):
        """Record touch/button input"""
        self.last_touch_input_time = datetime.utcnow()
        self.last_activity_time = datetime.utcnow()

    def check_inactivity(self) -> dict:
        """
        Check if user is inactive.
        
        Returns:
            dict: Inactivity status and metrics
        """
        now = datetime.utcnow()
        time_since_activity = (now - self.last_activity_time).total_seconds()
        
        self.is_inactive = time_since_activity > self.inactivity_threshold_seconds

        # Calculate sub-metrics
        time_since_emg = (
            (now - self.last_emg_command_time).total_seconds()
            if self.last_emg_command_time
            else float("inf")
        )
        time_since_voice = (
            (now - self.last_voice_command_time).total_seconds()
            if self.last_voice_command_time
            else float("inf")
        )
        time_since_touch = (
            (now - self.last_touch_input_time).total_seconds()
            if self.last_touch_input_time
            else float("inf")
        )

        return {
            "isInactive": self.is_inactive,
            "timeSinceActivitySeconds": round(time_since_activity, 1),
            "thresholdSeconds": self.inactivity_threshold_seconds,
            "timeSinceEMGSeconds": round(time_since_emg, 1),
            "timeSinceVoiceSeconds": round(time_since_voice, 1),
            "timeSinceInputSeconds": round(time_since_touch, 1),
            "inactivityAlertsCount": self.inactivity_alerts_sent,
        }

    def increment_alert_count(self):
        """Increment alert sent counter"""
        self.inactivity_alerts_sent += 1
        logger.warning(f"Inactivity alert #{self.inactivity_alerts_sent} sent")

    def reset(self):
        """Reset inactivity detector"""
        self.last_activity_time = datetime.utcnow()
        self.inactivity_alerts_sent = 0
        self.is_inactive = False


class AutoBrakingSystem:
    """
    Automatic safety braking system.
    
    Triggers braking when:
    1. User is inactive (not responding to alerts)
    2. Critical obstacle detected + user not responding
    3. Sudden path blockage
    4. User falls/loses control
    """

    def __init__(self):
        self.is_enabled = True
        self.emergency_stop_active = False
        self.brake_intensity = 0.0  # 0.0 (no braking) to 1.0 (full stop)
        self.brake_activation_time: Optional[datetime] = None
        self.brake_reason = None
        self.brake_count = 0

    def trigger_emergency_stop(self, reason: str) -> dict:
        """
        Trigger immediate emergency braking.
        
        Args:
            reason: Reason for emergency stop
            
        Returns:
            dict: Brake status
        """
        if not self.is_enabled:
            return {"status": "disabled", "message": "Auto-braking is disabled"}

        self.emergency_stop_active = True
        self.brake_intensity = 1.0  # Full stop
        self.brake_activation_time = datetime.utcnow()
        self.brake_reason = reason
        self.brake_count += 1

        logger.critical(f"Emergency braking triggered: {reason}")

        return {
            "emergency_stop": True,
            "brakeIntensity": self.brake_intensity,
            "reason": reason,
            "activatedAt": self.brake_activation_time.isoformat(),
        }

    def trigger_safety_braking(self, reason: str, intensity: float = 0.5) -> dict:
        """
        Trigger gradual safety braking (not full emergency stop).
        
        Args:
            reason: Reason for safety braking
            intensity: Braking intensity (0.0-1.0)
            
        Returns:
            dict: Brake status
        """
        if not self.is_enabled:
            return {"status": "disabled"}

        self.brake_intensity = max(self.brake_intensity, min(intensity, 1.0))
        self.brake_reason = reason

        if self.brake_intensity >= 0.8:
            self.emergency_stop_active = True

        logger.warning(f"Safety braking triggered at {intensity*100}%: {reason}")

        return {
            "emergency_stop": self.emergency_stop_active,
            "brakeIntensity": round(self.brake_intensity, 2),
            "reason": reason,
        }

    def release_brakes(self) -> dict:
        """Release brakes and resume movement"""
        self.emergency_stop_active = False
        self.brake_intensity = 0.0
        self.brake_reason = None

        logger.info("Brakes released")

        return {
            "emergency_stop": False,
            "brakeIntensity": 0.0,
            "status": "ready_to_move",
        }

    def get_status(self) -> dict:
        """Get current braking system status"""
        time_active = None
        if self.brake_activation_time:
            time_active = (datetime.utcnow() - self.brake_activation_time).total_seconds()

        return {
            "isEnabled": self.is_enabled,
            "emergencyStopActive": self.emergency_stop_active,
            "brakeIntensity": round(self.brake_intensity, 2),
            "reason": self.brake_reason,
            "activatedAtSeconds": round(time_active, 1) if time_active else None,
            "totalBrakingEventsCount": self.brake_count,
        }

    def set_enabled(self, enabled: bool):
        """Enable/disable auto-braking"""
        self.is_enabled = enabled
        logger.info(f"Auto-braking system {'enabled' if enabled else 'disabled'}")


class SafetyControlSystem:
    """
    Integrated safety control system combining inactivity detection + auto-braking.
    """

    def __init__(self):
        self.inactivity_detector = InactivityDetector(inactivity_threshold_seconds=15)
        self.auto_braking = AutoBrakingSystem()
        self.safety_status = SafetyStatus.OPERATIONAL
        self.last_safety_check = datetime.utcnow()
        self.obstacle_detected = False
        self.obstacle_severity = None

    def update_obstacle_status(self, detected: bool, severity: Optional[str] = None):
        """Update obstacle detection status"""
        self.obstacle_detected = detected
        self.obstacle_severity = severity

    def perform_safety_check(self) -> dict:
        """
        Perform comprehensive safety check.
        
        Returns:
            dict: Safety assessment and actions taken
        """
        self.last_safety_check = datetime.utcnow()
        inactivity = self.inactivity_detector.check_inactivity()
        brake_status = self.auto_braking.get_status()

        safety_level = SafetyLevel.NORMAL
        actions_needed = []

        # Check 1: User inactivity
        if inactivity["isInactive"]:
            safety_level = SafetyLevel.CRITICAL
            actions_needed.append("user_unresponsive_brake_immediately")
            self.auto_braking.trigger_emergency_stop("User inactivity detected")
            self.inactivity_detector.increment_alert_count()

        # Check 2: Obstacle + inactivity
        elif self.obstacle_detected and inactivity["timeSinceActivitySeconds"] > 5:
            safety_level = SafetyLevel.WARNING
            actions_needed.append("obstacle_detected_user_slow_response")
            self.auto_braking.trigger_safety_braking(
                "Obstacle detected with delayed user response", intensity=0.6
            )

        # Check 3: Obstacle alone
        elif self.obstacle_detected:
            if self.obstacle_severity == "high":
                safety_level = SafetyLevel.CAUTION
                actions_needed.append("critical_obstacle_alert")
            else:
                safety_level = SafetyLevel.CAUTION
                actions_needed.append("obstacle_detected_alert")

        # Check 4: All clear
        else:
            safety_level = SafetyLevel.NORMAL
            self.safety_status = SafetyStatus.OPERATIONAL

        return {
            "safetyLevel": safety_level.value,
            "status": self.safety_status.value,
            "inactivity": inactivity,
            "braking": brake_status,
            "obstacle": {
                "detected": self.obstacle_detected,
                "severity": self.obstacle_severity,
            },
            "actionsNeeded": actions_needed,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def acknowledge_warning(self) -> dict:
        """User acknowledges safety warning"""
        self.inactivity_detector.record_activity("warning_acknowledged")
        self.auto_braking.release_brakes()
        logger.info("Safety warning acknowledged by user")

        return {
            "acknowledged": True,
            "brakesReleased": True,
            "timestamp": datetime.utcnow().isoformat(),
        }


# Global safety system instance
_safety_system = None


def get_safety_system() -> SafetyControlSystem:
    """Get or create global safety control system"""
    global _safety_system
    if _safety_system is None:
        _safety_system = SafetyControlSystem()
    return _safety_system
