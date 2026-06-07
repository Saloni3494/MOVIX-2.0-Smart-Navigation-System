from flask_socketio import SocketIO, emit, join_room, leave_room


socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


def init_socketio(app):
    socketio.init_app(app)
    return socketio


@socketio.on("connect")
def handle_connect():
    emit("connection_ack", {"message": "Connected to MOVIX socket server"})


@socketio.on("join_room")
def handle_join_room(data):
    room = data.get("room")
    if room:
        join_room(room)
        emit("room_joined", {"room": room})


@socketio.on("leave_room")
def handle_leave_room(data):
    room = data.get("room")
    if room:
        leave_room(room)
        emit("room_left", {"room": room})


def emit_obstacle_alert(user_id, payload):
    socketio.emit("alert", payload, room=f"user:{user_id}")


def emit_reroute_update(user_id, payload):
    socketio.emit("route_update", payload, room=f"user:{user_id}")


def emit_caregiver_alert(user_id, payload):
    socketio.emit("caregiver_alert", payload, room=f"user:{user_id}:caregivers")
