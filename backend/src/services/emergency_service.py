import logging
from bson import ObjectId

from src.config.database import get_db, utc_now
from src.services.alert_service import AlertService


logger = logging.getLogger(__name__)


class EmergencyService:
    @staticmethod
    def trigger_emergency(user_id, location, message):
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError("User not found")

        contacts = user.get("emergencyContacts", [])
        emergency_log = {
            "userId": user_id,
            "location": location,
            "message": message,
            "caregiversNotified": contacts,
            "createdAt": utc_now(),
        }
        db.emergencyLogs.insert_one(emergency_log)

        payload = {
            "type": "EMERGENCY_ALERT",
            "message": message,
            "location": location,
            "user": {"id": user_id, "name": user.get("name")},
            "caregivers": contacts,
        }

        AlertService.send_caregiver_emergency(user_id, payload)

        # Hackathon simulation for external notification gateway.
        logger.warning("[EMERGENCY] notifying contacts=%s for user=%s", contacts, user_id)

        return payload
