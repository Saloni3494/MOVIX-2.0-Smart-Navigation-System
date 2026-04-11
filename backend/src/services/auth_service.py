from bson import ObjectId
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from src.config.database import get_db, utc_now


class AuthService:
    @staticmethod
    def register_user(name, email, password, role, emergency_contacts, current_location=None):
        db = get_db()
        existing = db.users.find_one({"email": email.lower()})
        if existing:
            raise ValueError("Email already exists")

        user = {
            "name": name,
            "email": email.lower(),
            "passwordHash": generate_password_hash(password),
            "role": role,
            "currentLocation": current_location,
            "emergencyContacts": emergency_contacts,
            "createdAt": utc_now(),
            "updatedAt": utc_now(),
        }

        result = db.users.insert_one(user)
        user["_id"] = str(result.inserted_id)
        user.pop("passwordHash", None)
        return user

    @staticmethod
    def login_user(email, password):
        db = get_db()
        user = db.users.find_one({"email": email.lower()})

        if not user or not check_password_hash(user.get("passwordHash", ""), password):
            raise ValueError("Invalid credentials")

        user_id = str(user["_id"])
        token = create_access_token(
            identity=user_id,
            additional_claims={"role": user.get("role", "wheelchair_user")},
        )

        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role"),
                "currentLocation": user.get("currentLocation"),
                "emergencyContacts": user.get("emergencyContacts", []),
            },
        }

    @staticmethod
    def get_user_by_id(user_id):
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None

        return {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role"),
            "currentLocation": user.get("currentLocation"),
            "emergencyContacts": user.get("emergencyContacts", []),
        }
