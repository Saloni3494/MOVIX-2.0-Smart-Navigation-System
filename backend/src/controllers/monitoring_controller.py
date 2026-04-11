from flask import jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from src.services.alert_service import AlertService
from src.services.monitoring_service import MonitoringService
from src.services.rerouting_service import ReroutingService
from src.validators.request_validator import bad_request, require_fields, validate_geopoint


@jwt_required()
def update_location():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["location"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    if not validate_geopoint(payload["location"]):
        return bad_request("Invalid location. Expected GeoJSON Point")

    user_id = get_jwt_identity()
    MonitoringService.update_user_location(user_id, payload["location"])
    return jsonify({"message": "Location updated"}), 200


@jwt_required()
def get_user_location(user_id):
    claims = get_jwt()
    if claims.get("role") not in ["caregiver", "admin"]:
        return jsonify({"error": "Forbidden"}), 403

    result = MonitoringService.get_user_location(user_id)
    if not result:
        return jsonify({"error": "User not found"}), 404

    return jsonify(result), 200


@jwt_required()
def track_and_reroute():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["userLocation", "destination", "currentRoute"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    user_location = payload["userLocation"]
    destination = payload["destination"]
    current_route = payload["currentRoute"]

    if not isinstance(user_location, list) or len(user_location) != 2:
        return bad_request("userLocation must be [lng, lat]")
    if not isinstance(destination, list) or len(destination) != 2:
        return bad_request("destination must be [lng, lat]")
    if not isinstance(current_route, list) or (current_route and len(current_route[0]) != 2):
        return bad_request("currentRoute must be [[lng, lat], ...]")

    user_id = get_jwt_identity()
    result = ReroutingService.check_and_reroute(user_location, destination, current_route, user_id=user_id)

    if result["obstacle"]:
        AlertService.send_obstacle_alert(user_id, result["obstacle"])

    if result["rerouted"] and result["newRoute"]:
        AlertService.send_route_update(user_id, result["newRoute"])

    return jsonify(result), 200
