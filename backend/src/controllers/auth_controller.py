from flask import jsonify, request

from src.services.auth_service import AuthService
from src.validators.request_validator import VALID_ROLES, bad_request, require_fields, validate_geopoint


def register():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["name", "email", "password", "role"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    if payload["role"] not in VALID_ROLES:
        return bad_request("Invalid role", {"allowed": list(VALID_ROLES)})

    current_location = payload.get("currentLocation")
    if current_location and not validate_geopoint(current_location):
        return bad_request("Invalid currentLocation. Expected GeoJSON Point")

    user = AuthService.register_user(
        name=payload["name"],
        email=payload["email"],
        password=payload["password"],
        role=payload["role"],
        emergency_contacts=payload.get("emergencyContacts", []),
        current_location=current_location,
    )

    return jsonify({"message": "User registered", "user": user}), 201


def login():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["email", "password"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    result = AuthService.login_user(payload["email"], payload["password"])
    return jsonify(result), 200
