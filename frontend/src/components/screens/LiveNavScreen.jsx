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
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';

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

export default function LiveNavScreen({ onStop, navigationData }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPaused(false);
  }, [navigationData?.route, navigationData?.destination]);

  useEffect(() => {
    if (isPaused || guidanceSteps.length <= 1 || currentStepIndex >= guidanceSteps.length - 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentStepIndex((index) => Math.min(index + 1, guidanceSteps.length - 1));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [currentStepIndex, guidanceSteps.length, isPaused]);

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

  const InstructionIcon = getInstructionIcon(currentStep?.type);
  const progressPercent = guidanceSteps.length > 1 ? (currentStepIndex / (guidanceSteps.length - 1)) * 100 : 0;

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar bg-surface">
      <div className="relative h-[42vh] min-h-[260px] sm:h-[48vh] w-full">
        <MapContainer center={mapCenter} zoom={15} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeLatLng.length > 1 && (
            <Polyline positions={routeLatLng} pathOptions={{ color: '#1877f2', weight: 8, opacity: 0.9 }} />
          )}

          {startLatLng && (
            <CircleMarker
              center={startLatLng}
              radius={8}
              pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.95 }}
            />
          )}

          {destinationLatLng && (
            <CircleMarker
              center={destinationLatLng}
              radius={8}
              pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.95 }}
            />
          )}

          <FitRouteBounds points={routeLatLng} />
        </MapContainer>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20" />
      </div>

      <div className="w-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-[#1a73e8] text-white rounded-2xl shadow-xl px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <InstructionIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/80">Next instruction</p>
                <h2 className="text-lg sm:text-2xl font-extrabold leading-tight truncate sm:whitespace-normal">{currentStep?.instruction}</h2>
                <p className="text-sm sm:text-base text-white/90">In {currentStep?.distanceText} - ETA {etaMinutes} min</p>
              </div>
              <button
                onClick={() => setVoiceEnabled((value) => !value)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                aria-label="Toggle voice guidance"
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/25 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <div className="glass-panel rounded-2xl shadow-lg p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-outline">Assistant says</p>
              <p className="text-sm sm:text-base font-semibold text-on-surface truncate sm:whitespace-normal">
                {aiSummary || `Continue on the safest accessible route to ${destination}.`}
              </p>
              {nextStep && <p className="text-xs sm:text-sm text-outline mt-1">Then: {nextStep.instruction}</p>}
            </div>
            <div className="flex items-center gap-2 text-outline flex-shrink-0">
              <Navigation className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-bold">{formatDistance(remainingDistanceMeters || totalDistanceMeters)} left</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-panel p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-outline">Live status</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-black text-on-surface">4.2</p>
                <p className="text-sm text-outline font-medium">km/h</p>
              </div>
              <div className="text-right">
                <p className="text-2xl sm:text-3xl font-black text-primary">{safetyScore}%</p>
                <p className="text-[10px] sm:text-xs text-outline font-semibold uppercase">Safety</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-sm flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-primary uppercase">Voice</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-secondary uppercase">Safe Mode</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                <BatteryMedium className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-tertiary uppercase">Battery</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-outline mb-2">Navigation controls</p>
            <div className="flex items-center justify-around">
              <button
                onClick={() => {
                  if (currentStepIndex >= guidanceSteps.length - 1) {
                    setCurrentStepIndex(0);
                  }
                  setIsPaused(false);
                }}
                className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:shadow-lg active:scale-90 transition-all"
                aria-label="Resume navigation"
              >
                <Play className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsPaused(true)}
                className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:shadow-lg active:scale-90 transition-all"
                aria-label="Pause navigation"
              >
                <Pause className="w-6 h-6" />
              </button>
              <button
                onClick={onStop}
                className="w-12 h-12 rounded-full bg-error text-on-error flex items-center justify-center hover:shadow-lg active:scale-90 transition-all"
                aria-label="Stop navigation"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto">
          <div className="glass-panel rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-outline">Step by step</p>
              <p className="text-xs sm:text-sm font-semibold text-outline">{currentStepIndex + 1}/{guidanceSteps.length}</p>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {guidanceSteps.map((step, index) => {
                const StepIcon = getInstructionIcon(step.type);
                const isActive = index === currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`rounded-xl p-3 border transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-outline-variant/40 bg-surface-container-lowest/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StepIcon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-outline'}`} />
                      <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-on-surface'}`}>{step.instruction}</p>
                    </div>
                    <p className="text-xs text-outline mt-1">in {step.distanceText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto pb-3 sm:pb-4">
          <div className="bg-error-container/90 backdrop-blur-md text-on-error-container p-3 sm:p-4 rounded-2xl shadow-lg border-l-4 border-error flex items-center gap-3 sm:gap-4">
            <AlertTriangle className="text-error w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm sm:text-base">Obstacle intelligence</p>
              <p className="text-xs sm:text-sm opacity-90">
                {aiSummary || 'No immediate hazard flagged. Assistant will announce updates if route conditions change.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
