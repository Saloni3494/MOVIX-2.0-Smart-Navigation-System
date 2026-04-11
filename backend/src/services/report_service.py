from src.config.database import get_db, utc_now


class ReportService:
    @staticmethod
    def create_report(user_id, payload):
        db = get_db()
        report = {
            "userId": user_id,
            "obstacleType": payload["obstacleType"],
            "location": payload["location"],
            "severity": payload["severity"],
            "imageUrl": payload.get("imageUrl"),
            "notes": payload.get("notes"),
            "createdAt": utc_now(),
        }
        result = db.reports.insert_one(report)
        report["_id"] = str(result.inserted_id)
        return report
