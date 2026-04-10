from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import math
from crew import run_crew
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# 🔹 Geocoding
def get_coordinates(place):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": place, "format": "json", "limit": 1}
    headers = {"User-Agent": "NavAbility-App"}

    try:
        res = requests.get(url, params=params, headers=headers)

        if res.status_code != 200:
            return None

        data = res.json()
        if len(data) == 0:
            return None

        return [float(data[0]["lon"]), float(data[0]["lat"])]

    except:
        return None


# 🔹 Get routes (OSRM)
def get_routes(start, end):
    url = f"http://router.project-osrm.org/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson&alternatives=true"
    
    res = requests.get(url)
    if res.status_code != 200:
        return []

    data = res.json()
    if "routes" not in data:
        return []

    routes = []
    for route in data["routes"]:
        routes.append(route["geometry"]["coordinates"])

    return routes


# 🔹 Crowd Data (Simulated DB)
crowd_data = [
    {"lat": 18.5204, "lon": 73.8567, "issue": "stairs", "severity": 10},
    {"lat": 18.525, "lon": 73.86, "issue": "steep slope", "severity": 7},
    {"lat": 18.526, "lon": 73.861, "issue": "pothole", "severity": 5},
]


# 🔹 Safety scoring
def calculate_score(route):
    score = 100

    for point in route:
        for issue in crowd_data:
            dist = math.sqrt(
                (point[1] - issue["lat"])**2 + 
                (point[0] - issue["lon"])**2
            )

            if dist < 0.002:
                score -= issue["severity"] * 5

    return score


# 🔹 Best route selection
def get_safest_route(routes):
    best_route = None
    best_score = -1

    for route in routes:
        score = calculate_score(route)

        if score > best_score:
            best_score = score
            best_route = route

    return best_route, best_score


# 🔥 MAIN API
@app.route("/route", methods=["POST"])
def get_route():
    data = request.json
    destination = data.get("destination")
    user_location = data.get("userLocation")

    if not destination or not user_location:
        return jsonify({"error": "Destination and userLocation are required"}), 400

    try:
        ai_result = run_crew(destination)
    except Exception:
        ai_result = "AI summary unavailable right now. Continuing with safest route calculation."

    dest_coords = get_coordinates(destination)

    if not dest_coords or not user_location:
        return jsonify({"error": "Location not found"}), 404

    routes = get_routes(user_location, dest_coords)
    if not routes:
        return jsonify({"error": "No routes found"}), 404

    best_route, score = get_safest_route(routes)

    return jsonify({
        "route": best_route,
        "score": score,
        "crowd_data": crowd_data,
        "ai_response": str(ai_result)
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)