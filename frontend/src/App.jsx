import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import MapScreen from './components/screens/MapScreen.jsx';
import ModesScreen from './components/screens/ModesScreen.jsx';
import ReportScreen from './components/screens/ReportScreen.jsx';
import LiveNavScreen from './components/screens/LiveNavScreen.jsx';
import ProfileScreen from './components/screens/ProfileScreen.jsx';
import AdminScreen from './components/screens/AdminScreen.jsx';
import { cn } from './lib/utils.js';
import {
  loginUser,
  registerUser,
  triggerEmergency,
  updateLiveLocation,
} from './lib/api.js';
import { connectSocket, disconnectSocket } from './lib/socket.js';

function mapBackendRouteToNavigation(routePayload, fallbackUserLocation) {
  const safest = routePayload?.safestPath;
  if (!safest?.route?.coordinates) {
    return null;
  }

  return {
    destination: 'Updated Safe Route',
    userLocation: fallbackUserLocation,
    route: safest.route.coordinates,
    score: safest.accessibilityScore,
    ai_response: 'Route updated automatically to avoid an obstacle ahead.',
    selectedRouteType: 'recommended',
  };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [navigationData, setNavigationData] = useState(null);
  const [liveAlert, setLiveAlert] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('navability_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('navability_user');
    return raw ? JSON.parse(raw) : null;
  });

  const isAuthenticated = useMemo(() => Boolean(authToken && user), [authToken, user]);

  useEffect(() => {
    const checkWidth = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleScreenChange = (screen) => {
    setCurrentScreen(screen);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleStartNavigation = (navData) => {
    setNavigationData(navData);
    setCurrentScreen('live');
  };

  const handleRegister = async (payload) => {
    const result = await registerUser(payload);
    if (!result?.user?.email) {
      throw new Error('Registration failed');
    }
    const loginResult = await loginUser({ email: payload.email, password: payload.password });
    localStorage.setItem('navability_token', loginResult.token);
    localStorage.setItem('navability_user', JSON.stringify(loginResult.user));
    setAuthToken(loginResult.token);
    setUser(loginResult.user);
    setCurrentScreen('map');
  };

  const handleLogin = async (payload) => {
    const result = await loginUser(payload);
    localStorage.setItem('navability_token', result.token);
    localStorage.setItem('navability_user', JSON.stringify(result.user));
    setAuthToken(result.token);
    setUser(result.user);
    setCurrentScreen('map');
  };

  const handleLogout = () => {
    localStorage.removeItem('navability_token');
    localStorage.removeItem('navability_user');
    setAuthToken('');
    setUser(null);
    setNavigationData(null);
    disconnectSocket();
    setCurrentScreen('profile');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const socket = connectSocket(user);
    if (!socket) {
      return;
    }

    const onAlert = (payload) => setLiveAlert(payload);
    const onCaregiverAlert = (payload) => setLiveAlert(payload);
    const onRouteUpdate = (payload) => {
      setLiveAlert(payload);
      const updated = mapBackendRouteToNavigation(payload?.data, user?.currentLocation);
      if (updated) {
        setNavigationData(updated);
      }
    };

    socket.on('alert', onAlert);
    socket.on('caregiver_alert', onCaregiverAlert);
    socket.on('route_update', onRouteUpdate);

    return () => {
      socket.off('alert', onAlert);
      socket.off('caregiver_alert', onCaregiverAlert);
      socket.off('route_update', onRouteUpdate);
    };
  }, [isAuthenticated, user]);

  const handleSOS = () => {
    if (!isAuthenticated) {
      setCurrentScreen('profile');
      setLiveAlert({ type: 'AUTH_REQUIRED', message: 'Please login before sending emergency alerts.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude],
          };
          await updateLiveLocation({ location }, authToken);
          await triggerEmergency(
            {
              location,
              message: 'Emergency assistance requested by wheelchair user',
            },
            authToken
          );
          setLiveAlert({ type: 'EMERGENCY_ALERT', message: 'SOS sent to caregivers successfully.' });
        } catch (error) {
          setLiveAlert({ type: 'EMERGENCY_ERROR', message: error.message || 'Failed to send emergency alert.' });
        }
      },
      () => {
        setLiveAlert({ type: 'EMERGENCY_ERROR', message: 'Location permission is required for SOS alerts.' });
      }
    );
  };

  return (
    <div className="flex min-h-screen bg-surface overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <Sidebar
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
        isOpen={isSidebarOpen}
        user={user}
      />

      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out relative min-w-0",
          isSidebarOpen && !isMobile ? "pl-80" : "pl-0"
        )}
      >
        <TopBar
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSOS={handleSOS}
        />

        <AnimatePresence>
          {liveAlert && (
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-4 w-full max-w-2xl"
            >
              <div className="bg-error-container text-on-error-container border border-error/30 rounded-2xl px-4 py-3 shadow-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-xs font-black tracking-wider uppercase">{liveAlert.type || 'Alert'}</p>
                  <p className="text-sm font-semibold">{liveAlert.message || 'New real-time update received.'}</p>
                </div>
                <button
                  onClick={() => setLiveAlert(null)}
                  className="ml-auto text-xs font-bold opacity-70 hover:opacity-100"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 relative pt-16 pb-20 md:pb-0 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {currentScreen === 'map' && (
                <MapScreen
                  onStartNavigation={handleStartNavigation}
                  authToken={authToken}
                  user={user}
                  onRequireAuth={() => setCurrentScreen('profile')}
                />
              )}
              {currentScreen === 'modes' && (
                <ModesScreen authToken={authToken} isAuthenticated={isAuthenticated} onRequireAuth={() => setCurrentScreen('profile')} />
              )}
              {currentScreen === 'report' && (
                <ReportScreen
                  authToken={authToken}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={() => setCurrentScreen('profile')}
                />
              )}
              {currentScreen === 'live' && (
                <LiveNavScreen
                  navigationData={navigationData}
                  authToken={authToken}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={() => setCurrentScreen('profile')}
                  onReportIssue={() => setCurrentScreen('report')}
                  onStop={() => {
                    setNavigationData(null);
                    setCurrentScreen('map');
                  }}
                />
              )}
              {currentScreen === 'profile' && (
                <ProfileScreen
                  user={user}
                  onLogin={handleLogin}
                  onRegister={handleRegister}
                  onLogout={handleLogout}
                  liveAlert={liveAlert}
                />
              )}
              {currentScreen === 'admin' && (
                <AdminScreen
                  authToken={authToken}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={() => setCurrentScreen('profile')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
        user={user}
      />
    </div>
  );
}
