from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.services.emergency_service import EmergencyService
from src.validators.request_validator import bad_request, require_fields, validate_geopoint


@jwt_required()
def trigger_emergency():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["location", "message"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    if not validate_geopoint(payload["location"]):
        return bad_request("Invalid location. Expected GeoJSON Point")

    user_id = get_jwt_identity()
    event = EmergencyService.trigger_emergency(user_id, payload["location"], payload["message"])
    return jsonify({"message": "Emergency triggered", "event": event}), 201
