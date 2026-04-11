from bson import ObjectId

from src.config.database import get_db, utc_now


class MonitoringService:
    @staticmethod
    def update_user_location(user_id, location):
        db = get_db()
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"currentLocation": location, "updatedAt": utc_now()}},
        )

    @staticmethod
    def get_user_location(user_id):
        db = get_db()
        row = db.users.find_one({"_id": ObjectId(user_id)}, {"currentLocation": 1, "name": 1})
        if not row:
            return None

        return {
            "userId": str(row["_id"]),
            "name": row.get("name"),
            "currentLocation": row.get("currentLocation"),
        }
