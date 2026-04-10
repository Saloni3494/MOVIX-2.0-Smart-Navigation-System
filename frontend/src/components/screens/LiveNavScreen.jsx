import { CornerUpRight, AlertTriangle, Gauge, Mic, Shield, BatteryMedium, Play, Pause, RotateCcw, Gamepad2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
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

export default function LiveNavScreen({ onStop, navigationData }) {
  const routePoints = Array.isArray(navigationData?.route) ? navigationData.route.length : 0;
  const safetyScore = typeof navigationData?.score === 'number' ? Math.max(0, Math.min(100, Math.round(navigationData.score))) : 98;
  const aiSummary = typeof navigationData?.ai_response === 'string' ? navigationData.ai_response : '';
  const destination = navigationData?.destination || 'your destination';
  const routeLatLng = useMemo(
    () => (Array.isArray(navigationData?.route) ? navigationData.route.map((point) => [point[1], point[0]]) : []),
    [navigationData?.route]
  );

  const startLatLng = useMemo(() => {
    if (navigationData?.userLocation?.lat && navigationData?.userLocation?.lon) {
      return [navigationData.userLocation.lat, navigationData.userLocation.lon];
    }
    return routeLatLng[0] || null;
  }, [navigationData?.userLocation, routeLatLng]);

  const destinationLatLng = routeLatLng.length > 0 ? routeLatLng[routeLatLng.length - 1] : null;
  const mapCenter = startLatLng || DEFAULT_CENTER;

  return (
    <div className="h-full w-full relative">
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter}
          zoom={15}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeLatLng.length > 1 && (
            <Polyline positions={routeLatLng} pathOptions={{ color: '#005e53', weight: 7, opacity: 0.9 }} />
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

        <div className="pointer-events-none absolute inset-0 bg-black/10" />
      </div>

      {/* Overlays */}
      <div className="relative z-10 h-full w-full p-4 flex flex-col pointer-events-none overflow-y-auto no-scrollbar">
        {/* Turn-by-Turn Card */}
        <div className="w-full max-w-2xl mx-auto pointer-events-auto">
          <div className="glass-panel rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center text-on-primary flex-shrink-0">
              <CornerUpRight className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-on-surface leading-tight tracking-tight truncate sm:whitespace-normal">Heading to {destination}</h2>
              <p className="text-outline font-medium text-xs sm:text-base">{routePoints > 0 ? `${routePoints} route points loaded` : 'Using accessibility-first guidance'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl sm:text-3xl font-black text-primary tracking-tighter">{safetyScore}%</p>
              <p className="text-[10px] sm:text-sm font-medium text-outline">safety score</p>
            </div>
          </div>
        </div>

        {/* Safety Alert */}
        <div className="mt-4 w-full max-w-md mx-auto pointer-events-auto">
          <div className="bg-error-container/90 backdrop-blur-md text-on-error-container p-3 sm:p-4 rounded-2xl shadow-lg border-l-4 border-error flex items-center gap-3 sm:gap-4">
            <AlertTriangle className="text-error w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm sm:text-base">Obstacle Detected ahead</p>
              <p className="text-xs sm:text-sm opacity-90">{aiSummary || 'Rerouting to accessible ramp...'}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 pointer-events-auto pb-4 pt-8">
          {/* Speed */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-outline text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Current Speed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-on-surface">4.2</span>
                <span className="text-base sm:text-lg font-medium text-outline">km/h</span>
              </div>
            </div>
            <div className="h-14 w-14 sm:h-16 sm:w-16 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" fill="none" r="28" stroke="#e1e3e3" strokeWidth="4" />
                <circle
                  cx="32" cy="32" fill="none" r="28" stroke="#005e53"
                  strokeDasharray="176" strokeDashoffset={176 - (176 * safetyScore) / 100} strokeWidth="4"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Gauge className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl flex items-center justify-around shadow-sm">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase">Voice On</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-secondary uppercase">Auto-Stop</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                <BatteryMedium className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-tertiary uppercase">Battery</span>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl flex items-center justify-around shadow-sm">
            <button className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-on-primary flex items-center justify-center hover:shadow-lg active:scale-90 transition-all">
              <Play className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:shadow-lg active:scale-90 transition-all">
              <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={onStop}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-error text-on-error flex items-center justify-center hover:shadow-lg active:scale-90 transition-all"
            >
              <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
