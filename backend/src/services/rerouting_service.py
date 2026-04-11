from src.config.settings import Settings
from src.services.obstacle_service import ObstacleService
from src.services.routing_service import RoutingService
from src.utils.geo import haversine_meters


class ReroutingService:
    @staticmethod
    def _obstacle_ahead(route_coords, user_location):
        if not route_coords:
            return None

        lng, lat = user_location
        lookahead = route_coords[: Settings.REROUTE_LOOKAHEAD_POINTS]
        nearby = ObstacleService.get_nearby_obstacles(lng, lat, Settings.OBSTACLE_ALERT_RADIUS_M)

        for obstacle in nearby:
            o_lng, o_lat = obstacle["location"]["coordinates"]
            for point in lookahead:
                distance = haversine_meters(o_lng, o_lat, point[0], point[1])
                if distance <= Settings.OBSTACLE_ALERT_RADIUS_M:
                    return obstacle

        return None

    @staticmethod
    def check_and_reroute(user_location, destination, current_route, user_id):
        obstacle = ReroutingService._obstacle_ahead(current_route, user_location)
        if not obstacle:
            return {"rerouted": False, "obstacle": None, "newRoute": None}

        recalculated = RoutingService.get_accessible_routes(user_location, destination, user_id=user_id)
        return {
            "rerouted": True,
            "obstacle": obstacle,
            "newRoute": recalculated,
        }
