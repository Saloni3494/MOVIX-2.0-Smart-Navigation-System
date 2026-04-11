from flask import Blueprint

from src.controllers.route_controller import get_accessible_route


route_bp = Blueprint("route", __name__, url_prefix="/routes")


route_bp.route("/accessible", methods=["POST"])(get_accessible_route)
