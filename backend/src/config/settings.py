import os
from dotenv import load_dotenv


load_dotenv()


class Settings:
    APP_NAME = "NavAbility Smart Wheelchair Backend"
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/navability")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "navability")
    ROUTE_ALTERNATIVES = int(os.getenv("ROUTE_ALTERNATIVES", "3"))
    OBSTACLE_ALERT_RADIUS_M = int(os.getenv("OBSTACLE_ALERT_RADIUS_M", "40"))
    REROUTE_LOOKAHEAD_POINTS = int(os.getenv("REROUTE_LOOKAHEAD_POINTS", "30"))
    OSRM_BASE_URL = os.getenv(
        "OSRM_BASE_URL",
        "http://router.project-osrm.org/route/v1/driving",
    )
