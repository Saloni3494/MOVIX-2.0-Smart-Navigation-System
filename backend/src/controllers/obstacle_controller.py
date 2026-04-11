from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.middleware.auth_middleware import roles_required
from src.services.obstacle_service import ObstacleService
from src.validators.request_validator import VALID_SEVERITY, bad_request, require_fields, validate_geopoint


@jwt_required()
def create_obstacle():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["type", "location", "severity", "source"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    if not validate_geopoint(payload["location"]):
        return bad_request("Invalid location. Expected GeoJSON Point")

    if payload["severity"] not in VALID_SEVERITY:
        return bad_request("Invalid severity", {"allowed": list(VALID_SEVERITY)})

    user_id = get_jwt_identity()
    obstacle = ObstacleService.create_obstacle(payload, user_id=user_id)
    return jsonify({"message": "Obstacle created", "obstacle": obstacle}), 201


@jwt_required()
def get_nearby_obstacles():
    lng = request.args.get("lng", type=float)
    lat = request.args.get("lat", type=float)
    radius = request.args.get("radius", default=100, type=int)

    if lng is None or lat is None:
        return bad_request("lng and lat query params are required")

    obstacles = ObstacleService.get_nearby_obstacles(lng, lat, radius)
    return jsonify({"count": len(obstacles), "obstacles": obstacles}), 200


@roles_required("admin")
def delete_obstacle(obstacle_id):
    deleted = ObstacleService.delete_obstacle(obstacle_id)
    if not deleted:
        return jsonify({"error": "Obstacle not found"}), 404

    return jsonify({"message": "Obstacle deleted"}), 200
