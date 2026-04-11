import {
  AlertTriangle,
  ArrowRight,
  BatteryMedium,
  CornerUpLeft,
  CornerUpRight,
  Mic,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Flag,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import { checkAndReroute, updateLiveLocation, detectObstacles, submitObstacleReport } from '../../lib/api.js';
import WheelchairSimulator from './WheelchairSimulator.jsx';

const DEFAULT_CENTER = [18.5204, 73.8567];

function FitRouteBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
      return;
    }

    map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceInMeters(a, b) {
  const earthRadius = 6371000;
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const deltaLat = toRadians(b[0] - a[0]);
  const deltaLon = toRadians(b[1] - a[1]);

  const h =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(distance) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }
  return `${Math.max(1, Math.round(distance))} m`;
}

function heading(from, to) {
  const fromLat = toRadians(from[0]);
  const fromLon = toRadians(from[1]);
  const toLat = toRadians(to[0]);
  const toLon = toRadians(to[1]);

  const y = Math.sin(toLon - fromLon) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLon - fromLon);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function turnInstruction(previous, current, next) {
  const inHeading = heading(previous, current);
  const outHeading = heading(current, next);
  let delta = outHeading - inHeading;

  while (delta > 180) {
    delta -= 360;
  }
  while (delta < -180) {
    delta += 360;
  }

  const absDelta = Math.abs(delta);

  if (absDelta < 20) {
    return { type: 'straight', text: 'Continue straight' };
  }
  if (absDelta < 60) {
    return {
      type: delta > 0 ? 'slight-right' : 'slight-left',
      text: delta > 0 ? 'Keep slightly right' : 'Keep slightly left',
    };
  }
  if (absDelta < 130) {
    return { type: delta > 0 ? 'right' : 'left', text: delta > 0 ? 'Turn right' : 'Turn left' };
  }
  return { type: 'uturn', text: 'Make a U-turn when possible' };
}

function estimateEtaMinutes(distanceMetersValue) {
  const avgWalkingSpeedMps = 1.3;
  return Math.max(1, Math.round(distanceMetersValue / avgWalkingSpeedMps / 60));
}

function getInstructionIcon(type) {
  if (type === 'left' || type === 'slight-left') {
    return CornerUpLeft;
  }
  if (type === 'right' || type === 'slight-right') {
    return CornerUpRight;
  }
  return ArrowRight;
}

function buildGuidanceSteps(routeLatLng, destination) {
  if (!routeLatLng || routeLatLng.length < 2) {
    return [
      {
        id: 'step-1',
        type: 'straight',
        instruction: 'Head to your destination',
        distanceMeters: 0,
        distanceText: '0 m',
      },
    ];
  }

  const steps = [];
  const maxIntermediates = 5;
  const stride = Math.max(1, Math.floor((routeLatLng.length - 1) / maxIntermediates));

  for (let index = stride; index < routeLatLng.length - 1; index += stride) {
    const previous = routeLatLng[Math.max(0, index - stride)];
    const current = routeLatLng[index];
    const next = routeLatLng[Math.min(routeLatLng.length - 1, index + stride)];
    const instruction = turnInstruction(previous, current, next);
    const segmentDistance = distanceInMeters(current, next);

    steps.push({
      id: `step-${steps.length + 1}`,
      type: instruction.type,
      instruction: instruction.text,
      distanceMeters: segmentDistance,
      distanceText: formatDistance(segmentDistance),
    });
  }

  const lastPoint = routeLatLng[routeLatLng.length - 1];
  const preLastPoint = routeLatLng[Math.max(0, routeLatLng.length - 2)];
  const arrivalDistance = distanceInMeters(preLastPoint, lastPoint);

  steps.push({
    id: `step-${steps.length + 1}`,
    type: 'arrival',
    instruction: `You will arrive at ${destination}`,
    distanceMeters: arrivalDistance,
    distanceText: formatDistance(arrivalDistance),
  });

  return steps;
}

export default function LiveNavScreen({ onStop, navigationData, authToken, isAuthenticated, onRequireAuth, onReportIssue }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [rerouteStatus, setRerouteStatus] = useState('');
  const [aiReportStatus, setAiReportStatus] = useState('');

  const safetyScore =
    typeof navigationData?.score === 'number' ? Math.max(0, Math.min(100, Math.round(navigationData.score))) : 98;
  const aiSummary = typeof navigationData?.ai_response === 'string' ? navigationData.ai_response : '';
  const destination = navigationData?.destination || 'your destination';

  const routeLatLng = useMemo(
    () => (Array.isArray(navigationData?.route) ? navigationData.route.map((point) => [point[1], point[0]]) : []),
    [navigationData?.route]
  );

  const guidanceSteps = useMemo(() => buildGuidanceSteps(routeLatLng, destination), [routeLatLng, destination]);

  const totalDistanceMeters = useMemo(() => {
    if (routeLatLng.length < 2) {
      return 0;
    }

    let total = 0;
    for (let i = 1; i < routeLatLng.length; i += 1) {
      total += distanceInMeters(routeLatLng[i - 1], routeLatLng[i]);
    }
    return total;
  }, [routeLatLng]);

  const remainingDistanceMeters = useMemo(() => {
    if (!guidanceSteps.length) {
      return 0;
    }

    return guidanceSteps.slice(currentStepIndex).reduce((sum, step) => sum + step.distanceMeters, 0);
  }, [currentStepIndex, guidanceSteps]);

  const etaMinutes = estimateEtaMinutes(remainingDistanceMeters || totalDistanceMeters);
  const currentStep = guidanceSteps[Math.min(currentStepIndex, guidanceSteps.length - 1)] || guidanceSteps[0];
  const nextStep = guidanceSteps[Math.min(currentStepIndex + 1, guidanceSteps.length - 1)] || null;

  const startLatLng = useMemo(() => {
    if (navigationData?.userLocation?.lat && navigationData?.userLocation?.lon) {
      return [navigationData.userLocation.lat, navigationData.userLocation.lon];
    }
    return routeLatLng[0] || null;
  }, [navigationData?.userLocation, routeLatLng]);

  const destinationLatLng = routeLatLng.length > 0 ? routeLatLng[routeLatLng.length - 1] : null;
  const mapCenter = startLatLng || DEFAULT_CENTER;

  // Track the actual interpolated user point from the simulator instead of jumping
  const [userPointForTracking, setUserPointForTracking] = useState(startLatLng || DEFAULT_CENTER);

  const destinationPointForTracking = useMemo(() => {
    if (!destinationLatLng) return null;
    return [destinationLatLng[1], destinationLatLng[0]];
  }, [destinationLatLng]);

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPaused(false);
  }, [navigationData?.route, navigationData?.destination]);

  const handleSimulatorUpdate = async (evt) => {
    if (evt.position) setUserPointForTracking(evt.position);
    if (evt.index !== undefined) {
      const calculatedStepIndex = Math.min(Math.floor(evt.index / Math.max(1, Math.floor(routeLatLng.length / guidanceSteps.length))), guidanceSteps.length - 1);
      if (calculatedStepIndex !== currentStepIndex) setCurrentStepIndex(calculatedStepIndex);
    }
    if (evt.reachedEnd) {
      setIsPaused(true);
      return;
    }

    // AI periodic detection checks
    if (isAuthenticated && authToken && evt.position) {
      try {
        const data = await detectObstacles({ currentLocation: evt.position, captureFrames: true }, authToken);
        if (data?.obstacles && data.obstacles.length > 0) {
          const obs = data.obstacles[0];
          await submitObstacleReport({
            layer: obs.type || 'temporary',
            severity: obs.severity || 5,
            description: `Auto-reported ${obs.type} by AI detector.`,
            coordinates: evt.position,
            imageUrl: null
          }, authToken);
          setAiReportStatus(`AI automated report submitted for ${obs.type}!`);
          setTimeout(() => setAiReportStatus(''), 8000);
        }
      } catch (e) {
        // ignore errors to avoid spamming the user
      }
    }
  };

  useEffect(() => {
    if (!voiceEnabled || !currentStep || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${currentStep.instruction} in ${currentStep.distanceText}`);
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentStep, voiceEnabled]);

  useEffect(() => {
    if (!isAuthenticated || !authToken || !userPointForTracking || !destinationPointForTracking || routeLatLng.length < 2) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        await updateLiveLocation(
          {
            location: { type: 'Point', coordinates: userPointForTracking },
          },
          authToken
        );

        const reroute = await checkAndReroute(
          {
            userLocation: userPointForTracking,
            destination: destinationPointForTracking,
            currentRoute: routeLatLng.map((point) => [point[1], point[0]]),
          },
          authToken
        );

        if (reroute?.rerouted) {
          setRerouteStatus('Hazard detected ahead. Backend generated a safer route.');
        } else {
          setRerouteStatus('Route remains safe. Live monitoring active.');
        }
      } catch (error) {
        setRerouteStatus(error.message || 'Live reroute check failed temporarily.');
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [authToken, destinationPointForTracking, isAuthenticated, routeLatLng, userPointForTracking]);

  const InstructionIcon = getInstructionIcon(currentStep?.type);
  const progressPercent = guidanceSteps.length > 1 ? (currentStepIndex / (guidanceSteps.length - 1)) * 100 : 0;

  return (
    <div className="h-full w-full flex flex-col bg-surface overflow-hidden">
      {/* Top Half: Dedicated Map Layer */}
      <div className="relative h-[45vh] sm:h-[50vh] w-full shrink-0 border-b border-outline-variant/30">
        <MapContainer center={mapCenter} zoom={16} className="h-full w-full" zoomControl={false} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeLatLng.length > 1 && (
            <Polyline positions={routeLatLng} pathOptions={{ color: '#3b82f6', weight: 8, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
          )}

          <WheelchairSimulator 
            routeLatLng={routeLatLng} 
            isPaused={isPaused} 
            onPositionUpdate={handleSimulatorUpdate} 
          />

          {destinationLatLng && (
            <CircleMarker
              center={destinationLatLng}
              radius={8}
              pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.95 }}
            />
          )}

          <div className="absolute right-4 top-4 z-[400]">
             <button
                onClick={onReportIssue}
                className="w-12 h-12 rounded-full bg-error text-on-error hover:opacity-90 shadow-xl flex items-center justify-center transition-all cursor-pointer"
                aria-label="Report manually"
              >
                <Flag className="w-5 h-5" />
              </button>
          </div>
        </MapContainer>
      </div>

      {/* Bottom Half: Non-overlapping scrollable content */}
      <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 flex flex-col gap-4">
            
        {/* Dynamic Headers & Alerts */}
        {aiReportStatus && (
          <div className="w-full max-w-4xl mx-auto bg-[#10b981] text-white rounded-xl shadow border border-[#059669] p-3 flex items-center gap-3 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-bold tracking-wide">{aiReportStatus}</p>
          </div>
        )}

        {/* Turn-by-Turn Header */}
        <div className="w-full max-w-4xl mx-auto bg-[#1a73e8] text-white rounded-3xl shadow-lg px-5 py-5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 inset-x-0 h-1 bg-white/20">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 shadow-inner flex items-center justify-center shrink-0">
              <InstructionIcon className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-0.5">Next step {currentStepIndex + 1}/{guidanceSteps.length}</p>
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight text-white/100 truncate">{currentStep?.instruction}</h2>
              <p className="text-sm md:text-[15px] font-medium text-white/90 mt-0.5">In {currentStep?.distanceText} — ETA {etaMinutes} min</p>
            </div>
            <button
              onClick={() => setVoiceEnabled((value) => !value)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center shadow cursor-pointer"
              aria-label="Toggle voice guidance"
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {rerouteStatus && (
          <div className="w-full max-w-4xl mx-auto bg-primary-container text-on-primary-container rounded-2xl p-3 text-sm font-semibold border border-primary/20 shadow-lg shrink-0">
            {rerouteStatus}
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="w-full max-w-4xl mx-auto bg-error-container text-on-error-container rounded-2xl p-3 text-sm font-semibold flex items-center justify-between gap-3 shadow-lg shrink-0">
            Login required for live auto-rerouting.
            <button onClick={onRequireAuth} className="bg-error text-on-error px-3 py-1.5 rounded-xl text-xs font-bold shadow cursor-pointer">Login</button>
          </div>
        )}

        {/* Assistant Information */}
        {aiSummary && (
          <div className="w-full max-w-4xl mx-auto glass-panel !bg-surface-container-low/95 border border-outline-variant/30 text-on-surface shadow p-4 rounded-[1.5rem] flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide uppercase text-outline">Assistant Detection</p>
              <p className="text-xs sm:text-sm font-medium opacity-90">{aiSummary}</p>
            </div>
          </div>
        )}

        {/* Master Details & Controls Footer */}
        <div className="w-full max-w-4xl mx-auto mt-2 glass-panel border border-outline-variant/50 shadow-md rounded-[2rem] p-5 flex flex-col gap-5 shrink-0 mb-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-outline mb-1">Metrics</p>
              <div className="flex items-end gap-1">
                <p className="text-4xl font-black leading-none">{formatDistance(remainingDistanceMeters || totalDistanceMeters)}</p>
                <p className="text-base font-semibold text-outline pb-1">left</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-outline mb-1">Safety</p>
              <p className="text-4xl font-black text-primary leading-none">{safetyScore}%</p>
            </div>
          </div>

          <div className="h-px w-full bg-outline-variant/30"></div>

          <div className="flex items-center justify-between">
              <button
                onClick={onStop}
                className="h-14 px-6 rounded-full bg-error-container text-on-error-container font-extrabold flex items-center gap-2 hover:bg-error hover:text-on-error transition-colors shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                Exit Nav
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPaused(true)}
                  className="w-14 h-14 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-variant transition shadow-inner cursor-pointer"
                >
                  <Pause className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    if (currentStepIndex >= guidanceSteps.length - 1) setCurrentStepIndex(0);
                    setIsPaused(false);
                  }}
                  className="w-16 h-16 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Navigation className="w-7 h-7" />
                </button>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}
