import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/authService';
import AuthScene3D from '../components/ui/AuthScene3D';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.accessToken, data.user);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'grid',
      gridTemplateColumns: '7fr 5fr',
      overflow: 'hidden',
    }}>

      {/* ── Left panel — 3D animated brand side ── */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '40px 44px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 3D scene */}
        <AuthScene3D />

        {/* Logo */}
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

        {/* Bottom content — frosted glass */}
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
              Your interview prep<br />starts here.
            </h2>
            <p style={{ fontSize: '0.829rem', lineHeight: 1.6, margin: '0 0 14px', maxWidth: 300 }}>
              Personalized questions, real-time feedback, and a detailed scorecard after every session.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'AI questions generated from your resume',
                'Real-time speech coaching',
                'Detailed scorecards & PDF reports',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.829rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--green)', fontSize: 10, flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 44px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <h2 style={{ marginBottom: 6 }}>Create account</h2>
          <p style={{ fontSize: '0.857rem', marginBottom: 24 }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>

          {error && (
            <div style={{
              padding: '9px 12px', background: 'var(--red-dim)',
              border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r-sm)',
              fontSize: '0.857rem', color: 'var(--red)', marginBottom: 16,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Full name
              </label>
              <input className="input" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Email address
              </label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Password
              </label>
              <input className="input" type="password" placeholder="At least 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 7 }}>
                I am a
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {[
                  { value: 'candidate', label: 'Candidate', sub: 'Preparing for interviews' },
                  { value: 'recruiter', label: 'Recruiter', sub: 'Evaluating candidates' },
                ].map((r) => (
                  <button key={r.value} type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    style={{
                      padding: '9px 12px', textAlign: 'left',
                      background: form.role === r.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.role === r.value ? 'rgba(95,98,232,0.35)' : 'var(--border-strong)'}`,
                      borderRadius: 'var(--r-sm)', cursor: 'pointer',
                      transition: 'all var(--t-fast)',
                    }}>
                    <div style={{ fontSize: '0.857rem', fontWeight: 500, color: form.role === r.value ? '#a5b4fc' : 'var(--text-primary)' }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '0.714rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ marginTop: 4, width: '100%' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
