"""
AI Obstacle Detection API Endpoints

Endpoints for AI-based obstacle detection using camera frames and YOLO simulation.
"""

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.middleware.rate_limit import limiter
from src.services.hardware_service import HardwareService
from src.services.ai_obstacle_detector import AIObstacleDetector
from src.validators.request_validator import bad_request


@jwt_required()
@limiter.limit("40/minute")
def detect_obstacles_in_view():
    """
    Detect obstacles in current camera view using AI.
    
    Request body: {
        "currentLocation": [lng, lat],
        "captureFrames": boolean (optional, default: true)
    }
    
    Returns:
        dict: Detected obstacles with confidence scores
    """
    payload = request.get_json(silent=True) or {}
    
    current_location = payload.get("currentLocation")
    if not current_location or len(current_location) != 2:
        return bad_request("currentLocation must be [lng, lat]")

    # Capture one or more frames
    capture_frames = payload.get("captureFrames", True)
    
    frames = []
    if capture_frames:
        for _ in range(3):  # Capture 3 frames for better accuracy
            frames.append(HardwareService.capture_camera_frame())

    # Batch detect obstacles from frames
    detection_result = AIObstacleDetector.batch_detect(frames, current_location)

    return jsonify(detection_result), 200


@jwt_required()
@limiter.limit("30/minute")
def get_obstacle_detection_metrics():
    """
    Get obstacle detection model performance metrics.
    
    Returns:
        dict: Processing time, detection rate, confidence metrics, etc.
    """
    # In production, would track actual model metrics
    metrics = {
        "modelsAvailable": ["YOLO_v5", "MobileNet"],
        "currentModel": "YOLO_v5_simulated",
        "lastCheckTimestamp": None,
        "estimatedFPS": 30,
        "averageDetectionTimeMs": 50,
        "supported_classes": [
            "stairs",
            "steep_slope",
            "pothole",
            "narrow_path",
            "ramp_missing",
            "blocked_road",
            "construction",
            "spill",
            "debris",
            "vehicle",
        ],
    }

    return jsonify(metrics), 200


@jwt_required()
@limiter.limit("20/minute")
def calibrate_detector():
    """
    Calibrate obstacle detector for environment-specific tuning.
    
    Request body: {
        "confidenceThreshold": float (0.0-1.0),
        "minDetectionRadius": float (meters),
        "maxDetectionRadius": float (meters)
    }
    """
    payload = request.get_json(silent=True) or {}

    # Store calibration parameters (in production, would persist)
    calibration = {
        "confidenceThreshold": payload.get("confidenceThreshold", 0.7),
        "minDetectionRadiusM": payload.get("minDetectionRadius", 1.0),
        "maxDetectionRadiusM": payload.get("maxDetectionRadius", 100.0),
        "lastCalibrated": None,
    }

    return jsonify({
        "message": "Detector calibrated",
        "calibration": calibration
    }), 200


@jwt_required()
@limiter.limit("40/minute")
def process_multiple_frames():
    """
    Process multiple camera frames for more robust detection.
    
    Request body: {
        "frameCount": int (1-10),
        "currentLocation": [lng, lat]
    }
    """
    payload = request.get_json(silent=True) or {}

    frame_count = min(payload.get("frameCount", 3), 10)
    current_location = payload.get("currentLocation", [73.8567, 18.5204])

    # Capture multiple frames
    frames = [HardwareService.capture_camera_frame() for _ in range(frame_count)]

    # Batch detection
    result = AIObstacleDetector.batch_detect(frames, current_location)
    result["framesCaptured"] = frame_count

    return jsonify(result), 200
