import math


def haversine_meters(lng1, lat1, lng2, lat2):
    radius = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )

    return 2 * radius * math.asin(math.sqrt(a))


def point_to_line_distance_meters(point, line_start, line_end):
    # Approximate with equirectangular projection for speed in route scoring.
    px, py = point
    x1, y1 = line_start
    x2, y2 = line_end

    if x1 == x2 and y1 == y2:
        return haversine_meters(px, py, x1, y1)

    t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (
        (x2 - x1) ** 2 + (y2 - y1) ** 2
    )
    t = max(0, min(1, t))

    proj_x = x1 + t * (x2 - x1)
    proj_y = y1 + t * (y2 - y1)

    return haversine_meters(px, py, proj_x, proj_y)
