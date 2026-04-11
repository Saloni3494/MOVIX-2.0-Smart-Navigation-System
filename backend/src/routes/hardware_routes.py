from flask import Blueprint

from src.controllers.hardware_controller import get_hardware_snapshot


hardware_bp = Blueprint("hardware", __name__, url_prefix="/hardware")


hardware_bp.route("/snapshot", methods=["GET"])(get_hardware_snapshot)
