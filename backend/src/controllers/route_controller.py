from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.middleware.rate_limit import limiter
from src.services.routing_service import RoutingService
from src.validators.request_validator import bad_request, require_fields


@jwt_required()
@limiter.limit("40/minute")
def get_accessible_route():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["source", "destination"])
    if missing:
        return bad_request("Missing required fields", {"missing": missing})

    source = payload["source"]
    destination = payload["destination"]

    if not isinstance(source, list) or not isinstance(destination, list) or len(source) != 2 or len(destination) != 2:
        return bad_request("source and destination must be [lng, lat]")

    user_id = get_jwt_identity()
    result = RoutingService.get_accessible_routes(source, destination, user_id=user_id)

    if not result:
        return jsonify({"error": "No routes found"}), 404

    return jsonify(result), 200
