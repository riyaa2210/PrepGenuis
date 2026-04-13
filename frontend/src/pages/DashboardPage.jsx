import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInterviews } from '../services/interviewService';
import Badge from '../components/ui/Badge';
import RingChart from '../components/ui/RingChart';
import ScoreBar from '../components/ui/ScoreBar';
import { SkeletonStat, SkeletonRow } from '../components/ui/SkeletonLoader';

const ROUND_BADGE = { hr:'blue', technical:'purple', managerial:'yellow', coding:'green', mock:'gray' };
const ROUND_ICON  = { hr:'🤝', technical:'💻', managerial:'🏢', coding:'⌨️', mock:'🎯' };

const ACTIONS = [
  { to:'/interview/setup', icon:'▷', label:'Start Interview',  sub:'AI-powered mock session',      color:'var(--accent)',  glow:'rgba(95,98,232,0.15)' },
  { to:'/resume',          icon:'◫', label:'Upload Resume',    sub:'Parse & ATS score',             color:'var(--purple)', glow:'rgba(192,132,252,0.12)' },
  { to:'/coach',           icon:'◎', label:'AI Coach',         sub:'Roadmap & real-time feedback',  color:'var(--green)',  glow:'rgba(52,211,153,0.1)' },
  { to:'/intelligence',    icon:'◈', label:'Intelligence',     sub:'ATS · Speech · Behavior',       color:'var(--blue)',   glow:'rgba(96,165,250,0.1)' },
];

function StatCard({ label, value, delta, deltaDir, sub, loading, color }) {
  if (loading) return <SkeletonStat />;
  return (
    <div className="card" style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize:'1.857rem', fontWeight:700, letterSpacing:'-0.045em', color: color || 'var(--text-primary)', lineHeight:1, marginTop:2 }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize:'0.75rem', fontWeight:500, color: deltaDir==='up' ? 'var(--green)' : deltaDir==='down' ? 'var(--red)' : 'var(--text-muted)', display:'flex', alignItems:'center', gap:3, marginTop:4 }}>
          {deltaDir==='up' ? '↑' : deltaDir==='down' ? '↓' : '·'} {delta}
        </div>
      )}
      {sub && !delta && (
        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:4 }}>{sub}</div>
      )}
    </div>
  );
}

function InterviewRow({ iv }) {
  const score = iv.scorecard?.overallScore;
  const scoreColor = score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--yellow)' : score != null ? 'var(--red)' : 'var(--text-muted)';
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={`/reports/${iv._id}`} style={{ textDecoration:'none', display:'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'11px 20px',
          borderBottom:'1px solid var(--border)',
          background: hovered ? 'var(--bg-elevated)' : 'transparent',
          transition:'background var(--t-fast)',
          cursor:'pointer',
        }}
      >
        {/* Round icon */}
        <div style={{
          width:32, height:32, borderRadius:'var(--r-sm)',
          background:'var(--bg-overlay)', border:'1px solid var(--border-strong)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:14, flexShrink:0,
        }}>
          {ROUND_ICON[iv.round] || '🎯'}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:'0.857rem', fontWeight:500, color:'var(--text-primary)' }} className="truncate">
              {iv.title}
            </span>
            <Badge variant={ROUND_BADGE[iv.round] || 'gray'}>{iv.round}</Badge>
          </div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
            {new Date(iv.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
            {iv.duration > 0 && ` · ${Math.round(iv.duration/60)}m`}
          </div>
        </div>

        {/* Score */}
        <div style={{ flexShrink:0, textAlign:'right' }}>
          {score != null ? (
            <>
              <span style={{ fontSize:'1.071rem', fontWeight:700, color:scoreColor, letterSpacing:'-0.02em' }} className="mono">{score}</span>
              <span style={{ fontSize:'0.714rem', color:'var(--text-muted)' }}>/10</span>
            </>
          ) : (
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', background:'var(--bg-overlay)', padding:'2px 8px', borderRadius:99 }}>
              {iv.status.replace('_',' ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviews({ limit:8 })
      .then(({ data }) => setInterviews(data.interviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed  = interviews.filter(iv => iv.status === 'completed');
  const lastIv     = completed[0];
  const sc         = lastIv?.scorecard;
  const scoreDelta = completed.length >= 2
    ? (completed[0].scorecard?.overallScore - completed[1].scorecard?.overallScore).toFixed(1)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth:1100 }} className="anim-fade-up">

      {/* ── Hero header ── */}
      <div style={{
        display:'flex', alignItems:'flex-end', justifyContent:'space-between',
        marginBottom:24, gap:16,
      }}>
        <div>
          <div style={{ fontSize:'0.786rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.04em' }}>
            {greeting}
          </div>
          <h1 style={{ margin:0, fontSize:'1.857rem' }}>
            {user?.name?.split(' ')[0]}'s Dashboard
          </h1>
          <p style={{ margin:'6px 0 0', fontSize:'0.857rem' }}>
            {completed.length > 0
              ? `${completed.length} interview${completed.length !== 1 ? 's' : ''} completed · avg score ${user?.averageScore?.toFixed(1) || '—'}/10`
              : 'Ready to start your interview prep?'}
          </p>
        </div>
        <Link to="/interview/setup" className="btn btn-primary btn-lg" style={{ flexShrink:0 }}>
          ▷ New Interview
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }} className="stagger">
        <StatCard label="Total Interviews" value={user?.totalInterviews || 0} sub="all time" loading={loading} />
        <StatCard
          label="Avg Score"
          value={user?.averageScore ? user.averageScore.toFixed(1) : '—'}
          delta={scoreDelta ? `${Math.abs(scoreDelta)} vs prev` : null}
          deltaDir={scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'flat'}
          loading={loading}
          color={user?.averageScore >= 7 ? 'var(--green)' : user?.averageScore >= 4 ? 'var(--yellow)' : undefined}
        />
        <StatCard
          label="Weak Topics"
          value={user?.weakTopics?.length || 0}
          sub={user?.weakTopics?.[0] || 'none yet'}
          loading={loading}
          color={user?.weakTopics?.length > 0 ? 'var(--yellow)' : undefined}
        />
        <StatCard
          label="Last Round"
          value={lastIv?.round?.toUpperCase() || '—'}
          sub={lastIv ? new Date(lastIv.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'no sessions yet'}
          loading={loading}
        />
      </div>

      {/* ── Main 3-column grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 280px', gap:14 }}>

        {/* Col 1: Recent interviews */}
        <div className="card" style={{ padding:0, overflow:'hidden', gridColumn:'1/3' }}>
          <div style={{
            padding:'14px 20px 12px',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <h3 style={{ margin:0 }}>Recent interviews</h3>
              {!loading && <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{interviews.length} sessions</span>}
            </div>
            <Link to="/reports" className="btn btn-ghost btn-xs" style={{ color:'var(--text-tertiary)' }}>
              View all →
            </Link>
          </div>

          {loading
            ? [1,2,3,4].map(i => (
                <div key={i} style={{ padding:'0 20px' }}><SkeletonRow /></div>
              ))
            : interviews.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h4 style={{ color:'var(--text-primary)', margin:0 }}>No interviews yet</h4>
                <p style={{ fontSize:'0.857rem', margin:0 }}>Start your first session to track progress.</p>
                <Link to="/interview/setup" className="btn btn-primary btn-sm" style={{ marginTop:10 }}>
                  Start Interview
                </Link>
              </div>
            )
            : interviews.map(iv => <InterviewRow key={iv._id} iv={iv} />)
          }
        </div>

        {/* Col 3: Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Last scorecard */}
          {sc ? (
            <div className="card" style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  Last session
                </div>
                <div style={{
                  fontSize:'1.286rem', fontWeight:700, letterSpacing:'-0.03em',
                  color: sc.overallScore >= 7 ? 'var(--green)' : sc.overallScore >= 4 ? 'var(--yellow)' : 'var(--red)',
                }} className="mono">
                  {sc.overallScore}/10
                </div>
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                <RingChart score={sc.technicalScore||0}     label="Tech" size={56} strokeWidth={5} />
                <RingChart score={sc.communicationScore||0} label="Comm" size={56} strokeWidth={5} />
                <RingChart score={sc.confidenceScore||0}    label="Conf" size={56} strokeWidth={5} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <ScoreBar label="Technical"     score={sc.technicalScore||0} />
                <ScoreBar label="Communication" score={sc.communicationScore||0} />
                <ScoreBar label="Clarity"       score={sc.clarityScore||0} />
              </div>
              {sc.aiSummary && (
                <p style={{
                  fontSize:'0.75rem', margin:'12px 0 0', padding:'9px 11px',
                  background:'var(--bg-elevated)', borderRadius:'var(--r-sm)',
                  lineHeight:1.55, borderLeft:'2px solid var(--accent)',
                }}>
                  {sc.aiSummary}
                </p>
              )}
            </div>
          ) : !loading && (
            <div className="card card-ghost" style={{ padding:'20px 16px', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>📊</div>
              <p style={{ fontSize:'0.786rem', margin:0 }}>Complete an interview to see your scorecard.</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px 10px', borderBottom:'1px solid var(--border)' }}>
              <h4 style={{ margin:0 }}>Quick actions</h4>
            </div>
            {ACTIONS.map((a, i) => (
              <Link key={a.to} to={a.to} style={{ textDecoration:'none' }}>
                <div
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding: i===0 ? '12px 16px' : '10px 16px',
                    borderBottom: i < ACTIONS.length-1 ? '1px solid var(--border)' : 'none',
                    background: i===0 ? `rgba(95,98,232,0.06)` : 'transparent',
                    transition:'background var(--t-fast)',
                    cursor:'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = i===0 ? 'var(--accent-dim)' : 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = i===0 ? 'rgba(95,98,232,0.06)' : 'transparent'}
                >
                  <div style={{
                    width: i===0 ? 30 : 26, height: i===0 ? 30 : 26,
                    borderRadius:'var(--r-sm)',
                    background: i===0 ? 'var(--accent-dim)' : 'var(--bg-overlay)',
                    border:`1px solid ${i===0 ? 'rgba(95,98,232,0.3)' : 'var(--border-strong)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: i===0 ? 14 : 12, flexShrink:0,
                    color: i===0 ? '#a5b4fc' : 'var(--text-secondary)',
                  }}>{a.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize: i===0 ? '0.857rem' : '0.829rem', fontWeight: i===0 ? 500 : 450, color: i===0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize:'0.714rem', color:'var(--text-muted)', marginTop:1 }}>{a.sub}</div>
                  </div>
                  <span style={{ color:'var(--text-muted)', fontSize:11 }}>→</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Weak topics */}
          {user?.weakTopics?.length > 0 && (
            <div className="card" style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  Weak topics
                </div>
                <Link to="/coach" className="btn btn-ghost btn-xs" style={{ color:'var(--text-tertiary)' }}>Roadmap →</Link>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {user.weakTopics.slice(0,6).map(t => <Badge key={t} variant="red">{t}</Badge>)}
                {user.weakTopics.length > 6 && <Badge variant="gray">+{user.weakTopics.length-6}</Badge>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
