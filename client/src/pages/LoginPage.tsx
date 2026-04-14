import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api';

export const LoginPage = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = mode === 'login'
        ? await apiLogin(form.email, form.password)
        : await apiRegister(form.email, form.password, form.name);
      login(data.token, data.user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--brand)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36, color: '#fff' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏛</div>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>CivicTrack</h1>
        <p style={{ opacity: 0.7, marginTop: 6, fontSize: 15 }}>City of Ottawa — Service Request Portal</p>
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 20,
        padding: '36px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--surface-2)',
          borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 28,
        }}>
          {(['login', 'register'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--brand)' : 'var(--text-3)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text" placeholder="Jane Smith"
                value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password"
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              value={form.password} onChange={(e) => set('password', e.target.value)} required />
          </div>

          {error && (
            <div style={{
              background: 'var(--accent-light)', color: 'var(--accent)',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              fontSize: 13, border: '1px solid rgba(200,57,43,0.2)',
            }}>{error}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', height: 46, fontSize: 15, marginTop: 4 }}>
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading...</>
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{ marginTop: 20, padding: 14, background: 'var(--brand-light)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--brand)' }}>
            <strong>Admin demo:</strong> admin@civictrack.ca / admin123
          </div>
        )}
      </div>
    </div>
  );
};