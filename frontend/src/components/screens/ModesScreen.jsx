import { Bolt, Gamepad2, Mic, Cpu, Brain, ChevronUp, ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useState } from 'react';

export default function ModesScreen() {
  const [activeMode, setActiveMode] = useState('remote');

  const modes = [
    { id: 'remote', label: 'Remote', icon: Gamepad2 },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'auto', label: 'Automatic', icon: Cpu },
    { id: 'emg', label: 'EMG', icon: Brain },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="lg:col-span-8 bg-surface-container-low rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-outline-variant/10 gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-primary font-headline text-xl sm:text-2xl font-bold tracking-tight">System Status</h2>
            <p className="text-on-surface-variant font-medium text-sm sm:text-base">All components operating normally</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">94%</span>
              <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-tighter">Battery</span>
            </div>
            <div className="w-20 sm:w-24 h-10 sm:h-12 bg-surface-container-highest rounded-2xl relative overflow-hidden flex items-end">
              <div className="w-full bg-gradient-to-t from-primary to-primary-fixed-dim h-[94%] rounded-t-lg transition-all duration-500"></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-primary text-on-primary rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-[0px_12px_32px_rgba(0,94,83,0.15)] bg-gradient-to-br from-primary to-primary-container min-h-[160px]">
          <div className="flex justify-between items-start">
            <Bolt className="w-7 h-7 sm:w-8 sm:h-8" />
            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Live</div>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-80 font-medium">Drive Range</p>
            <p className="text-3xl sm:text-4xl font-black tracking-tighter">18.4 <span className="text-base sm:text-lg opacity-60">km</span></p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <section className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-on-surface font-headline">Control Strategy</h3>
          <span className="text-xs sm:text-sm font-medium text-outline">Switching takes 0.5s</span>
        </div>
        <div className="bg-surface-container-low p-1.5 sm:p-2 rounded-3xl sm:rounded-[2rem] grid grid-cols-2 lg:grid-cols-4 gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "py-3 sm:py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 font-bold text-sm sm:text-base",
                activeMode === mode.id
                  ? "bg-primary text-on-primary shadow-lg scale-[1.02] sm:scale-105"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <mode.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {mode.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Interaction Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* Voice Control Mode */}
        {activeMode === 'voice' && (
          <div className="lg:col-span-2 bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-md border border-primary/10 min-h-[400px] sm:min-h-[500px]">
            <div className="mb-2 sm:mb-3">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">Voice Recognition Active</span>
            </div>
            <div className="relative mb-8 sm:mb-12 mt-6 sm:mt-8">
              <div className="absolute inset-0 bg-primary/15 rounded-full scale-[2] sm:scale-[2.2] blur-2xl animate-pulse"></div>
              <div className="absolute inset-0 bg-primary/8 rounded-full scale-[2.8] sm:scale-[3.2] blur-3xl"></div>
              <button className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim text-on-primary flex items-center justify-center shadow-2xl relative z-10 hover:scale-105 active:scale-95 transition-transform duration-200 border-2 border-primary-fixed-dim">
                <Mic className="w-12 h-12 sm:w-16 sm:h-16" />
              </button>
            </div>
            <h4 className="text-3xl sm:text-4xl font-black text-on-surface mb-3 font-headline">Listening...</h4>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg sm:text-xl font-medium mb-2">"Take me to the dining room"</p>
            <p className="text-xs sm:text-sm text-on-surface-variant/60 font-medium">Confidence: 94%</p>
            <div className="mt-10 sm:mt-14 w-full flex justify-center gap-2 sm:gap-3 px-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-primary to-primary-fixed-dim rounded-full flex-1"
                  style={{
                    height: `${[20, 35, 60, 45, 75, 40, 55, 30][i]}px`,
                    animationDelay: `${i * 0.08}s`,
                    animation: `soundWave 0.4s ease-in-out infinite`
                  }}
                ></div>
              ))}
            </div>
            <style>{`
              @keyframes soundWave {
                0%, 100% { opacity: 0.4; transform: scaleY(0.6); }
                50% { opacity: 1; transform: scaleY(1); }
              }
            `}</style>
          </div>
        )}

        {/* Remote Control Mode */}
        {activeMode === 'remote' && (
          <div className="lg:col-span-2 bg-gradient-to-br from-surface-container-low to-surface-container-high rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 flex flex-col gap-10 shadow-md border border-outline-variant/20 min-h-[500px] sm:min-h-[600px]">
            {/* Control Pad Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-lg sm:text-xl font-bold text-on-surface font-headline">Directional Control</h5>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Swipe or tap to navigate</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center py-8">
                <div className="relative bg-gradient-to-br from-surface-container-highest to-surface-container-high rounded-[2rem] p-8 shadow-md border border-outline-variant/30">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-start-2">
                      <button className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 border border-primary-fixed-dim group">
                        <ChevronUp className="w-8 h-8 sm:w-10 sm:h-10 group-active:translate-y-1 transition-transform" />
                      </button>
                      <p className="text-center text-xs font-bold text-on-surface-variant mt-2">Forward</p>
                    </div>
                    <div className="col-start-1 row-start-2">
                      <button className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 border border-primary-fixed-dim group">
                        <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 group-active:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-center text-xs font-bold text-on-surface-variant mt-2 col-start-1">Left</p>
                    </div>
                    <div className="col-start-2 row-start-2">
                      <button className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high text-on-surface rounded-2xl sm:rounded-3xl shadow-md border border-outline-variant/40 hover:shadow-lg transition-all duration-200 cursor-default opacity-75">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-on-surface"></div>
                      </button>
                    </div>
                    <div className="col-start-3 row-start-2">
                      <button className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 border border-primary-fixed-dim group">
                        <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 group-active:-translate-x-1 transition-transform" />
                      </button>
                      <p className="text-center text-xs font-bold text-on-surface-variant mt-2">Right</p>
                    </div>
                    <div className="col-start-2 row-start-3">
                      <button className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 border border-primary-fixed-dim group">
                        <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 group-active:-translate-y-1 transition-transform" />
                      </button>
                      <p className="text-center text-xs font-bold text-on-surface-variant mt-2">Backward</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <button className="h-20 sm:h-24 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg tracking-wide shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-primary-fixed-dim">
                Accept
              </button>
              <button className="h-20 sm:h-24 bg-gradient-to-br from-error-container to-error text-on-error rounded-2xl sm:rounded-3xl font-black text-lg sm:text-xl tracking-widest shadow-lg shadow-error/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-error-fixed-dim">
                STOP
              </button>
            </div>

            <div className="bg-primary/10 border border-primary/30 p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex items-start gap-4">
              <div className="relative flex h-5 w-5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-primary"></span>
              </div>
              <div>
                <p className="font-bold text-primary text-base">Auto-navigation Enabled</p>
                <p className="text-xs text-on-surface-variant mt-1">Optimal path selected via AI | ETA: 4 min 32 sec</p>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Mode */}
        {activeMode === 'auto' && (
          <div className="lg:col-span-2 bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 flex flex-col items-center justify-center shadow-md border border-primary/10 min-h-[450px] sm:min-h-[550px]">
            <div className="mb-3">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">AI Navigation Active</span>
            </div>
            <div className="relative mb-10 sm:mb-14 mt-6 sm:mt-8">
              <div className="absolute inset-0 bg-primary/12 rounded-full scale-[2] sm:scale-[2.2] blur-2xl animate-pulse"></div>
              <div className="absolute inset-0 bg-primary/6 rounded-full scale-[3] sm:scale-[3.2] blur-3xl"></div>
              <button className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim text-on-primary flex items-center justify-center shadow-2xl relative z-10 hover:scale-105 active:scale-95 transition-transform duration-200 border-2 border-primary-fixed-dim">
                <Cpu className="w-12 h-12 sm:w-16 sm:h-16" />
              </button>
            </div>
            <h4 className="text-3xl sm:text-4xl font-black text-on-surface mb-3 font-headline">Autonomous Control</h4>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg sm:text-xl font-medium mb-8">AI is navigating the device</p>
            
            <div className="w-full grid grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-surface-container-high rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center border border-outline-variant/20">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Speed</p>
                <p className="text-2xl sm:text-3xl font-black text-primary mt-2">2.5 km/h</p>
              </div>
              <div className="bg-surface-container-high rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center border border-outline-variant/20">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Distance</p>
                <p className="text-2xl sm:text-3xl font-black text-primary mt-2">340 m</p>
              </div>
              <div className="bg-surface-container-high rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center border border-outline-variant/20">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">ETA</p>
                <p className="text-2xl sm:text-3xl font-black text-primary mt-2">2:15</p>
              </div>
            </div>

            <div className="mt-6 w-full flex justify-center gap-2 sm:gap-3 px-8">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-primary to-primary-fixed-dim rounded-full flex-1 opacity-70"
                  style={{
                    height: `${[15, 25, 40, 35, 50, 45, 60, 50, 45, 40, 30, 20][i]}px`,
                    animationDelay: `${i * 0.06}s`,
                    animation: `processingWave 0.5s ease-in-out infinite`
                  }}
                ></div>
              ))}
            </div>
            <style>{`
              @keyframes processingWave {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* EMG Control Mode */}
        {activeMode === 'emg' && (
          <div className="lg:col-span-2 bg-gradient-to-br from-surface-container-high to-surface-container-low rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 overflow-hidden relative shadow-md border border-outline-variant/20 min-h-[500px] sm:min-h-[600px]">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-container rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/15 rounded-2xl">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-on-surface font-headline">EMG Signal Fidelity</span>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Neural signal monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                  <span className="text-white font-bold text-sm uppercase tracking-wider">Stable</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-8 sm:p-10 mb-8 border border-outline-variant/20">
                <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6">Signal Intensity Measurement</p>
                <div className="h-40 sm:h-48 w-full flex items-end justify-between gap-1 sm:gap-1.5 relative">
                  {[40, 70, 20, 90, 50, 75, 35, 65, 25, 95, 40, 70, 20, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary via-primary-container to-primary-fixed-dim rounded-t-lg emg-bar transition-all"
                      style={{ 
                        height: `${h}%`, 
                        animationDelay: `${i * 0.1}s`,
                        boxShadow: `0 0 ${Math.ceil(h/10)}px rgba(6, 182, 147, ${h/100})`
                      }}
                    ></div>
                  ))}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                    <div className="w-full border-t border-on-surface"></div>
                    <div className="w-full border-t border-on-surface"></div>
                    <div className="w-full border-t border-on-surface"></div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  <span>40 Hz</span>
                  <span>Frequency Range</span>
                  <span>250 Hz</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-2">Peak Amplitude</p>
                  <p className="text-2xl sm:text-3xl font-black text-primary">95%</p>
                  <p className="text-xs text-on-surface-variant mt-2 font-medium">Signal Quality</p>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-2">Response Time</p>
                  <p className="text-2xl sm:text-3xl font-black text-primary">120 ms</p>
                  <p className="text-xs text-on-surface-variant mt-2 font-medium">Latency</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
