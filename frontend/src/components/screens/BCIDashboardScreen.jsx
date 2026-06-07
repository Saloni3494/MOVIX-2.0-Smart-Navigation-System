import { motion } from 'motion/react';
import { Activity, Brain, ShieldAlert, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils.js';
import { fetchHardwareSnapshot } from '../../lib/api.js';

export default function BCIDashboardScreen({ authToken, isAuthenticated, onRequireAuth }) {
  const [snapshot, setSnapshot] = useState(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    
    // Polling for simulation
    const interval = setInterval(async () => {
      try {
        const data = await fetchHardwareSnapshot(authToken);
        setSnapshot(data);
      } catch (err) {
        console.error("Failed to fetch BCI snapshot:", err);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, authToken, onRequireAuth]);

  const biosignals = snapshot?.biosignalsProcessed || {};
  const prediction = biosignals?.command || 'STOP';
  const confidence = biosignals?.confidence || 0.0;
  
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-black font-headline text-teal-900 tracking-tight">BCI Diagnostics</h1>
        <p className="text-slate-500 mt-2 text-lg">Real-time EEG & EMG Signal Processing</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ML Prediction Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-full flex justify-between items-center mb-6">
             <div className="flex items-center gap-2 text-teal-900 font-bold">
               <Brain className="w-6 h-6 text-teal-600" />
               <h2>Intent Classification</h2>
             </div>
             <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">88% Accuracy Model</span>
           </div>
           
           <motion.div 
             key={prediction}
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={cn(
               "w-40 h-40 rounded-full flex items-center justify-center border-8 shadow-inner mb-4",
               prediction === 'forward' ? 'border-teal-400 bg-teal-50 text-teal-900' :
               prediction === 'left' || prediction === 'right' ? 'border-blue-400 bg-blue-50 text-blue-900' :
               'border-slate-200 bg-slate-50 text-slate-500'
             )}
           >
             <span className="text-2xl font-black uppercase tracking-widest">{prediction}</span>
           </motion.div>
           
           <div className="w-full mt-4">
             <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
               <span>Prediction Confidence</span>
               <span>{(confidence * 100).toFixed(1)}%</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-3">
               <motion.div 
                 className="bg-teal-500 h-3 rounded-full"
                 animate={{ width: `${confidence * 100}%` }}
               />
             </div>
           </div>
        </div>

        {/* Live Signal Streams */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 font-bold mb-4">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h3>EEG Stream (Brainwave)</h3>
            </div>
            <div className="h-24 w-full bg-slate-900 rounded-xl overflow-hidden relative p-2 flex items-center">
               {/* Simulated Waveform Visualization */}
               <motion.div 
                 animate={{ x: [-100, 0] }}
                 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                 className="w-[200%] h-full opacity-60 flex gap-1"
               >
                 {Array.from({length: 40}).map((_, i) => (
                   <div key={i} className="flex-1 bg-indigo-400 rounded-full" style={{ height: `${Math.random() * 80 + 10}%` }} />
                 ))}
               </motion.div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2">Variance: {biosignals?.metrics?.eeg_variance || '0.00'}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-orange-900 font-bold mb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <h3>EMG Stream (Muscle)</h3>
            </div>
            <div className="h-24 w-full bg-slate-900 rounded-xl overflow-hidden relative p-2 flex items-center">
               <motion.div 
                 animate={{ x: [-100, 0] }}
                 transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                 className="w-[200%] h-full opacity-60 flex gap-1"
               >
                 {Array.from({length: 40}).map((_, i) => (
                   <div key={i} className="flex-1 bg-orange-400 rounded-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                 ))}
               </motion.div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2">RMS Amplitude: {biosignals?.metrics?.emg_rms || '0.00'} mV</p>
          </div>
        </div>
      </div>
    </div>
  );
}
