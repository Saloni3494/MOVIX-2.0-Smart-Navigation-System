from flask import jsonify


VALID_ROLES = {"wheelchair_user", "caregiver", "admin"}
VALID_SEVERITY = {"low", "medium", "high"}


def validate_geopoint(point):
    if not isinstance(point, dict):
        return False

    point_type = point.get("type")
    coordinates = point.get("coordinates")

    if point_type != "Point" or not isinstance(coordinates, list) or len(coordinates) != 2:
        return False

    lng, lat = coordinates
    if not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
        return False

    return -180 <= lng <= 180 and -90 <= lat <= 90


def require_fields(payload, fields):
    missing = [field for field in fields if payload.get(field) is None]
    return missing


def bad_request(message, details=None):
    return jsonify({"error": message, "details": details or {}}), 400
