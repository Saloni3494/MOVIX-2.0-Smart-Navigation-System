# NavAbility API Quick Reference

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🤖 AI Obstacle Detection APIs

### Detect Obstacles in Current View
```
POST /api/ai/detection/obstacles
Content-Type: application/json

{
  "currentLocation": [73.8567, 18.5204],
  "captureFrames": true
}

Response:
{
  "totalFramesProcessed": 3,
  "detectedObstacles": 2,
  "processingQuality": "high_quality",
  "obstacles": [
    {
      "type": "stairs",
      "confidence": 0.92,
      "severity": "high",
      "location": {"type": "Point", "coordinates": [73.856, 18.520]},
      "description": "Stairs encountered - recommended accessible ramp nearby"
    }
  ]
}
```

### Get Detection Metrics
```
GET /api/ai/detection/metrics

Response:
{
  "modelsAvailable": ["YOLO_v5", "MobileNet"],
  "currentModel": "YOLO_v5_simulated",
  "estimatedFPS": 30,
  "averageDetectionTimeMs": 50,
  "supported_classes": [...]
}
```

### Calibrate Detector
```
POST /api/ai/detection/calibrate

{
  "confidenceThreshold": 0.7,
  "minDetectionRadius": 1.0,
  "maxDetectionRadius": 100.0
}
```

### Batch Process Multiple Frames
```
POST /api/ai/detection/obstacles/batch

{
  "frameCount": 5,
  "currentLocation": [73.8567, 18.5204]
}
```

---

## 🎙️ Voice Recognition APIs

### Recognize Voice Command
```
POST /api/voice/recognize

{
  "transcript": "help me please"
}

Response:
{
  "command": "help",
  "confidence": 0.95,
  "transcript": "help me please",
  "matched": true
}
```

### Full Voice Interaction (Command + Feedback)
```
POST /api/voice/interaction

{
  "transcript": "what's ahead",
  "generateFeedback": true
}

Response:
{
  "command": {
    "command": "unknown",
    "confidence": 0.65
  },
  "audioFeedback": {
    "type": "alert",
    "text": "Did not understand command. Say 'help' for options.",
    "duration_estimated_ms": 3000
  }
}
```

### Generate Audio Feedback
```
POST /api/voice/feedback/generate

{
  "feedbackType": "instruction",
  "messageKey": "turn_left"
}

Response:
{
  "type": "instruction",
  "text": "Turn left ahead.",
  "pitch": 1.0,
  "speed": 1.0,
  "duration_estimated_ms": 1500
}
```

### Get Voice Command History
```
GET /api/voice/history?last_n=10

Response:
{
  "commands": [
    {
      "command": "help",
      "confidence": 0.95,
      "timestamp": "2026-04-11T10:30:45.123Z"
    }
  ]
}
```

### Get Audio Feedback History
```
GET /api/voice/feedback/history?last_n=10
```

### Enable/Disable Audio
```
POST /api/voice/feedback/enabled

{
  "enabled": true
}
```

### Estimate TTS Duration
```
POST /api/voice/tts/estimate

{
  "text": "Turn left at the next intersection"
}

Response:
{
  "text": "...",
  "estimatedDurationMs": 2500,
  "wordCount": 6,
  "requiresUserAttention": false
}
```

### Set Listening Mode
```
POST /api/voice/listening

{
  "isListening": true
}
```

---

## 🛡️ Safety Control APIs

### Perform Safety Check
```
POST /api/safety/check

{}

Response:
{
  "safetyLevel": "normal",
  "status": "operational",
  "inactivity": {
    "isInactive": false,
    "timeSinceActivitySeconds": 5.2,
    "thresholdSeconds": 15
  },
  "braking": {
    "emergencyStopActive": false,
    "brakeIntensity": 0.0
  },
  "actionsNeeded": []
}
```

### Record User Activity
```
POST /api/safety/activity

{
  "activityType": "emg_command"
}

// activityType options:
// - emg_command
// - voice_command
// - touch_input
// - generic
```

### Trigger Emergency Brake
```
POST /api/safety/brake/emergency

{
  "reason": "Critical obstacle detected"
}

Response:
{
  "emergency_stop": true,
  "brakeIntensity": 1.0,
  "reason": "Critical obstacle detected"
}
```

### Release Brakes
```
POST /api/safety/brake/release

Response:
{
  "emergency_stop": false,
  "brakeIntensity": 0.0,
  "status": "ready_to_move"
}
```

### Get Brake Status
```
GET /api/safety/brake/status

Response:
{
  "isEnabled": true,
  "emergencyStopActive": false,
  "brakeIntensity": 0.0,
  "totalBrakingEventsCount": 2
}
```

### Get Inactivity Status
```
GET /api/safety/inactivity/status

Response:
{
  "isInactive": false,
  "timeSinceActivitySeconds": 3.5,
  "thresholdSeconds": 15,
  "timeSinceEMGSeconds": 3.5,
  "timeSinceVoiceSeconds": inf,
  "timeSinceInputSeconds": inf,
  "inactivityAlertsCount": 0
}
```

### Acknowledge Safety Warning
```
POST /api/safety/acknowledge

Response:
{
  "acknowledged": true,
  "brakesReleased": true
}
```

### Get Safety Configuration
```
GET /api/safety/config

Response:
{
  "inactivityThresholdSeconds": 15,
  "autoBrakingEnabled": true,
  "safetyLevel": "operational"
}
```

### Update Safety Configuration
```
PUT /api/safety/config

{
  "inactivityThresholdSeconds": 20,
  "autoBrakingEnabled": true
}
```

---

## 📊 Admin Dashboard APIs

### Get Accessibility Insights
```
GET /api/admin/insights/accessibility

Response:
{
  "dataPoints": {
    "totalReports": 45,
    "totalObstacles": 67,
    "severityDistribution": {"high": 12, "medium": 38, "low": 17},
    "obstaclesByType": [
      {"_id": "stairs", "count": 15, "avgSeverity": 2.8}
    ]
  },
  "accessibilityScore": 72,
  "recommendations": [...]
}
```

### Get Geographic Hotspots
```
GET /api/admin/insights/hotspots

Response:
{
  "hotspots": [
    {
      "centerLat": 18.520,
      "centerLng": 73.856,
      "totalObstacles": 8,
      "criticalObstacles": 2,
      "priority": "high"
    }
  ]
}
```

### Get System Analytics
```
GET /api/admin/insights/system

Response:
{
  "userMetrics": {
    "totalUsers": 156,
    "activeUsersLast24h": 62,
    "newUsersLast7Days": 15
  },
  "navigationMetrics": {
    "totalRoutesCreated": 543,
    "averageAccessibilityScore": 78,
    "routeOptimizationRate": 0.85
  },
  "safetyMetrics": {
    "emergencyEventsTotal": 3,
    "autoBrakingActivations": 12
  }
}
```

### Get Heatmap Data (GeoJSON)
```
GET /api/admin/heatmap

Response (GeoJSON):
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [73.856, 18.520]},
      "properties": {
        "count": 8,
        "severity": "high",
        "intensity": 0.8
      }
    }
  ]
}
```

### Generate Report
```
GET /api/admin/report/generate?period=weekly&format=json

Response:
{
  "reportType": "Accessibility & Infrastructure Analytics",
  "period": "weekly",
  "generatedAt": "2026-04-11T...",
  "sections": {
    "executive_summary": "...",
    "recommendations": [...]
  }
}
```

---

## 🔧 Hardware Simulator APIs

### Get Hardware Snapshot
```
GET /api/hardware/snapshot

Response:
{
  "ultrasonic": {"distanceCm": 45.2, "isObstacleNearby": true},
  "emg": {"signalStrength": 0.62, "command": "forward"},
  "gps": {"type": "Point", "coordinates": [73.856, 18.520]}
}
```

---

## 🔌 Existing APIs (Maintained)

### Routes
```
POST   /api/routes/accessible
GET    /api/routes/{id}
DELETE /api/routes/{id}
```

### Obstacles
```
POST   /api/obstacles
GET    /api/obstacles/nearby
DELETE /api/obstacles/{id}
```

### Reports
```
POST   /api/reports
GET    /api/reports/{id}
```

### Emergency
```
POST   /api/emergency
GET    /api/emergency/logs
```

### Monitoring
```
POST   /api/monitoring/location
GET    /api/monitoring/user/{id}/location
POST   /api/monitoring/check-reroute
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "details": {/* optional details */}
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient role)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

---

## Rate Limits

Most endpoints: 40-60 requests per minute
Safety endpoints: 10-30 requests per minute
Demo/test endpoints: No limit

---

## Demo Commands

```bash
# Get JWT token (example)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test AI detection
curl -X POST http://localhost:5000/api/ai/detection/obstacles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentLocation": [73.8567, 18.5204]}'

# Test voice
curl -X POST http://localhost:5000/api/voice/recognize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "help me"}'

# Test safety
curl -X POST http://localhost:5000/api/safety/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Get admin insights
curl -X GET http://localhost:5000/api/admin/insights/accessibility \
  -H "Authorization: Bearer $TOKEN"
```

---

**For full documentation, see IMPLEMENTATION_GUIDE.md**
