"""
Voice Recognition & Audio Feedback API Endpoints

Endpoints for processing voice commands and generating audio feedback/guidance.
"""

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from src.middleware.rate_limit import limiter
from src.services.voice_service import VoiceRecognitionEngine, AudioFeedbackGenerator, AudioFeedbackType
from src.validators.request_validator import bad_request


# Global instances
voice_engine = VoiceRecognitionEngine()
audio_feedback = AudioFeedbackGenerator()


@jwt_required()
@limiter.limit("60/minute")
def recognize_voice_command():
    """
    Recognize voice command from audio transcript.
    
    Request body: {
        "transcript": "user's spoken words",
        "confidence": optional float (0.0-1.0)
    }
    
    Returns:
        dict: Recognized command with confidence score
    """
    payload = request.get_json(silent=True) or {}
    
    transcript = payload.get("transcript", "").strip()
    if not transcript:
        return bad_request("transcript is required")

    result = voice_engine.recognize_command(transcript)

    return jsonify(result), 200


@jwt_required()
@limiter.limit("40/minute")
def generate_audio_feedback():
    """
    Generate audio feedback message.
    
    Request body: {
        "feedbackType": "instruction|alert|confirmation|warning|emergency",
        "messageKey": "string (specific message identifier)"
    }
    
    Returns:
        dict: Audio feedback data (ready for TTS synthesis)
    """
    payload = request.get_json(silent=True) or {}

    feedback_type_str = payload.get("feedbackType", "instruction").upper()
    message_key = payload.get("messageKey", "unknown")

    try:
        feedback_type = AudioFeedbackType[feedback_type_str]
    except KeyError:
        return bad_request(
            "Invalid feedbackType",
            {"valid_types": [f.name for f in AudioFeedbackType]}
        )

    audio_data = audio_feedback.generate_feedback(feedback_type, message_key)

    return jsonify(audio_data), 200


@jwt_required()
@limiter.limit("60/minute")
def get_voice_command_history():
    """
    Get recent voice command history for user review.
    
    Query params:
        last_n: number of recent commands (default: 10)
    
    Returns:
        list: Recent voice commands with timestamps
    """
    last_n = min(int(request.args.get("last_n", 10)), 50)
    history = voice_engine.get_command_history(last_n)

    return jsonify({"commands": history}), 200


@jwt_required()
@limiter.limit("30/minute")
def get_audio_feedback_history():
    """
    Get recent audio feedback history.
    
    Query params:
        last_n: number of recent feedback items (default: 10)
    
    Returns:
        list: Recent audio feedback with timestamps
    """
    last_n = min(int(request.args.get("last_n", 10)), 50)
    history = audio_feedback.get_feedback_history(last_n)

    return jsonify({"feedback": history}), 200


@jwt_required()
@limiter.limit("10/minute")
def set_audio_enabled():
    """
    Enable or disable audio feedback output.
    
    Request body: {
        "enabled": boolean
    }
    """
    payload = request.get_json(silent=True) or {}

    enabled = payload.get("enabled", True)
    audio_feedback.set_audio_enabled(enabled)

    return jsonify({
        "message": "Audio output " + ("enabled" if enabled else "disabled"),
        "audioEnabled": audio_feedback.audio_enabled
    }), 200


@jwt_required()
@limiter.limit("30/minute")
def estimate_tts_duration():
    """
    Estimate text-to-speech duration for UI/UX purposes.
    
    Request body: {
        "text": "text to synthesize"
    }
    
    Returns:
        dict: Estimated duration and word count
    """
    payload = request.get_json(silent=True) or {}

    text = payload.get("text", "")
    if not text:
        return bad_request("text is required")

    estimate = audio_feedback.text_to_speech_estimate(text)

    return jsonify(estimate), 200


@jwt_required()
@limiter.limit("40/minute")
def process_voice_interaction():
    """
    Full voice interaction: recognize command + generate feedback.
    
    Request body: {
        "transcript": "user's spoken words",
        "generateFeedback": boolean (default: true)
    }
    
    Returns:
        dict: Command recognition result + audio feedback (if requested)
    """
    payload = request.get_json(silent=True) or {}

    transcript = payload.get("transcript", "").strip()
    if not transcript:
        return bad_request("transcript is required")

    # Recognize command
    command_result = voice_engine.recognize_command(transcript)

    response = {
        "command": command_result,
    }

    # Optionally generate feedback
    if payload.get("generateFeedback", True):
        feedback_type = AudioFeedbackType.CONFIRMATION
        
        # Generate appropriate feedback based on command
        if command_result["command"] == "unknown":
            feedback_type = AudioFeedbackType.ALERT
            message_key = "unknown_command"
        else:
            message_key = f"command_{command_result['command']}"

        feedback = audio_feedback.generate_feedback(feedback_type, message_key)
        response["audioFeedback"] = feedback

    return jsonify(response), 200


@jwt_required()
@limiter.limit("10/minute")
def set_listening_mode():
    """
    Set voice recognition listening state.
    
    Request body: {
        "isListening": boolean
    }
    """
    payload = request.get_json(silent=True) or {}

    is_listening = payload.get("isListening", False)
    voice_engine.set_listening(is_listening)

    return jsonify({
        "message": "Listening mode " + ("enabled" if is_listening else "disabled"),
        "isListening": voice_engine.is_listening
    }), 200
