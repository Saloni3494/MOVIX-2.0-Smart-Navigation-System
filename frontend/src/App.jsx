import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import MapScreen from './components/screens/MapScreen.jsx';
import ModesScreen from './components/screens/ModesScreen.jsx';
import ReportScreen from './components/screens/ReportScreen.jsx';
import LiveNavScreen from './components/screens/LiveNavScreen.jsx';
import { cn } from './lib/utils.js';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [navigationData, setNavigationData] = useState(null);

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

  const handleSOS = () => {
    alert('SOS Emergency Signal Sent! Help is on the way.');
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
                <MapScreen onStartNavigation={handleStartNavigation} />
              )}
              {currentScreen === 'modes' && <ModesScreen />}
              {currentScreen === 'report' && <ReportScreen />}
              {currentScreen === 'live' && (
                <LiveNavScreen
                  navigationData={navigationData}
                  onStop={() => {
                    setNavigationData(null);
                    setCurrentScreen('map');
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
      />
    </div>
  );
}
