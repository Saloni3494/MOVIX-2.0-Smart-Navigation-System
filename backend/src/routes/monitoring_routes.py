from flask import Blueprint

from src.controllers.monitoring_controller import get_user_location, track_and_reroute, update_location


monitoring_bp = Blueprint("monitoring", __name__, url_prefix="/monitoring")


monitoring_bp.route("/location", methods=["POST"])(update_location)
monitoring_bp.route("/user/<user_id>/location", methods=["GET"])(get_user_location)
monitoring_bp.route("/track", methods=["POST"])(track_and_reroute)
