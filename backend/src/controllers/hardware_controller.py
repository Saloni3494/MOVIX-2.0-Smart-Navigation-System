from flask import jsonify
from flask_jwt_extended import jwt_required

from src.services.hardware_service import HardwareService


@jwt_required()
def get_hardware_snapshot():
    emg_raw = HardwareService.read_emg_signal()
    emg_processed = HardwareService.process_emg_for_command(emg_raw.get("rawSignal", []))

    return jsonify(
        {
            "ultrasonic": HardwareService.read_ultrasonic_sensor(),
            "emg": emg_raw,
            "emgProcessed": emg_processed,
            "gps": HardwareService.get_gps_location(),
            "system": HardwareService.get_system_status(),
            "hardwareConnection": HardwareService.check_hardware_connection(),
        }
    ), 200
