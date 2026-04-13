import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/interviewService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ROUNDS = [
  { value:'mock',       icon:'🎯', label:'Mock',       sub:'General practice',          color:'var(--text-secondary)' },
  { value:'hr',         icon:'🤝', label:'HR',         sub:'Behavioral & culture fit',  color:'var(--blue)' },
  { value:'technical',  icon:'💻', label:'Technical',  sub:'DSA & system design',       color:'var(--purple)' },
  { value:'managerial', icon:'🏢', label:'Managerial', sub:'Leadership & decisions',    color:'var(--yellow)' },
  { value:'coding',     icon:'⌨️', label:'Coding',     sub:'Monaco editor + AI eval',   color:'var(--green)' },
];

const DIFFICULTIES = [
  { value:'easy',   label:'Easy',   desc:'Fundamentals & basics',    color:'var(--green)' },
  { value:'medium', label:'Medium', desc:'Intermediate concepts',    color:'var(--yellow)' },
  { value:'hard',   label:'Hard',   desc:'Senior-level depth',       color:'var(--red)' },
];

export default function InterviewSetupPage() {
  const [form, setForm]       = useState({ title:'', jobDescription:'', round:'mock', difficulty:'easy' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Give this interview a title');
    setLoading(true);
    try {
      const { data } = await createInterview(form);
      toast.success('Questions ready — good luck!');
      navigate(form.round === 'coding'
        ? `/interview/${data.interview._id}/coding`
        : `/interview/${data.interview._id}`);
    } catch {
      toast.error('Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  const selectedRound = ROUNDS.find(r => r.value === form.round);
  const selectedDiff  = DIFFICULTIES.find(d => d.value === form.difficulty);

  return (
    <div style={{ maxWidth:700 }} className="anim-fade-up">

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ margin:'0 0 6px' }}>New interview</h1>
        <p style={{ margin:0, fontSize:'0.857rem' }}>
          AI generates personalized questions from your resume + job description.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:0 }}>

        {/* Title */}
        <div className="card" style={{ borderRadius:'var(--r-lg) var(--r-lg) 0 0', borderBottom:'none', padding:'22px 24px 20px' }}>
          <label style={{ display:'block', fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', marginBottom:8, letterSpacing:'0.03em' }}>
            ROLE / POSITION
          </label>
          <input
            className="input"
            style={{ fontSize:'1rem', height:42, fontWeight:500 }}
            placeholder="e.g. Senior Frontend Engineer at Stripe"
            value={form.title}
            onChange={e => setForm({...form, title:e.target.value})}
            required autoFocus
          />
        </div>

        {/* Round type */}
        <div className="card" style={{ borderRadius:0, borderTop:'none', borderBottom:'none', padding:'18px 24px' }}>
          <div style={{ fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', marginBottom:12, letterSpacing:'0.03em' }}>
            ROUND TYPE
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
            {ROUNDS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({...form, round:r.value})}
                style={{
                  padding:'12px 8px',
                  borderRadius:'var(--r-md)',
                  border:`1px solid ${form.round===r.value ? 'rgba(95,98,232,0.5)' : 'var(--border-strong)'}`,
                  background: form.round===r.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  cursor:'pointer',
                  transition:'all var(--t-fast)',
                  textAlign:'center',
                  position:'relative',
                  overflow:'hidden',
                }}
              >
                {form.round===r.value && (
                  <div style={{
                    position:'absolute', top:0, left:0, right:0, height:2,
                    background:'var(--accent)',
                  }} />
                )}
                <div style={{ fontSize:18, marginBottom:5 }}>{r.icon}</div>
                <div style={{ fontSize:'0.786rem', fontWeight:500, color: form.round===r.value ? '#a5b4fc' : 'var(--text-primary)' }}>
                  {r.label}
                </div>
                <div style={{ fontSize:'0.643rem', color:'var(--text-muted)', marginTop:2, lineHeight:1.3 }}>{r.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="card" style={{ borderRadius:0, borderTop:'none', borderBottom:'none', padding:'16px 24px' }}>
          <div style={{ fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', marginBottom:12, letterSpacing:'0.03em' }}>
            STARTING DIFFICULTY
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => setForm({...form, difficulty:d.value})}
                style={{
                  padding:'10px 14px',
                  borderRadius:'var(--r-sm)',
                  border:`1px solid ${form.difficulty===d.value ? 'rgba(95,98,232,0.4)' : 'var(--border-strong)'}`,
                  background: form.difficulty===d.value ? 'var(--accent-dim)' : 'transparent',
                  cursor:'pointer',
                  transition:'all var(--t-fast)',
                  display:'flex', alignItems:'center', gap:10,
                }}
              >
                <div style={{
                  width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background: form.difficulty===d.value ? d.color : 'var(--text-muted)',
                  boxShadow: form.difficulty===d.value ? `0 0 6px ${d.color}` : 'none',
                  transition:'all var(--t-fast)',
                }} />
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:'0.829rem', fontWeight:500, color: form.difficulty===d.value ? '#a5b4fc' : 'var(--text-primary)' }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize:'0.714rem', color:'var(--text-muted)' }}>{d.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:8 }}>
            Difficulty adapts automatically based on your answers
          </div>
        </div>

        {/* JD */}
        <div className="card" style={{ borderRadius:0, borderTop:'none', borderBottom:'none', padding:'16px 24px' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', letterSpacing:'0.03em' }}>
              JOB DESCRIPTION
            </div>
            <span style={{ fontSize:'0.714rem', color:'var(--text-muted)' }}>optional — improves question relevance</span>
          </div>
          <textarea
            className="input"
            style={{ minHeight:90, resize:'vertical', fontSize:'0.829rem' }}
            placeholder="Paste the job description here for personalized questions…"
            value={form.jobDescription}
            onChange={e => setForm({...form, jobDescription:e.target.value})}
          />
        </div>

        {/* Submit footer */}
        <div className="card" style={{
          borderRadius:'0 0 var(--r-lg) var(--r-lg)',
          borderTop:'none',
          padding:'14px 24px',
          background:'var(--bg-elevated)',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'4px 10px', borderRadius:99,
              background:'var(--bg-overlay)', border:'1px solid var(--border-strong)',
              fontSize:'0.75rem', color:'var(--text-secondary)',
            }}>
              <span>{selectedRound?.icon}</span>
              <span>{selectedRound?.label}</span>
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'4px 10px', borderRadius:99,
              background:'var(--bg-overlay)', border:'1px solid var(--border-strong)',
              fontSize:'0.75rem', color:'var(--text-secondary)',
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:selectedDiff?.color }} />
              <span>{selectedDiff?.label}</span>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ minWidth:160 }}
          >
            {loading
              ? <LoadingSpinner size="sm" text="Generating…" />
              : `${form.round === 'coding' ? '⌨️' : '▷'} Start Interview`}
          </button>
        </div>

      </form>
    </div>
  );
}
