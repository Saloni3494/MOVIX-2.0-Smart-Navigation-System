import { UserRound, LogIn, UserPlus, Shield, RadioTower } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function ProfileScreen({ user, onLogin, onRegister, onLogout, liveAlert }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'wheelchair_user',
    emergencyContacts: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const liveAlertLabel = useMemo(() => {
    if (!liveAlert) {
      return 'No active alerts';
    }
    return `${liveAlert.type || 'ALERT'}: ${liveAlert.message || 'Real-time update received'}`;
  }, [liveAlert]);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await onLogin({ email: form.email, password: form.password });
      } else {
        const contacts = form.emergencyContacts
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        await onRegister({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          emergencyContacts: contacts,
        });
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
              <UserRound className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-on-surface">{user.name}</h2>
              <p className="text-outline font-medium">{user.email}</p>
              <p className="text-xs uppercase tracking-widest font-bold text-primary mt-1">{user.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Emergency Contacts</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">
                {Array.isArray(user.emergencyContacts) && user.emergencyContacts.length > 0
                  ? user.emergencyContacts.join(', ')
                  : 'No contacts set'}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-outline flex items-center gap-2">
                <RadioTower className="w-4 h-4" /> Live Channel
              </p>
              <p className="mt-2 text-sm font-semibold text-on-surface">{liveAlertLabel}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="mt-6 px-5 py-3 rounded-2xl bg-error text-on-error font-bold hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-outline-variant/30">
        <h2 className="text-2xl font-black text-on-surface">{isLogin ? 'Login' : 'Create Account'}</h2>
        <p className="text-outline mt-1">Access smart wheelchair navigation services.</p>

        <div className="mt-6 space-y-3">
          {!isLogin && (
            <input
              className="w-full bg-surface-container rounded-xl px-4 py-3 outline-none"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          )}

          <input
            className="w-full bg-surface-container rounded-xl px-4 py-3 outline-none"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />

          <input
            className="w-full bg-surface-container rounded-xl px-4 py-3 outline-none"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />

          {!isLogin && (
            <>
              <select
                className="w-full bg-surface-container rounded-xl px-4 py-3 outline-none"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="wheelchair_user">wheelchair_user</option>
                <option value="caregiver">caregiver</option>
                <option value="admin">admin</option>
              </select>

              <input
                className="w-full bg-surface-container rounded-xl px-4 py-3 outline-none"
                placeholder="Emergency contacts (comma separated)"
                value={form.emergencyContacts}
                onChange={(e) => setForm((prev) => ({ ...prev, emergencyContacts: e.target.value }))}
              />
            </>
          )}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-error">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-6 w-full movement-gradient text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <button
          onClick={() => setIsLogin((prev) => !prev)}
          className="mt-4 w-full py-2 text-primary font-bold hover:underline"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>

        <div className="mt-5 p-3 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" /> JWT protected backend integration enabled
        </div>
      </div>
    </div>
  );
}
