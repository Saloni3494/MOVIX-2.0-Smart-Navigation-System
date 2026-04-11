from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class GeoPoint:
    type: str
    coordinates: List[float]


@dataclass
class UserModel:
    name: str
    email: str
    passwordHash: str
    role: str
    currentLocation: Optional[GeoPoint] = None
    emergencyContacts: List[str] = field(default_factory=list)
    createdAt: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ObstacleModel:
    type: str
    location: GeoPoint
    severity: str
    source: str
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    createdBy: Optional[str] = None
    createdAt: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RouteModel:
    userId: str
    source: GeoPoint
    destination: GeoPoint
    recommendedRoute: dict
    alternatives: List[dict]
    accessibilityScore: float
    createdAt: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ReportModel:
    userId: str
    obstacleType: str
    location: GeoPoint
    severity: str
    imageUrl: Optional[str] = None
    notes: Optional[str] = None
    createdAt: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EmergencyLogModel:
    userId: str
    location: GeoPoint
    message: str
    caregiversNotified: List[str]
    createdAt: datetime = field(default_factory=datetime.utcnow)
