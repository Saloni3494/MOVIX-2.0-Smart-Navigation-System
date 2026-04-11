"""
Admin Analytics & Dashboard Routes

Blueprint for administrative analytics and infrastructure insights.
"""

from flask import Blueprint

from src.controllers.admin_controller import (
    get_accessibility_insights,
    get_heatmap_data,
    get_system_analytics,
    get_accessibility_hotspots,
    generate_admin_report,
)


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# Analytics and insights
admin_bp.route("/insights/accessibility", methods=["GET"])(get_accessibility_insights)
admin_bp.route("/insights/hotspots", methods=["GET"])(get_accessibility_hotspots)
admin_bp.route("/insights/system", methods=["GET"])(get_system_analytics)

# Visualization
admin_bp.route("/heatmap", methods=["GET"])(get_heatmap_data)

# Reports
admin_bp.route("/report/generate", methods=["GET"])(generate_admin_report)
