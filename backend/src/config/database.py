import logging
from datetime import datetime

from pymongo import ASCENDING, GEOSPHERE, MongoClient
from pymongo.errors import PyMongoError

from src.config.settings import Settings


logger = logging.getLogger(__name__)

mongo_client = None
mongo_db = None


def _create_indexes(db):
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("role", ASCENDING)])

    db.obstacles.create_index([("location", GEOSPHERE)])
    db.obstacles.create_index([("createdAt", ASCENDING)])
    db.obstacles.create_index([("type", ASCENDING)])

    db.reports.create_index([("location", GEOSPHERE)])
    db.reports.create_index([("createdAt", ASCENDING)])

    db.routes.create_index([("source", GEOSPHERE)])
    db.routes.create_index([("destination", GEOSPHERE)])
    db.routes.create_index([("createdAt", ASCENDING)])

    db.emergencyLogs.create_index([("location", GEOSPHERE)])
    db.emergencyLogs.create_index([("createdAt", ASCENDING)])


def init_mongo():
    global mongo_client, mongo_db

    try:
        mongo_client = MongoClient(Settings.MONGO_URI)
        mongo_client.admin.command("ping")
        mongo_db = mongo_client[Settings.MONGO_DB_NAME]
        _create_indexes(mongo_db)
        logger.info("MongoDB connected and indexes verified")
    except PyMongoError as exc:
        logger.exception("MongoDB connection failed: %s", exc)
        raise RuntimeError("Unable to connect to MongoDB") from exc


def get_db():
    if mongo_db is None:
        raise RuntimeError("MongoDB is not initialized. Call init_mongo() first.")
    return mongo_db


def utc_now():
    return datetime.utcnow()
