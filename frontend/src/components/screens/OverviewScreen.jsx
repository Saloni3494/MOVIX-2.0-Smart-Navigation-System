import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Compass,
  Mic,
  Radar,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Waves,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { fetchHardwareSnapshot, getInactivityStatus, performSafetyCheck } from '../../lib/api.js';

const DEMO_ROUTE = [
  [73.8567, 18.5204],
  [73.8574, 18.5209],
  [73.8582, 18.5214],
  [73.8591, 18.522],
  [73.8602, 18.5228],
];

function buildDemoNavigation(user) {
  return {
    destination: 'Accessible campus route demo',
    userLocation: user?.currentLocation || { lat: 18.5204, lon: 73.8567 },
    route: DEMO_ROUTE,
    score: 97,
    ai_response: 'Demo route generated from the accessibility stack already present in this system.',
    selectedRouteType: 'recommended',
  };
}

export default function OverviewScreen({ authToken, isAuthenticated, user, onScreenChange, onStartNavigation, onRequireAuth }) {
  const [telemetry, setTelemetry] = useState({
    battery: '--',
    safetyLevel: 'unknown',
    inactivityLabel: '--',
    modeLabel: 'simulator',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadTelemetry = async () => {
      if (!isAuthenticated || !authToken) {
        setTelemetry({
          battery: '--',
          safetyLevel: 'guest demo',
          inactivityLabel: '--',
          modeLabel: 'guest',
        });
        return;
      }

      try {
        const [snapshot, safetyStatus, inactivityStatus] = await Promise.all([
          fetchHardwareSnapshot(authToken),
          performSafetyCheck(authToken),
          getInactivityStatus(authToken),
        ]);

        if (cancelled) {
          return;
        }

        setTelemetry({
          battery: `${snapshot?.system?.batteryLevel ?? '--'}%`,
          safetyLevel: safetyStatus?.safetyLevel || 'unknown',
          inactivityLabel: inactivityStatus?.isInactive ? 'Inactive' : 'Active',
          modeLabel: snapshot?.hardwareConnection?.mode || 'simulator',
        });
        setError('');
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Unable to load live telemetry.');
        }
      }
    };

    loadTelemetry();
    return () => {
      cancelled = true;
    };
  }, [authToken, isAuthenticated]);

  const demoCards = [
    {
      title: 'Smart routing',
      text: 'Search accessible destinations and launch the safest route with live guidance.',
      icon: Compass,
      action: () => onScreenChange('map'),
    },
    {
      title: 'Voice and EMG control',
      text: 'Switch control modes and keep hands-free interaction within the same flow.',
      icon: Mic,
      action: () => onScreenChange('modes'),
    },
    {
      title: 'Safety and alerts',
      text: 'Report hazards, trigger SOS, and keep caregivers informed in real time.',
      icon: ShieldCheck,
      action: () => onScreenChange('report'),
    },
  ];

  const handleLaunchDemo = () => {
    setLoading(true);
    try {
      onStartNavigation?.(buildDemoNavigation(user));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(0,121,107,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(80,150,255,0.14),_transparent_30%),linear-gradient(180deg,_#f7fbfb_0%,_#edf4f4_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute left-6 top-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 top-28 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_rgba(24,33,31,0.10)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.28em] text-outline">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Video-style demo hub
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1">
                <Waves className="h-3.5 w-3.5" /> {telemetry.modeLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1">
                <Brain className="h-3.5 w-3.5" /> {telemetry.safetyLevel}
              </span>
            </div>

            <div className="mt-6 max-w-3xl space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
                Build the accessible mobility demo as a single connected experience.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">
                This hub stitches together route planning, live guidance, obstacle detection, voice control, EMG modes, and emergency response so the project feels like one product instead of separate screens.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleLaunchDemo}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-on-primary shadow-lg shadow-primary/20 transition hover:translate-y-[-1px] disabled:opacity-60"
              >
                Launch live demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onScreenChange('map')}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container"
              >
                Open routing
                <Compass className="h-4 w-4" />
              </button>
              <button
                onClick={() => (isAuthenticated ? onScreenChange('modes') : onRequireAuth?.())}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container"
              >
                Control modes
                <Mic className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="mt-4 text-sm font-semibold text-error">{error}</p>}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Battery', value: telemetry.battery },
                { label: 'Safety', value: telemetry.safetyLevel },
                { label: 'Activity', value: telemetry.inactivityLabel },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-surface-container-lowest px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-outline">{item.label}</p>
                  <p className="mt-2 text-lg font-black text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(24,33,31,0.16)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">Mission panel</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Guidance stack</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <Smartphone className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-3xl bg-white/8 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">1. Find route</p>
                  <p className="mt-1 text-sm text-white/80">Search destination and compute an accessibility-aware path.</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">2. Navigate live</p>
                  <p className="mt-1 text-sm text-white/80">Step-by-step guidance, rerouting, and obstacle awareness in one loop.</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">3. Escalate safely</p>
                  <p className="mt-1 text-sm text-white/80">Report issues, trigger SOS, and hand over context to caregivers.</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-[0_24px_80px_rgba(24,33,31,0.10)] backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-outline">Connected modules</p>
              <div className="mt-4 space-y-3">
                {[
                  'Accessible route planner',
                  'Live navigation and rerouting',
                  'Obstacle detection and reporting',
                  'Voice assistant and EMG controls',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3">
                    <Radar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-on-surface">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {demoCards.map((card) => (
            <button
              key={card.title}
              onClick={card.action}
              className="group rounded-[1.75rem] border border-white/60 bg-white/75 p-5 text-left shadow-[0_24px_80px_rgba(24,33,31,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-5 w-5 text-outline transition group-hover:translate-x-1" />
              </div>
              <h3 className="mt-4 text-lg font-black text-on-surface">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{card.text}</p>
            </button>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_24px_80px_rgba(24,33,31,0.08)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-outline">What to integrate next</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                'Real-time device telemetry',
                'Caregiver live tracking',
                'Indoor map support',
                'Obstacle camera pipeline',
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-surface-container-lowest px-4 py-4">
                  <p className="text-sm font-bold text-on-surface">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('rounded-[2rem] border border-white/60 p-5 shadow-[0_24px_80px_rgba(24,33,31,0.08)] backdrop-blur-xl', isAuthenticated ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest')}>
            <p className={cn('text-xs font-black uppercase tracking-[0.28em]', isAuthenticated ? 'text-on-primary/70' : 'text-outline')}>Current session</p>
            <h3 className={cn('mt-3 text-2xl font-black tracking-tight', isAuthenticated ? 'text-on-primary' : 'text-on-surface')}>
              {isAuthenticated ? `Welcome back, ${user?.name || 'operator'}` : 'Guest demo mode'}
            </h3>
            <p className={cn('mt-2 text-sm leading-6', isAuthenticated ? 'text-on-primary/85' : 'text-on-surface-variant')}>
              {isAuthenticated
                ? 'You can jump straight into live navigation, system controls, and safety reporting from this hub.'
                : 'Use the demo launch to preview the app flow before wiring authentication and device data.'}
            </p>
            <button
              onClick={() => onScreenChange('profile')}
              className={cn(
                'mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition',
                isAuthenticated ? 'bg-white text-primary' : 'bg-primary text-on-primary'
              )}
            >
              {isAuthenticated ? 'Open profile' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}