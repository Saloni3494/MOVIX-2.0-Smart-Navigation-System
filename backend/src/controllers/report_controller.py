from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.services.obstacle_service import ObstacleService
from src.services.report_service import ReportService
from src.validators.request_validator import VALID_SEVERITY, bad_request, require_fields, validate_geopoint


@jwt_required()
def create_report():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["obstacleType", "location", "severity"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    if payload["severity"] not in VALID_SEVERITY:
        return bad_request("Invalid severity", {"allowed": list(VALID_SEVERITY)})

    if not validate_geopoint(payload["location"]):
        return bad_request("Invalid location. Expected GeoJSON Point")

    user_id = get_jwt_identity()
    report = ReportService.create_report(user_id, payload)

    # Convert crowdsourced reports into active obstacles for real-time routing immediately.
    ObstacleService.create_obstacle(
        {
            "type": payload["obstacleType"],
            "location": payload["location"],
            "severity": payload["severity"],
            "source": "user",
            "description": payload.get("notes"),
            "imageUrl": payload.get("imageUrl"),
        },
        user_id=user_id,
    )

    return jsonify({"message": "Report submitted", "report": report}), 201
