from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from src.config.database import init_mongo
from src.config.settings import Settings
from src.middleware.error_handler import register_error_handlers
from src.middleware.rate_limit import init_rate_limiter
from src.routes.auth_routes import auth_bp
from src.routes.emergency_routes import emergency_bp
from src.routes.hardware_routes import hardware_bp
from src.routes.monitoring_routes import monitoring_bp
from src.routes.obstacle_routes import obstacle_bp
from src.routes.report_routes import report_bp
from src.routes.route_routes import route_bp
from src.routes.safety_routes import safety_bp
from src.routes.ai_detection_routes import ai_detection_bp
from src.routes.voice_routes import voice_bp
from src.routes.admin_routes import admin_bp
from src.socket.socket_server import init_socketio
from src.utils.logger import configure_logging


jwt = JWTManager()


def create_app():
    configure_logging()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = Settings.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = Settings.JWT_SECRET_KEY

    CORS(app)
    jwt.init_app(app)
    init_rate_limiter(app)
    init_mongo()

    app.register_blueprint(auth_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(obstacle_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(monitoring_bp)
    app.register_blueprint(hardware_bp)
    app.register_blueprint(safety_bp)
    app.register_blueprint(ai_detection_bp)
    app.register_blueprint(voice_bp)
    app.register_blueprint(admin_bp)

    register_error_handlers(app)

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok", "service": Settings.APP_NAME}), 200

    @app.get("/api/health")
    def health_check_api_alias():
        return jsonify({"status": "ok", "service": Settings.APP_NAME}), 200

    init_socketio(app)
    return app
