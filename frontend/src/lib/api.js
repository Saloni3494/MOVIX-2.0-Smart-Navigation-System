const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data;
}

export async function registerUser(payload) {
  return request('/auth/register', { method: 'POST', body: payload });
}

export async function loginUser(payload) {
  return request('/auth/login', { method: 'POST', body: payload });
}

export async function fetchAccessibleRoutes(payload, token) {
  return request('/routes/accessible', { method: 'POST', body: payload, token });
}

export async function submitObstacleReport(payload, token) {
  return request('/reports', { method: 'POST', body: payload, token });
}

export async function triggerEmergency(payload, token) {
  return request('/emergency', { method: 'POST', body: payload, token });
}

export async function updateLiveLocation(payload, token) {
  return request('/monitoring/location', { method: 'POST', body: payload, token });
}

export async function checkAndReroute(payload, token) {
  return request('/monitoring/track', { method: 'POST', body: payload, token });
}

export async function fetchHardwareSnapshot(token) {
  return request('/hardware/snapshot', { method: 'GET', token });
}

export async function detectObstacles(payload, token) {
  return request('/api/ai/detection/obstacles', { method: 'POST', body: payload, token });
}

export async function recognizeVoiceCommand(payload, token) {
  return request('/api/voice/recognize', { method: 'POST', body: payload, token });
}

export async function processVoiceInteraction(payload, token) {
  return request('/api/voice/interaction', { method: 'POST', body: payload, token });
}

export async function performSafetyCheck(token) {
  return request('/api/safety/check', { method: 'POST', body: {}, token });
}

export async function getInactivityStatus(token) {
  return request('/api/safety/inactivity/status', { method: 'GET', token });
}

export async function recordUserActivity(payload, token) {
  return request('/api/safety/activity', { method: 'POST', body: payload, token });
}

export async function triggerEmergencyBrake(payload, token) {
  return request('/api/safety/brake/emergency', { method: 'POST', body: payload, token });
}

export async function releaseEmergencyBrake(token) {
  return request('/api/safety/brake/release', { method: 'POST', body: {}, token });
}

export async function getAdminAccessibilityInsights(token) {
  return request('/api/admin/insights/accessibility', { method: 'GET', token });
}

export async function getAdminSystemInsights(token) {
  return request('/api/admin/insights/system', { method: 'GET', token });
}

export async function geocodeDestination(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'NavAbility-Frontend' },
  });

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Destination not found. Try a more specific location.');
  }

  const first = results[0];
  return {
    name: first.display_name,
    coordinates: [Number(first.lon), Number(first.lat)],
  };
}

export { API_BASE_URL };
