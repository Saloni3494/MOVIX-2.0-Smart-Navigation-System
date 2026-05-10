import { useEffect, useState, useRef } from 'react';
import { CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Utility to calculate distance between two coordinates in meters
function distanceInMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// SIMULATION SPEED: meters per second
const SPEED_KMPH = 6;
const SIMULATION_SPEED_MPS = SPEED_KMPH * (1000 / 3600); // approx 1.66 m/s

export default function WheelchairSimulator({ routeLatLng, isPaused, onPositionUpdate }) {
  const map = useMap();
  const [currentPos, setCurrentPos] = useState(routeLatLng.length > 0 ? routeLatLng[0] : null);
  const positionRef = useRef(routeLatLng.length > 0 ? routeLatLng[0] : null);

  const routeIndexRef = useRef(0);
  const lastTimeRef = useRef(null);
  const hasNotifiedEndRef = useRef(false);

  // We only run simulation if we actually have points
  useEffect(() => {
    if (!routeLatLng || routeLatLng.length < 2) return;
    
    const routeId = routeLatLng[0].join(',') + '_' + routeLatLng[routeLatLng.length-1].join(',');
    const cachedStateStr = sessionStorage.getItem('simState_' + routeId);

    if (cachedStateStr) {
      const cached = JSON.parse(cachedStateStr);
      routeIndexRef.current = cached.index;
      positionRef.current = cached.pos;
      setCurrentPos(cached.pos);
    } else {
      routeIndexRef.current = 0;
      positionRef.current = routeLatLng[0];
      setCurrentPos(routeLatLng[0]);
    }
    
    hasNotifiedEndRef.current = false;
    lastTimeRef.current = null;
  }, [routeLatLng]);

  useEffect(() => {
    if (isPaused || routeLatLng.length < 2) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId;

    const animate = (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      
      let deltaMs = timestamp - lastTimeRef.current;
      // Cap deltaMs to 50ms to prevent massive jumps when switching tabs (which pauses requestAnimationFrame)
      deltaMs = Math.min(deltaMs, 50);
      lastTimeRef.current = timestamp;
      
      const idx = routeIndexRef.current;
      
      if (idx >= routeLatLng.length - 1) {
        // Reached destination
        if (!hasNotifiedEndRef.current) {
          hasNotifiedEndRef.current = true;
          onPositionUpdate({ position: positionRef.current, reachedEnd: true });
        }
        return;
      }

      const p1 = positionRef.current;
      const p2 = routeLatLng[idx + 1];
      
      // Calculate how far to move this frame
      const distanceToMove = SIMULATION_SPEED_MPS * (deltaMs / 1000);
      const distToNextNode = distanceInMeters(p1, p2);

      if (distToNextNode <= distanceToMove) {
        // We overshot or directly hit the node, snap to it and move to next stroke
        positionRef.current = p2;
        routeIndexRef.current = idx + 1;
      } else {
        // Interpolate position along the line
        const ratio = distanceToMove / distToNextNode;
        const newLat = p1[0] + (p2[0] - p1[0]) * ratio;
        const newLng = p1[1] + (p2[1] - p1[1]) * ratio;
        positionRef.current = [newLat, newLng];
      }
      
      setCurrentPos(positionRef.current);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [routeLatLng, isPaused]);

  // Sync position updates periodically back to parent component so it can trigger APIs, AI scans, etc.
  useEffect(() => {
    if (isPaused || !routeLatLng || routeLatLng.length < 2) return;
    
    const interval = setInterval(() => {
        if (positionRef.current && !hasNotifiedEndRef.current) {
            const routeId = routeLatLng[0].join(',') + '_' + routeLatLng[routeLatLng.length-1].join(',');
            sessionStorage.setItem('simState_' + routeId, JSON.stringify({
                index: routeIndexRef.current,
                pos: positionRef.current
            }));
            onPositionUpdate({ position: positionRef.current, reachedEnd: false, index: routeIndexRef.current });
        }
    }, 2000); // 2 second cadence checks
    
    return () => clearInterval(interval);
  }, [isPaused, onPositionUpdate, routeLatLng]);

  // Keep map continuously centered on the user during simulation
  useEffect(() => {
    if (currentPos && !isPaused) {
      // Smoothly pan without wiping out user interactions
      map.panTo(currentPos, { animate: true, duration: 0.5 });
    }
  }, [currentPos, isPaused, map]);

  if (!currentPos) return null;

  // Render our blue tracking dot with a neat halo using standard CircleMarker and HTML
  return (
    <>
      <CircleMarker
        center={currentPos}
        radius={15}
        pathOptions={{ color: 'transparent', fillColor: '#3b82f6', fillOpacity: 0.2 }}
        interactive={false}
      />
      <CircleMarker
        center={currentPos}
        radius={8}
        pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
        interactive={false}
      />
    </>
  );
}
