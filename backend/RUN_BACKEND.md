# NavAbility Backend - Run Guide

## 1. Create `.env`

```env
MONGO_URI=mongodb://127.0.0.1:27017/navability
MONGO_DB_NAME=navability
JWT_SECRET_KEY=replace-with-strong-secret
SECRET_KEY=replace-with-strong-secret
FLASK_DEBUG=true
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

## 3. Start backend

```bash
python main.py
```

The API will run on `http://localhost:5000`.

## 4. Core endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /routes/accessible`
- `POST /obstacles`
- `GET /obstacles/nearby?lng=73.85&lat=18.52&radius=100`
- `DELETE /obstacles/<id>` (admin)
- `POST /reports`
- `POST /monitoring/location`
- `POST /monitoring/track`
- `GET /monitoring/user/<userId>/location`
- `POST /emergency`
- `GET /hardware/snapshot`

## 5. Socket.io events

Client emits:

- `join_room` with `{ "room": "user:<userId>" }`
- `join_room` with `{ "room": "user:<userId>:caregivers" }`

Server emits:

- `alert` (`OBSTACLE_ALERT`)
- `route_update` (`ROUTE_UPDATED`)
- `caregiver_alert` (`EMERGENCY_ALERT`)
