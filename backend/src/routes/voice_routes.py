"""
Voice Recognition & Audio Feedback Routes

Blueprint for voice command recognition and audio feedback endpoints.
"""

from flask import Blueprint

from src.controllers.voice_controller import (
    recognize_voice_command,
    generate_audio_feedback,
    get_voice_command_history,
    get_audio_feedback_history,
    set_audio_enabled,
    estimate_tts_duration,
    process_voice_interaction,
    set_listening_mode,
)


voice_bp = Blueprint("voice", __name__, url_prefix="/api/voice")

# Voice recognition
voice_bp.route("/recognize", methods=["POST"])(recognize_voice_command)
voice_bp.route("/interaction", methods=["POST"])(process_voice_interaction)
voice_bp.route("/listening", methods=["POST"])(set_listening_mode)
voice_bp.route("/history", methods=["GET"])(get_voice_command_history)

# Audio feedback
voice_bp.route("/feedback/generate", methods=["POST"])(generate_audio_feedback)
voice_bp.route("/feedback/history", methods=["GET"])(get_audio_feedback_history)
voice_bp.route("/feedback/enabled", methods=["POST"])(set_audio_enabled)
voice_bp.route("/tts/estimate", methods=["POST"])(estimate_tts_duration)
