"""
AI-Based Obstacle Detection Service

Simulates YOLO/MobileNet object detection for real-time obstacle recognition.
In production, this would integrate with actual ML models; here we simulate realistic detections.

Supported obstacle types:
- stairs, steep_slope, pothole, narrow_path, ramp_missing
- blocked_road, construction, spill, debris, vehicle
"""

import logging
import random
from typing import List, Dict
from dataclasses import dataclass
from enum import Enum


logger = logging.getLogger(__name__)


class ObstacleConfidence(Enum):
    """Confidence levels for obstacle detection"""
    LOW = 0.5
    MEDIUM = 0.7
    HIGH = 0.85
    VERY_HIGH = 0.95


@dataclass
class DetectedObstacle:
    """Represents a detected obstacle"""
    type: str
    confidence: float
    location: List[float]  # [lng, lat]
    severity: str  # low, medium, high
    boundingBox: Dict  # {x, y, width, height} in image coords
    description: str


class AIObstacleDetector:
    """
    AI-based obstacle detector (YOLO/MobileNet simulation).
    Simulates realistic ML model confidence scores and detections.
    """

    # Obstacle type to likelihood mapping
    OBSTACLE_LIKELIHOODS = {
        "stairs": 0.08,
        "steep_slope": 0.05,
        "pothole": 0.12,
        "narrow_path": 0.10,
        "ramp_missing": 0.06,
        "blocked_road": 0.07,
        "construction": 0.08,
        "spill": 0.04,
        "debris": 0.15,
        "vehicle": 0.10,
    }

    # Severity mapping
    SEVERITY_MAP = {
        "stairs": "high",
        "steep_slope": "high",
        "pothole": "medium",
        "narrow_path": "medium",
        "ramp_missing": "high",
        "blocked_road": "high",
        "construction": "medium",
        "spill": "medium",
        "debris": "medium",
        "vehicle": "high",
    }

    @staticmethod
    def detect_obstacles_in_frame(frame_data: dict, current_location: list) -> List[DetectedObstacle]:
        """
        Simulate YOLO obstacle detection in a camera frame.
        
        Args:
            frame_data: Camera frame metadata
            current_location: Current GPS location [lng, lat]
            
        Returns:
            List of detected obstacles with confidence scores
        """
        detected = []

        if not frame_data.get("hasObstacles"):
            return detected

        # Randomly detect 0-3 obstacles per frame
        num_obstacles = random.randint(0, 3)

        for _ in range(num_obstacles):
            # Select obstacle type weighted by likelihood
            obstacle_type = random.choices(
                list(AIObstacleDetector.OBSTACLE_LIKELIHOODS.keys()),
                weights=list(AIObstacleDetector.OBSTACLE_LIKELIHOODS.values()),
                k=1,
            )[0]

            # Generate confidence (ML models rarely get 100%)
            base_confidence = random.uniform(0.6, 0.98)
            confidence = min(base_confidence, ObstacleConfidence.VERY_HIGH.value)

            # Simulate location near current location
            location_offset = [
                random.uniform(-0.001, 0.001),
                random.uniform(-0.001, 0.001),
            ]
            detected_location = [
                current_location[0] + location_offset[0],
                current_location[1] + location_offset[1],
            ]

            obstacle = DetectedObstacle(
                type=obstacle_type,
                confidence=round(confidence, 2),
                location=detected_location,
                severity=AIObstacleDetector.SEVERITY_MAP[obstacle_type],
                boundingBox={
                    "x": random.randint(10, 600),
                    "y": random.randint(10, 450),
                    "width": random.randint(30, 200),
                    "height": random.randint(30, 200),
                },
                description=AIObstacleDetector._generate_description(obstacle_type),
            )
            detected.append(obstacle)

        return detected

    @staticmethod
    def _generate_description(obstacle_type: str) -> str:
        """Generate human-readable description of obstacle"""
        descriptions = {
            "stairs": "Stairs encountered - recommended accessible ramp nearby",
            "steep_slope": "Steep slope detected - high difficulty for wheelchair",
            "pothole": "Pothole or road damage - avoid area",
            "narrow_path": "Path is narrow - may be difficult to navigate",
            "ramp_missing": "Ramp is missing at curb - consider alternative",
            "blocked_road": "Road is blocked - must reroute",
            "construction": "Construction zone ahead - proceed with caution",
            "spill": "Liquid or debris spill on path - slippery",
            "debris": "Scattered debris on road - navigate around",
            "vehicle": "Vehicle or obstruction in path",
        }
        return descriptions.get(obstacle_type, f"Unknown obstacle: {obstacle_type}")

    @staticmethod
    def batch_detect(frames: List[dict], current_location: list) -> Dict:
        """
        Process multiple frames and aggregate detections (reduces false positives).
        
        Args:
            frames: List of camera frames
            current_location: Current GPS location
            
        Returns:
            Aggregated detections with confidence filtering
        """
        all_detections = []

        for frame in frames:
            detections = AIObstacleDetector.detect_obstacles_in_frame(
                frame, current_location
            )
            all_detections.extend(detections)

        # Filter low-confidence detections
        high_confidence = [
            d for d in all_detections if d.confidence >= ObstacleConfidence.MEDIUM.value
        ]

        # Aggregate duplicate detections
        aggregated = AIObstacleDetector._aggregate_detections(high_confidence)

        return {
            "totalFramesProcessed": len(frames),
            "detectedObstacles": len(aggregated),
            "obstacles": [
                {
                    "type": obs.type,
                    "confidence": obs.confidence,
                    "location": {"type": "Point", "coordinates": obs.location},
                    "severity": obs.severity,
                    "boundingBox": obs.boundingBox,
                    "description": obs.description,
                }
                for obs in aggregated
            ],
            "processingQuality": "high_quality" if len(high_confidence) > 0 else "no_obstacles",
        }

    @staticmethod
    def _aggregate_detections(detections: List[DetectedObstacle]) -> List[DetectedObstacle]:
        """
        Aggregate nearby duplicate detections (realistic ML behavior).
        Merges detections within ~20 meters of each other.
        """
        if not detections:
            return []

        aggregated = []
        used = set()

        for i, det1 in enumerate(detections):
            if i in used:
                continue

            cluster = [det1]
            for j, det2 in enumerate(detections[i + 1 :], start=i + 1):
                if j in used:
                    continue

                # Simple distance check (rough approximation)
                distance = (
                    (det1.location[0] - det2.location[0]) ** 2
                    + (det1.location[1] - det2.location[1]) ** 2
                ) ** 0.5

                if distance < 0.0002:  # ~20 meters at equator
                    cluster.append(det2)
                    used.add(j)

            # Use highest confidence detection from cluster
            best = max(cluster, key=lambda x: x.confidence)
            aggregated.append(best)
            used.add(i)

        return aggregated


class ModelPerformanceMetrics:
    """Track model performance metrics for observatory/debugging"""

    def __init__(self):
        self.total_frames = 0
        self.total_detections = 0
        self.false_positives = 0
        self.false_negatives = 0
        self.average_confidence = 0.0
        self.processing_time_ms = 0.0

    def update(self, detections: List[DetectedObstacle], processing_time_ms: float):
        """Update metrics"""
        self.total_frames += 1
        self.total_detections += len(detections)
        self.processing_time_ms = processing_time_ms

        if detections:
            self.average_confidence = sum(d.confidence for d in detections) / len(detections)

    def get_report(self) -> dict:
        """Get current performance report"""
        return {
            "totalFramesProcessed": self.total_frames,
            "totalDetections": self.total_detections,
            "averageConfidence": round(self.average_confidence, 2),
            "processingTimeMs": round(self.processing_time_ms, 2),
            "detectionsPerFrame": round(
                self.total_detections / max(1, self.total_frames), 2
            ),
        }
