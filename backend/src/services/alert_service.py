import logging

from src.socket.socket_server import emit_caregiver_alert, emit_obstacle_alert, emit_reroute_update


logger = logging.getLogger(__name__)


class AlertService:
    @staticmethod
    def send_obstacle_alert(user_id, obstacle):
        payload = {
            "type": "OBSTACLE_ALERT",
            "message": f"Obstacle detected ahead: {obstacle.get('type')}",
            "location": obstacle.get("location"),
            "severity": obstacle.get("severity", "medium"),
            "source": obstacle.get("source"),
        }
        emit_obstacle_alert(user_id, payload)
        logger.info("Sent obstacle alert to user=%s", user_id)

    @staticmethod
    def send_route_update(user_id, reroute_payload):
        payload = {
            "type": "ROUTE_UPDATED",
            "message": "Route was automatically updated for safer navigation",
            "data": reroute_payload,
        }
        emit_reroute_update(user_id, payload)
        logger.info("Sent route update to user=%s", user_id)

    @staticmethod
    def send_caregiver_emergency(user_id, payload):
        emit_caregiver_alert(user_id, payload)
        logger.info("Sent caregiver emergency alert for user=%s", user_id)
