from flask import Blueprint

from src.controllers.emergency_controller import trigger_emergency


emergency_bp = Blueprint("emergency", __name__, url_prefix="/emergency")


emergency_bp.route("", methods=["POST"])(trigger_emergency)
