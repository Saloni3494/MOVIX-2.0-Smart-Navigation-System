from bson import ObjectId

from src.config.database import get_db, utc_now


class ObstacleService:
    @staticmethod
    def create_obstacle(payload, user_id=None):
        db = get_db()
        obstacle = {
            "type": payload["type"],
            "location": payload["location"],
            "severity": payload["severity"],
            "source": payload.get("source", "user"),
            "description": payload.get("description"),
            "imageUrl": payload.get("imageUrl"),
            "createdBy": user_id,
            "createdAt": utc_now(),
        }

        result = db.obstacles.insert_one(obstacle)
        obstacle["_id"] = str(result.inserted_id)
        return obstacle

    @staticmethod
    def get_nearby_obstacles(lng, lat, radius_m):
        db = get_db()
        cursor = db.obstacles.find(
            {
                "location": {
                    "$near": {
                        "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                        "$maxDistance": radius_m,
                    }
                }
            }
        )
        results = []
        for row in cursor:
            row["_id"] = str(row["_id"])
            results.append(row)
        return results

    @staticmethod
    def delete_obstacle(obstacle_id):
        db = get_db()
        result = db.obstacles.delete_one({"_id": ObjectId(obstacle_id)})
        return result.deleted_count > 0

    @staticmethod
    def get_obstacles_in_bbox(min_lng, min_lat, max_lng, max_lat):
        db = get_db()
        cursor = db.obstacles.find(
            {
                "location": {
                    "$geoWithin": {
                        "$box": [[min_lng, min_lat], [max_lng, max_lat]],
                    }
                }
            }
        )
        data = []
        for item in cursor:
            item["_id"] = str(item["_id"])
            data.append(item)
        return data
