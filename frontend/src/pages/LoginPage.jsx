import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/authService';
import AuthScene3D from '../components/ui/AuthScene3D';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      login(data.accessToken, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'grid',
      gridTemplateColumns: '5fr 7fr',
      overflow: 'hidden',
    }}
    className="auth-grid">

      {/* ── Left panel — 3D animated brand side ── */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 44px',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="auth-brand">
        {/* 3D scene fills the background */}
        <AuthScene3D />

        {/* Logo — above scene */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{
            width: 28, height: 28, background: 'var(--accent)', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#fff',
            boxShadow: '0 0 0 1px rgba(95,98,232,0.5), 0 3px 8px rgba(95,98,232,0.3)',
          }}>◈</div>
          <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.025em' }}>PrepGenius</span>
        </div>

        {/* Tagline — bottom, frosted glass over scene */}
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
          <div style={{
            background: 'rgba(12,12,16,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--r-lg)',
            padding: '20px 22px',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <h2 style={{ marginBottom: 8, fontSize: '1.214rem', lineHeight: 1.25 }}>
              Prepare smarter.<br />Interview better.
            </h2>
            <p style={{ fontSize: '0.829rem', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 260 }}>
              AI-powered mock interviews, real-time coaching, and detailed scorecards.
            </p>
            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {['#6366f1','#8b5cf6','#ec4899'].map((bg, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: '50%', background: bg,
                    border: '2px solid rgba(12,12,16,0.8)',
                    marginLeft: i > 0 ? -7 : 0,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Trusted by engineers at top companies
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 52px',
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: '0.857rem', marginBottom: 28 }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>
              Create one free
            </Link>
          </p>

          {error && (
            <div style={{
              padding: '9px 12px',
              background: 'var(--red-dim)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 'var(--r-sm)',
              fontSize: '0.857rem',
              color: 'var(--red)',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Email address
              </label>
              <input className="input" type="email" placeholder="you@company.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Password
              </label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ marginTop: 4, width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
