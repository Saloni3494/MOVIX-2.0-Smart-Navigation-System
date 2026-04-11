import logging

from flask import jsonify
from pymongo.errors import PyMongoError


logger = logging.getLogger(__name__)


def register_error_handlers(app):
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(PyMongoError)
    def handle_db_error(error):
        logger.exception("Database error: %s", error)
        return jsonify({"error": "Database operation failed"}), 500

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        logger.exception("Unhandled error: %s", error)
        return jsonify({"error": "Internal server error"}), 500
