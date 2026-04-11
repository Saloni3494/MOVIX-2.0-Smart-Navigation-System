import { BarChart3, MapPinned, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminAccessibilityInsights, getAdminSystemInsights } from '../../lib/api.js';

export default function AdminScreen({ authToken, user, isAuthenticated, onRequireAuth }) {
  const [accessibility, setAccessibility] = useState(null);
  const [system, setSystem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || !authToken) {
      setAccessibility(null);
      setSystem(null);
      return () => {};
    }

    if (user?.role !== 'admin') {
      return () => {};
    }

    const load = async () => {
      try {
        const [a, s] = await Promise.all([
          getAdminAccessibilityInsights(authToken),
          getAdminSystemInsights(authToken),
        ]);

        if (!cancelled) {
          setAccessibility(a);
          setSystem(s);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load admin dashboard.');
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authToken, isAuthenticated, user?.role]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold flex items-center justify-between">
          Login required for admin dashboard.
          <button onClick={onRequireAuth} className="bg-error text-on-error px-3 py-2 rounded-xl text-xs font-bold">
            Open Login
          </button>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold">
          Admin dashboard is restricted to users with role: admin.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/20 p-6">
        <h2 className="text-2xl font-black text-on-surface">Infrastructure Dashboard</h2>
        <p className="text-sm text-outline mt-1">Live analytics for accessibility planning and safety insights.</p>
      </div>

      {error && <p className="text-sm font-semibold text-error">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-2"><MapPinned className="w-4 h-4" /> Total Obstacles</p>
          <p className="text-2xl font-black text-primary mt-2">{accessibility?.dataPoints?.totalObstacles ?? '--'}</p>
        </div>
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Accessibility Score</p>
          <p className="text-2xl font-black text-primary mt-2">{accessibility?.accessibilityScore ?? '--'}</p>
        </div>
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Active Users (24h)</p>
          <p className="text-2xl font-black text-primary mt-2">{system?.userMetrics?.activeUsersLast24h ?? '--'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline">Top Obstacle Types</p>
          <div className="mt-3 space-y-2">
            {(accessibility?.dataPoints?.obstaclesByType || []).slice(0, 5).map((row) => (
              <div key={row._id} className="flex items-center justify-between text-sm font-semibold">
                <span>{row._id}</span>
                <span>{row.count}</span>
              </div>
            ))}
            {(!accessibility?.dataPoints?.obstaclesByType || accessibility.dataPoints.obstaclesByType.length === 0) && (
              <p className="text-sm text-outline">No obstacle analytics yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-outline">System Health</p>
          <div className="mt-3 space-y-2 text-sm font-semibold">
            <div className="flex items-center justify-between"><span>Uptime</span><span>{system?.systemHealth?.uptime_percentage ?? '--'}%</span></div>
            <div className="flex items-center justify-between"><span>API Latency</span><span>{system?.systemHealth?.apiResponseTime_ms ?? '--'} ms</span></div>
            <div className="flex items-center justify-between"><span>DB Latency</span><span>{system?.systemHealth?.databaseLatency_ms ?? '--'} ms</span></div>
            <div className="flex items-center justify-between"><span>Socket Connections</span><span>{system?.systemHealth?.socketConnectionsActive ?? '--'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
