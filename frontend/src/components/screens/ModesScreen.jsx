import { AlertTriangle, Brain, Cpu, Gamepad2, Mic, Radar, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils.js';
import {
  detectObstacles,
  fetchHardwareSnapshot,
  getInactivityStatus,
  performSafetyCheck,
  processVoiceInteraction,
  recordUserActivity,
  releaseEmergencyBrake,
  triggerEmergencyBrake,
} from '../../lib/api.js';

const DEFAULT_LOCATION = [73.8567, 18.5204];

export default function ModesScreen({ authToken, isAuthenticated, onRequireAuth }) {
  const [activeMode, setActiveMode] = useState('remote');
  const [hardware, setHardware] = useState(null);
  const [safety, setSafety] = useState(null);
  const [inactivity, setInactivity] = useState(null);
  const [voiceInput, setVoiceInput] = useState('help me');
  const [voiceResult, setVoiceResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const modes = [
    { id: 'remote', label: 'Remote', icon: Gamepad2 },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'auto', label: 'Automatic', icon: Cpu },
    { id: 'emg', label: 'EMG', icon: Brain },
  ];

  const battery = hardware?.system?.batteryLevel ?? 0;
  const emgCommand = hardware?.emgProcessed?.command || 'unknown';
  const emgConfidence = hardware?.emgProcessed?.confidence ?? 0;
  const emgSignal = hardware?.emg?.signalStrength ?? 0;
  const modeLabel = hardware?.hardwareConnection?.mode || 'simulator';

  const statusTone = useMemo(() => {
    if (!safety?.safetyLevel) {
      return 'text-primary';
    }
    if (safety.safetyLevel === 'critical') {
      return 'text-error';
    }
    if (safety.safetyLevel === 'warning' || safety.safetyLevel === 'caution') {
      return 'text-yellow-600';
    }
    return 'text-primary';
  }, [safety]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || !authToken) {
      setHardware(null);
      setSafety(null);
      setInactivity(null);
      return () => {};
    }

    const load = async () => {
      try {
        const [snapshot, safetyStatus, inactivityStatus] = await Promise.all([
          fetchHardwareSnapshot(authToken),
          performSafetyCheck(authToken),
          getInactivityStatus(authToken),
        ]);

        if (!cancelled) {
          setHardware(snapshot);
          setSafety(safetyStatus);
          setInactivity(inactivityStatus);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load control telemetry.');
        }
      }
    };

    load();
    const interval = window.setInterval(load, 9000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [authToken, isAuthenticated]);

  const withAuth = async (fn) => {
    if (!isAuthenticated || !authToken) {
      onRequireAuth();
      throw new Error('Please login first.');
    }
    return fn();
  };

  const handleVoiceRun = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await withAuth(() =>
        processVoiceInteraction(
          {
            transcript: voiceInput,
            generateFeedback: true,
          },
          authToken
        )
      );
      setVoiceResult(result);
      await recordUserActivity({ activityType: 'voice_command' }, authToken);
    } catch (err) {
      setError(err.message || 'Voice interaction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiScan = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await withAuth(() =>
        detectObstacles(
          {
            currentLocation: hardware?.gps?.coordinates || DEFAULT_LOCATION,
            captureFrames: true,
          },
          authToken
        )
      );
      setAiResult(result);
    } catch (err) {
      setError(err.message || 'AI scan failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyBrake = async () => {
    setLoading(true);
    setError('');
    try {
      await withAuth(() => triggerEmergencyBrake({ reason: 'Manual demo emergency stop' }, authToken));
      const safetyStatus = await performSafetyCheck(authToken);
      setSafety(safetyStatus);
    } catch (err) {
      setError(err.message || 'Failed to trigger emergency brake.');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseBrake = async () => {
    setLoading(true);
    setError('');
    try {
      await withAuth(() => releaseEmergencyBrake(authToken));
      const safetyStatus = await performSafetyCheck(authToken);
      setSafety(safetyStatus);
    } catch (err) {
      setError(err.message || 'Failed to release brake.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {!isAuthenticated && (
        <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold flex items-center justify-between gap-3">
          Login required for live control telemetry.
          <button onClick={onRequireAuth} className="bg-error text-on-error px-3 py-2 rounded-xl text-xs font-bold">
            Open Login
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline">Hardware Mode</p>
          <p className="text-lg font-black text-primary mt-2">{modeLabel}</p>
        </div>
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline">Battery</p>
          <p className="text-lg font-black text-primary mt-2">{battery}%</p>
        </div>
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline">EMG Command</p>
          <p className="text-lg font-black text-primary mt-2">{emgCommand}</p>
        </div>
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline">Safety Level</p>
          <p className={cn('text-lg font-black mt-2 uppercase', statusTone)}>{safety?.safetyLevel || 'unknown'}</p>
        </div>
      </div>

      <div className="bg-surface-container-low p-2 rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={cn(
              'py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition',
              activeMode === mode.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
            )}
          >
            <mode.icon className="w-4 h-4" /> {mode.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-semibold text-error">{error}</p>}

      {activeMode === 'remote' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-xl font-black text-on-surface">Remote + Safety Controls</h3>
          <p className="text-sm text-outline">Use these controls in demo to show the safety subsystem works without hardware.</p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={loading}
              onClick={handleEmergencyBrake}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-on-error font-bold disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" /> Emergency Brake
            </button>
            <button
              disabled={loading}
              onClick={handleReleaseBrake}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-50"
            >
              Release Brake
            </button>
            <button
              disabled={loading}
              onClick={handleAiScan}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary font-bold disabled:opacity-50"
            >
              <Radar className="w-4 h-4" /> Scan Obstacles
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">Inactivity</p>
              <p className="text-sm font-semibold mt-2">{inactivity?.isInactive ? 'Inactive' : 'Active'}</p>
              <p className="text-xs text-outline mt-1">Last activity: {inactivity?.timeSinceActivitySeconds ?? '--'}s ago</p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">AI Scan Result</p>
              <p className="text-sm font-semibold mt-2">Detected: {aiResult?.detectedObstacles ?? '--'}</p>
              <p className="text-xs text-outline mt-1">Frames: {aiResult?.totalFramesProcessed ?? '--'}</p>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'voice' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-xl font-black text-on-surface">Voice Interaction</h3>
          <p className="text-sm text-outline">Try commands like: help, stop, emergency, left, right.</p>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              className="flex-1 rounded-xl bg-surface-container px-4 py-3 outline-none"
              placeholder="Type a voice transcript"
            />
            <button
              disabled={loading || !voiceInput.trim()}
              onClick={handleVoiceRun}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-50"
            >
              <Mic className="w-4 h-4" /> Run Voice
            </button>
          </div>
          <div className="rounded-2xl bg-surface-container p-4 text-sm">
            <p className="font-bold text-outline uppercase text-xs">Recognition</p>
            <p className="mt-2">Command: <span className="font-black">{voiceResult?.command?.command || '--'}</span></p>
            <p>Confidence: <span className="font-black">{voiceResult?.command?.confidence ?? '--'}</span></p>
            <p className="mt-2">Audio Feedback: {voiceResult?.audioFeedback?.text || '--'}</p>
          </div>
        </div>
      )}

      {activeMode === 'auto' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-xl font-black text-on-surface">Automatic Mode (Hybrid Intelligence)</h3>
          <p className="text-sm text-outline">Live values below combine simulator hardware streams and backend safety intelligence.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">Ultrasonic Distance</p>
              <p className="text-lg font-black text-primary mt-2">{hardware?.ultrasonic?.distanceCm ?? '--'} cm</p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">Obstacle Nearby</p>
              <p className="text-lg font-black text-primary mt-2">{hardware?.ultrasonic?.isObstacleNearby ? 'Yes' : 'No'}</p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">GPS</p>
              <p className="text-sm font-black text-primary mt-2 break-words">
                {Array.isArray(hardware?.gps?.coordinates) ? hardware.gps.coordinates.join(', ') : '--'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'emg' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-xl font-black text-on-surface">EMG Hands-free Control</h3>
          <p className="text-sm text-outline">Processed EMG command from simulator pipeline.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">Signal Strength</p>
              <p className="text-lg font-black text-primary mt-2">{emgSignal}</p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">RMS</p>
              <p className="text-lg font-black text-primary mt-2">{hardware?.emgProcessed?.rms ?? '--'}</p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">Command</p>
              <p className="text-lg font-black text-primary mt-2 uppercase">{emgCommand}</p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase text-outline">Confidence</p>
              <p className="text-lg font-black text-primary mt-2">{emgConfidence}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-2 rounded-full">
            <AlertTriangle className="w-4 h-4" /> Debounced: {hardware?.emgProcessed?.isDebounced ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </div>
  );
}
