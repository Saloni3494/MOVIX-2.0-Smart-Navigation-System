"""
Safety Control API Endpoints

Endpoints for monitoring user safety, managing inactivity detection,
and controlling automatic braking system.
"""

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.middleware.rate_limit import limiter
from src.services.safety_service import get_safety_system
from src.services.hardware_service import HardwareService
from src.validators.request_validator import bad_request


safety_system = get_safety_system()


@jwt_required()
@limiter.limit("60/minute")
def perform_safety_check():
    """
    Perform comprehensive safety check and return status.
    
    Returns:
        dict: Safety assessment with recommended actions
    """
    user_id = get_jwt_identity()
    safety_check = safety_system.perform_safety_check()

    return jsonify(safety_check), 200


@jwt_required()
@limiter.limit("60/minute")
def record_user_activity():
    """
    Record user activity (prevents inactivity timeout).
    
    Request body: {
        "activityType": "emg_command|voice_command|touch_input|generic"
    }
    """
    payload = request.get_json(silent=True) or {}
    activity_type = payload.get("activityType", "generic")

    safety_system.inactivity_detector.record_activity(activity_type)

    return jsonify({"message": "Activity recorded"}), 200


@jwt_required()
@limiter.limit("60/minute")
def acknowledge_safety_warning():
    """
    User acknowledges safety warning and releases brakes if engaged.
    
    Returns:
        dict: Updated brake status
    """
    user_id = get_jwt_identity()
    result = safety_system.acknowledge_warning()

    return jsonify(result), 200


@jwt_required()
@limiter.limit("10/minute")
def trigger_emergency_brake():
    """
    Manually trigger emergency braking (user request or system event).
    
    Request body: {
        "reason": "string describing why braking was triggered"
    }
    """
    payload = request.get_json(silent=True) or {}
    reason = payload.get("reason", "Manual emergency brake triggered")

    result = safety_system.auto_braking.trigger_emergency_stop(reason)

    return jsonify(result), 200


@jwt_required()
@limiter.limit("30/minute")
def get_inactivity_status():
    """
    Get current inactivity detection status.
    
    Returns:
        dict: Time since last activity, threshold, alerts sent, etc.
    """
    status = safety_system.inactivity_detector.check_inactivity()

    return jsonify(status), 200


@jwt_required()
@limiter.limit("30/minute")
def get_braking_status():
    """
    Get current auto-braking system status.
    
    Returns:
        dict: Brake intensity, emergency stop state, reason, etc.
    """
    status = safety_system.auto_braking.get_status()

    return jsonify(status), 200


@jwt_required()
@limiter.limit("10/minute")
def release_brakes():
    """
    Release brakes and prepare for movement.
    
    Returns:
        dict: Confirmation that brakes are released
    """
    result = safety_system.auto_braking.release_brakes()

    return jsonify(result), 200


@jwt_required()
@limiter.limit("60/minute")
def get_safety_configuration():
    """
    Get current safety system configuration.
    
    Returns:
        dict: Inactivity thresholds, braking parameters, etc.
    """
    config = {
        "inactivityThresholdSeconds": safety_system.inactivity_detector.inactivity_threshold_seconds,
        "autoBrakingEnabled": safety_system.auto_braking.is_enabled,
        "safetyLevel": safety_system.safety_status.value,
    }

    return jsonify(config), 200


@jwt_required()
@limiter.limit("5/minute")
def update_safety_configuration():
    """
    Update safety system configuration.
    
    Request body: {
        "inactivityThresholdSeconds": int,
        "autoBrakingEnabled": bool
    }
    """
    payload = request.get_json(silent=True) or {}

    if "inactivityThresholdSeconds" in payload:
        safety_system.inactivity_detector.inactivity_threshold_seconds = payload[
            "inactivityThresholdSeconds"
        ]

    if "autoBrakingEnabled" in payload:
        safety_system.auto_braking.set_enabled(payload["autoBrakingEnabled"])

    return jsonify({"message": "Configuration updated", "config": {
        "inactivityThresholdSeconds": safety_system.inactivity_detector.inactivity_threshold_seconds,
        "autoBrakingEnabled": safety_system.auto_braking.is_enabled,
    }}), 200
