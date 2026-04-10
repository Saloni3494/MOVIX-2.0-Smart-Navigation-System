import { Search, Navigation, Verified, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const routes = [
  {
    id: '1',
    name: 'Safest Route',
    destination: 'To Central Station',
    time: 12,
    accessibility: 98,
    safety: 'Optimal',
    distance: '1.2 miles',
    type: 'recommended'
  },
  {
    id: '2',
    name: 'Fastest Route',
    destination: 'To Central Station',
    time: 9,
    accessibility: 75,
    safety: 'Moderate',
    distance: '0.8 miles',
    type: 'fastest'
  },
  {
    id: '3',
    name: 'Direct Route',
    destination: 'To Central Station',
    time: 10,
    accessibility: 68,
    safety: 'Caution',
    distance: '0.7 miles',
    type: 'direct'
  }
];

export default function MapScreen({ onStartNavigation }) {
  const [destination, setDestination] = useState('Central Station');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleStart = async () => {
    if (isLoading) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const location = await getUserLocation();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      const response = await fetch(`${apiBaseUrl}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim() || 'Central Station',
          userLocation: [location.lon, location.lat],
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to create route right now.');
      }

      onStartNavigation({
        destination: destination.trim() || 'Central Station',
        userLocation: location,
        ...data,
      });
    } catch (err) {
      setError(err.message || 'Failed to start navigation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <img
          alt="City Map"
          className="w-full h-full object-cover brightness-90 contrast-110"
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1920"
          referrerPolicy="no-referrer"
        />
        <div className="heatmap-overlay absolute inset-0 mix-blend-multiply opacity-60"></div>
      </div>

      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10">
        <div className="bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] rounded-3xl p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3">
          <Search className="text-primary ml-3 sm:ml-4 w-5 h-5 flex-shrink-0" />
          <input
            className="bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline w-full font-medium py-2 sm:py-3 outline-none text-sm sm:text-base"
            placeholder="Where to, today?"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <button
            className="bg-primary-container p-2 rounded-2xl text-on-primary-container mr-1 sm:mr-2 hover:opacity-90 transition-all flex-shrink-0 disabled:opacity-60"
            onClick={handleStart}
            disabled={isLoading}
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20">
          <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm font-semibold shadow-md">
            {error}
          </div>
        </div>
      )}

      {/* Legend */}
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

      {/* Route Options Panel */}
      <div className="absolute bottom-4 left-0 right-0 md:left-6 md:right-auto md:w-96 z-20 px-4 md:px-0 max-h-[50vh] sm:max-h-[70vh] overflow-y-auto no-scrollbar pb-6">
        <div className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-[0px_12px_32px_rgba(25,28,29,0.1)] p-6 flex flex-col gap-4 mb-4 border-2 border-primary/20">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <h2 className="text-primary font-black text-2xl tracking-tighter">Safest Route</h2>
              <p className="text-outline text-sm font-medium">To Central Station</p>
            </div>
            <div className="text-right">
              <span className="text-primary-container font-black text-3xl">12</span>
              <span className="text-outline font-bold text-sm">min</span>
            </div>
          </div>
          <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-gradient-to-r from-primary to-secondary rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Accessibility</span>
              <div className="flex items-center gap-2">
                <Verified className="text-green-600 w-4 h-4" />
                <span className="font-black text-on-surface">98/100</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Safety Level</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-secondary w-4 h-4" />
                <span className="font-black text-on-surface">Optimal</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Finding best route...' : 'Start Navigation'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="px-2 text-xs font-black uppercase tracking-[0.2em] text-outline">Alternative Routes</h3>
          {routes.slice(1).map((route) => (
            <div key={route.id} className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 transition-all hover:bg-white active:scale-[0.98]">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-on-surface">{route.name}</h4>
                  <p className="text-xs text-outline font-medium">{route.time} min • {route.distance}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container">
                    <span className="text-[10px] font-bold text-on-surface-variant">{route.accessibility}/100</span>
                    <div className={`w-2 h-2 rounded-full ${route.type === 'fastest' ? 'bg-yellow-500' : 'bg-red-400'}`}></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{route.safety}</span>
                </div>
              </div>
              <button className="w-full bg-surface-container-high text-on-surface-variant py-2.5 rounded-xl font-bold text-sm hover:bg-secondary-container/20 hover:text-secondary transition-colors">
                Select Route
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
