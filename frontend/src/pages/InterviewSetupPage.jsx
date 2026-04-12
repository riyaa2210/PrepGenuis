import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/interviewService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ROUNDS = [
  { value: 'mock',       label: 'Mock',       sub: 'General practice' },
  { value: 'hr',         label: 'HR',         sub: 'Behavioral & culture' },
  { value: 'technical',  label: 'Technical',  sub: 'DSA & system design' },
  { value: 'managerial', label: 'Managerial', sub: 'Leadership & decisions' },
  { value: 'coding',     label: 'Coding',     sub: 'Monaco editor + AI eval' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   sub: 'Fundamentals' },
  { value: 'medium', label: 'Medium', sub: 'Intermediate' },
  { value: 'hard',   label: 'Hard',   sub: 'Senior-level' },
];

export default function InterviewSetupPage() {
  const [form, setForm]     = useState({ title: '', jobDescription: '', round: 'mock', difficulty: 'easy' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Give this interview a title');
    setLoading(true);
    try {
      const { data } = await createInterview(form);
      toast.success('Questions ready');
      navigate(form.round === 'coding'
        ? `/interview/${data.interview._id}/coding`
        : `/interview/${data.interview._id}`);
    } catch {
      toast.error('Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680 }} className="anim-fade-up">

      {/* Header — left-aligned, no subtitle clutter */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>New interview</h1>
        <p style={{ fontSize: '0.857rem', margin: 0 }}>
          AI generates questions from your resume + job description.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Title — most important field, gets the most space */}
          <div className="card" style={{ borderRadius: 'var(--r-lg) var(--r-lg) 0 0', borderBottom: 'none', padding: '20px 22px 18px' }}>
            <label style={{ display: 'block', fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 7 }}>
              What role are you interviewing for?
            </label>
            <input
              className="input"
              style={{ fontSize: '0.929rem', height: 38 }}
              placeholder="e.g. Senior Frontend Engineer at Stripe"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Round selector — horizontal pills, not a dropdown */}
          <div className="card" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', padding: '16px 22px' }}>
            <div style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Round type
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {ROUNDS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, round: r.value })}
                  style={{
                    padding: '7px 13px',
                    borderRadius: 'var(--r-sm)',
                    border: `1px solid ${form.round === r.value ? 'rgba(95,98,232,0.4)' : 'var(--border-strong)'}`,
                    background: form.round === r.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '0.829rem', fontWeight: 500, color: form.round === r.value ? '#a5b4fc' : 'var(--text-primary)' }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: '0.714rem', color: 'var(--text-muted)', marginTop: 1 }}>{r.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty — 3 options, inline */}
          <div className="card" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', padding: '14px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                Starting difficulty
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: d.value })}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 99,
                      border: `1px solid ${form.difficulty === d.value ? 'rgba(95,98,232,0.4)' : 'var(--border-strong)'}`,
                      background: form.difficulty === d.value ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.786rem',
                      fontWeight: form.difficulty === d.value ? 500 : 400,
                      color: form.difficulty === d.value ? '#a5b4fc' : 'var(--text-secondary)',
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                — adapts as you answer
              </span>
            </div>
          </div>

          {/* JD — optional, visually de-emphasized */}
          <div className="card" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', padding: '14px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
              <label style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                Job description
              </label>
              <span style={{ fontSize: '0.714rem', color: 'var(--text-muted)' }}>optional — improves question relevance</span>
            </div>
            <textarea
              className="input"
              style={{ minHeight: 100, resize: 'vertical', fontSize: '0.829rem' }}
              placeholder="Paste the JD here…"
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            />
          </div>

          {/* Submit — bottom of the stacked card */}
          <div className="card" style={{
            borderRadius: '0 0 var(--r-lg) var(--r-lg)',
            borderTop: 'none',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          }}>
            {/* What happens next — one line, not a checklist */}
            <p style={{ fontSize: '0.786rem', color: 'var(--text-muted)', margin: 0 }}>
              {form.round === 'coding'
                ? 'Opens Monaco editor with AI code evaluation'
                : 'Generates 5–8 questions · real-time coaching · scorecard at end'}
            </p>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ flexShrink: 0, minWidth: 140 }}
            >
              {loading
                ? <LoadingSpinner size="sm" text="Generating…" />
                : 'Start interview →'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
