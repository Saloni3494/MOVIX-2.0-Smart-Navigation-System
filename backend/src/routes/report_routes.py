from flask import Blueprint

from src.controllers.report_controller import create_report


report_bp = Blueprint("report", __name__, url_prefix="/reports")


report_bp.route("", methods=["POST"])(create_report)
