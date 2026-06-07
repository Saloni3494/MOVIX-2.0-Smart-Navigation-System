from flask import jsonify
from flask_jwt_extended import jwt_required

from src.services.hardware_service import HardwareService


@jwt_required()
def get_hardware_snapshot():
    biosignals_raw = HardwareService.read_emg_signal()
    emg_processed = HardwareService.process_biosignals_for_command(biosignals_raw)

    return jsonify(
        {
            "ultrasonic": HardwareService.read_ultrasonic_sensor(),
            "biosignals": biosignals_raw,
            "biosignalsProcessed": emg_processed,
            "gps": HardwareService.get_gps_location(),
            "system": HardwareService.get_system_status(),
            "hardwareConnection": HardwareService.check_hardware_connection(),
        }
    ), 200
