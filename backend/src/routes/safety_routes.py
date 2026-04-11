"""
Safety Control Routes

Blueprint for safety monitoring and auto-braking endpoints.
"""

from flask import Blueprint

from src.controllers.safety_controller import (
    perform_safety_check,
    record_user_activity,
    acknowledge_safety_warning,
    trigger_emergency_brake,
    get_inactivity_status,
    get_braking_status,
    release_brakes,
    get_safety_configuration,
    update_safety_configuration,
)


safety_bp = Blueprint("safety", __name__, url_prefix="/api/safety")

# Safety monitoring
safety_bp.route("/check", methods=["POST"])(perform_safety_check)
safety_bp.route("/activity", methods=["POST"])(record_user_activity)
safety_bp.route("/acknowledge", methods=["POST"])(acknowledge_safety_warning)

# Emergency braking
safety_bp.route("/brake/emergency", methods=["POST"])(trigger_emergency_brake)
safety_bp.route("/brake/release", methods=["POST"])(release_brakes)
safety_bp.route("/brake/status", methods=["GET"])(get_braking_status)

# Inactivity monitoring
safety_bp.route("/inactivity/status", methods=["GET"])(get_inactivity_status)

# Configuration
safety_bp.route("/config", methods=["GET"])(get_safety_configuration)
safety_bp.route("/config", methods=["PUT"])(update_safety_configuration)
