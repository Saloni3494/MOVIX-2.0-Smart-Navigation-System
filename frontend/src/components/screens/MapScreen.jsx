import { Search, Navigation, Verified, ShieldCheck, LocateFixed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import { fetchAccessibleRoutes, geocodeDestination } from '../../lib/api.js';

const DEFAULT_CENTER = [18.5204, 73.8567];

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center?.length === 2) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);

  return null;
}

function scoreToSafety(score) {
  if (score >= 85) {
    return 'Optimal';
  }
  if (score >= 70) {
    return 'Moderate';
  }
  return 'Caution';
}

function normalizeRouteOptions(data, destination) {
  const routes = [data?.safestPath, ...(Array.isArray(data?.alternativeRoutes) ? data.alternativeRoutes : [])].filter(Boolean);

  return routes.map((entry, index) => {
    const distanceM = entry?.route?.distance_m || 0;
    const durationS = entry?.route?.duration_s || 0;
    const score = Math.max(0, Math.min(100, Math.round(entry?.accessibilityScore || 70)));
    const distanceText = distanceM > 0 ? `${(distanceM / 1000).toFixed(1)} km` : 'N/A';

    return {
      id: `${index + 1}`,
      name: index === 0 ? 'Safest Route' : index === 1 ? 'Alternative Route A' : `Alternative Route ${index}`,
      destination,
      time: Math.max(1, Math.round(durationS / 60)),
      accessibility: score,
      safety: scoreToSafety(score),
      distance: distanceText,
      type: index === 0 ? 'recommended' : index === 1 ? 'fastest' : 'direct',
      route: entry?.route?.coordinates || [],
      score,
      encounteredHazards: Array.isArray(entry?.encounteredHazards) ? entry.encounteredHazards : [],
      ai_response: index === 0
        ? `Selected safest route after analyzing ${Array.isArray(entry?.encounteredHazards) ? entry.encounteredHazards.length : 0} hazards.`
        : 'Alternative route generated with accessibility constraints.',
    };
  });
}

export default function MapScreen({ onStartNavigation, authToken, user, onRequireAuth }) {
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [previewRoute, setPreviewRoute] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [lastSearchDestination, setLastSearchDestination] = useState('');

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported in this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => reject(new Error('Could not access your location. Please allow location access.')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  useEffect(() => {
    let ignore = false;

    const setInitialLocation = async () => {
      try {
        const location = await getUserLocation();
        if (!ignore) {
          setCurrentLocation(location);
          setLocationError('');
        }
      } catch (err) {
        if (!ignore) {
          setLocationError(err.message || 'Location unavailable.');
        }
      }
    };

    setInitialLocation();

    return () => {
      ignore = true;
    };
  }, []);

  const mapCenter = useMemo(() => {
    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lon];
    }
    return DEFAULT_CENTER;
  }, [currentLocation]);

  const previewLatLngs = useMemo(() => previewRoute.map((point) => [point[1], point[0]]), [previewRoute]);

  const hasRouteResults = routeOptions.length > 0 && Boolean(lastSearchDestination);
  const safestRoute = hasRouteResults ? routeOptions[0] : null;
  const alternativeRoutes = hasRouteResults ? routeOptions.slice(1) : [];

  const handleLocateMe = async () => {
    try {
      setLocationError('');
      const location = await getUserLocation();
      setCurrentLocation(location);
    } catch (err) {
      setLocationError(err.message || 'Unable to refresh location.');
    }
  };

  const handleFindRoutes = async () => {
    if (isLoading) {
      return;
    }

    if (!authToken) {
      onRequireAuth();
      setError('Please login first to request accessible routes.');
      return;
    }

    const finalDestination = destination.trim();
    if (!finalDestination) {
      setError('Please enter a destination first.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const location = currentLocation || (await getUserLocation());
      setCurrentLocation(location);

      const destinationGeo = await geocodeDestination(finalDestination);
      const data = await fetchAccessibleRoutes(
        {
          source: [location.lon, location.lat],
          destination: destinationGeo.coordinates,
        },
        authToken
      );

      const normalizedRoutes = normalizeRouteOptions(data, finalDestination);
      if (normalizedRoutes.length === 0) {
        throw new Error('No usable routes were returned for this destination.');
      }

      setLastSearchDestination(finalDestination);
      setRouteOptions(normalizedRoutes);
      setPreviewRoute(normalizedRoutes[0].route || []);
    } catch (err) {
      setRouteOptions([]);
      setPreviewRoute([]);
      setError(err.message || 'Failed to fetch routes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNavigationForRoute = (routeOption) => {
    if (!routeOption) {
      return;
    }

    onStartNavigation({
      destination: lastSearchDestination || destination.trim() || 'your destination',
      userLocation: currentLocation || user?.currentLocation,
      route: routeOption.route || [],
      score: typeof routeOption.score === 'number' ? routeOption.score : routeOption.accessibility,
      ai_response: routeOption.ai_response || 'Navigation started on selected route.',
      selectedRouteType: routeOption.type,
      route_options: routeOptions,
      encounteredHazards: routeOption.encounteredHazards || [],
    });
  };

  const handleSelectRoute = (routeOption) => {
    if (!routeOption) {
      return;
    }

    setPreviewRoute(routeOption.route || []);
    handleStartNavigationForRoute(routeOption);
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter} zoom={15} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={mapCenter} />

          {currentLocation && (
            <CircleMarker
              center={[currentLocation.lat, currentLocation.lon]}
              radius={9}
              pathOptions={{ color: '#005e53', fillColor: '#005e53', fillOpacity: 0.95 }}
            />
          )}

          {previewLatLngs.length > 1 && (
            <Polyline positions={previewLatLngs} pathOptions={{ color: '#00796b', weight: 6 }} />
          )}
        </MapContainer>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5" />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10">
        <div className="bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] rounded-3xl p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3">
          <Search className="text-primary ml-3 sm:ml-4 w-5 h-5 flex-shrink-0" />
          <input
            className="bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline w-full font-medium py-2 sm:py-3 outline-none text-sm sm:text-base"
            placeholder="Where to, today?"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFindRoutes();
              }
            }}
          />
          <button
            className="bg-primary-container p-2 rounded-2xl text-on-primary-container mr-1 sm:mr-2 hover:opacity-90 transition-all flex-shrink-0 disabled:opacity-60"
            onClick={handleFindRoutes}
            disabled={isLoading}
            aria-label="Find routes"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20">
          <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm font-semibold shadow-md">{error}</div>
        </div>
      )}

      {locationError && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20">
          <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm font-semibold shadow-md">
            {locationError}
          </div>
        </div>
      )}

      <div className="absolute top-20 sm:top-24 left-4 sm:left-6 z-10">
        <button
          onClick={handleLocateMe}
          className="bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-2xl shadow-sm text-primary hover:opacity-90 transition"
          aria-label="Locate me"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute top-20 sm:top-24 right-4 sm:right-6 z-10 flex flex-col gap-2">
        <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-outline">High Access</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-outline">Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-outline">Restricted</span>
          </div>
        </div>
      </div>

      {hasRouteResults && (
        <div className="absolute bottom-4 left-0 right-0 md:left-6 md:right-auto md:w-96 z-20 px-4 md:px-0 max-h-[50vh] sm:max-h-[70vh] overflow-y-auto no-scrollbar pb-6">
          {safestRoute && (
            <div className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-[0px_12px_32px_rgba(25,28,29,0.1)] p-6 flex flex-col gap-4 mb-4 border-2 border-primary/20">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <h2 className="text-primary font-black text-2xl tracking-tighter">{safestRoute.name}</h2>
                  <p className="text-outline text-sm font-medium">To {lastSearchDestination}</p>
                </div>
                <div className="text-right">
                  <span className="text-primary-container font-black text-3xl">{safestRoute.time}</span>
                  <span className="text-outline font-bold text-sm">min</span>
                </div>
              </div>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${Math.max(10, Math.min(100, safestRoute.accessibility))}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Accessibility</span>
                  <div className="flex items-center gap-2">
                    <Verified className="text-green-600 w-4 h-4" />
                    <span className="font-black text-on-surface">{safestRoute.accessibility}/100</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Safety Level</span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-secondary w-4 h-4" />
                    <span className="font-black text-on-surface">{safestRoute.safety}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleStartNavigationForRoute(safestRoute)}
                className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg active:scale-98 transition-all"
              >
                Start Navigation
              </button>
            </div>
          )}

          {alternativeRoutes.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="px-2 text-xs font-black uppercase tracking-[0.2em] text-outline">Alternative Routes</h3>
              {alternativeRoutes.map((route) => (
                <div
                  key={route.id}
                  className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 transition-all hover:bg-white active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface">{route.name}</h4>
                      <p className="text-xs text-outline font-medium">{route.time} min - {route.distance}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container">
                        <span className="text-[10px] font-bold text-on-surface-variant">{route.accessibility}/100</span>
                        <div className={`w-2 h-2 rounded-full ${route.type === 'fastest' ? 'bg-yellow-500' : 'bg-red-400'}`}></div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{route.safety}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectRoute(route)}
                    className="w-full bg-surface-container-high text-on-surface-variant py-2.5 rounded-xl font-bold text-sm hover:bg-secondary-container/20 hover:text-secondary transition-colors"
                  >
                    Select Route
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
