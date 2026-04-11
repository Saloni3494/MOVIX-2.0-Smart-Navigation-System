from flask import Blueprint

from src.controllers.obstacle_controller import create_obstacle, delete_obstacle, get_nearby_obstacles


obstacle_bp = Blueprint("obstacle", __name__, url_prefix="/obstacles")


obstacle_bp.route("", methods=["POST"])(create_obstacle)
obstacle_bp.route("/nearby", methods=["GET"])(get_nearby_obstacles)
obstacle_bp.route("/<obstacle_id>", methods=["DELETE"])(delete_obstacle)
