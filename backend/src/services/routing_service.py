import logging

import requests

from src.config.database import get_db, utc_now
from src.config.settings import Settings
from src.utils.geo import point_to_line_distance_meters


logger = logging.getLogger(__name__)


OBSTACLE_WEIGHTS = {
    "stairs": 40,
    "steep_slope": 30,
    "pothole": 20,
    "narrow_path": 25,
    "ramp_missing": 35,
}
SEVERITY_MULTIPLIER = {"low": 0.8, "medium": 1.0, "high": 1.4}


class RoutingService:
    @staticmethod
    def _fetch_osrm_routes(source, destination):
        src_lng, src_lat = source
        dst_lng, dst_lat = destination
        url = (
            f"{Settings.OSRM_BASE_URL}/{src_lng},{src_lat};{dst_lng},{dst_lat}"
            "?overview=full&geometries=geojson&alternatives=true"
        )
        response = requests.get(url, timeout=8)
        response.raise_for_status()

        data = response.json()
        routes = []
        for route in data.get("routes", []):
            routes.append(
                {
                    "coordinates": route["geometry"]["coordinates"],
                    "distance_m": route.get("distance", 0),
                    "duration_s": route.get("duration", 0),
                }
            )
        return routes

    @staticmethod
    def _load_accessibility_events(source, destination):
        db = get_db()
        min_lng = min(source[0], destination[0]) - 0.03
        max_lng = max(source[0], destination[0]) + 0.03
        min_lat = min(source[1], destination[1]) - 0.03
        max_lat = max(source[1], destination[1]) + 0.03

        obstacle_filter = {
            "location": {
                "$geoWithin": {
                    "$box": [[min_lng, min_lat], [max_lng, max_lat]],
                }
            }
        }

        events = []
        for collection in ["obstacles", "reports"]:
            cursor = db[collection].find(obstacle_filter)
            for row in cursor:
                events.append(
                    {
                        "type": row.get("type") or row.get("obstacleType", "unknown"),
                        "severity": row.get("severity", "medium"),
                        "location": row["location"]["coordinates"],
                        "source": row.get("source", collection),
                    }
                )

        return events

    @staticmethod
    def _calculate_accessibility_score(route_coords, events):
        score = 100.0
        encountered = []

        for event in events:
            event_point = event["location"]
            min_distance = float("inf")
            for i in range(len(route_coords) - 1):
                dist = point_to_line_distance_meters(
                    event_point,
                    route_coords[i],
                    route_coords[i + 1],
                )
                if dist < min_distance:
                    min_distance = dist

            if min_distance <= 25:
                base = OBSTACLE_WEIGHTS.get(event["type"], 12)
                severity = SEVERITY_MULTIPLIER.get(event["severity"], 1.0)
                penalty = base * severity
                score -= penalty
                encountered.append({**event, "distanceToRoute": round(min_distance, 2), "penalty": penalty})

        return max(0, round(score, 2)), encountered

    @staticmethod
    def get_accessible_routes(source, destination, user_id=None):
        raw_routes = RoutingService._fetch_osrm_routes(source, destination)
        if not raw_routes:
            return None

        events = RoutingService._load_accessibility_events(source, destination)
        scored = []
        for index, route in enumerate(raw_routes):
            score, encountered = RoutingService._calculate_accessibility_score(route["coordinates"], events)
            scored.append(
                {
                    "routeIndex": index,
                    "route": route,
                    "accessibilityScore": score,
                    "encounteredHazards": encountered,
                }
            )

        scored.sort(key=lambda item: item["accessibilityScore"], reverse=True)

        recommended = scored[0]
        alternatives = scored[1: Settings.ROUTE_ALTERNATIVES]

        response = {
            "safestPath": recommended,
            "alternativeRoutes": alternatives,
            "source": {"type": "Point", "coordinates": source},
            "destination": {"type": "Point", "coordinates": destination},
        }

        db = get_db()
        db.routes.insert_one(
            {
                "userId": user_id,
                "source": response["source"],
                "destination": response["destination"],
                "recommendedRoute": recommended,
                "alternatives": alternatives,
                "accessibilityScore": recommended["accessibilityScore"],
                "createdAt": utc_now(),
            }
        )

        logger.info("Generated accessible route with score=%s", recommended["accessibilityScore"])
        return response
