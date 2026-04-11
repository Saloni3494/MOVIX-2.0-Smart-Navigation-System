"""
AI Obstacle Detection Routes

Blueprint for AI-based obstacle detection endpoints.
"""

from flask import Blueprint

from src.controllers.ai_detection_controller import (
    detect_obstacles_in_view,
    get_obstacle_detection_metrics,
    calibrate_detector,
    process_multiple_frames,
)


ai_detection_bp = Blueprint("ai_detection", __name__, url_prefix="/api/ai/detection")

# Obstacle detection
ai_detection_bp.route("/obstacles", methods=["POST"])(detect_obstacles_in_view)
ai_detection_bp.route("/obstacles/batch", methods=["POST"])(process_multiple_frames)

# Metrics and configuration
ai_detection_bp.route("/metrics", methods=["GET"])(get_obstacle_detection_metrics)
ai_detection_bp.route("/calibrate", methods=["POST"])(calibrate_detector)
