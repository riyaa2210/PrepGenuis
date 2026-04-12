import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInterviews } from '../services/interviewService';
import Badge from '../components/ui/Badge';
import RingChart from '../components/ui/RingChart';
import ScoreBar from '../components/ui/ScoreBar';
import { SkeletonStat, SkeletonRow } from '../components/ui/SkeletonLoader';

const ROUND_BADGE = { hr:'blue', technical:'purple', managerial:'yellow', coding:'green', mock:'gray' };

/* ── Stat card — each one slightly different ─────────────────────────────── */
function StatCard({ label, value, delta, deltaDir, sub, loading, accent }) {
  if (loading) return <SkeletonStat />;
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>
        {value}
      </div>
      {delta && (
        <div className={`stat-delta ${deltaDir || 'flat'}`}>
          {deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '·'} {delta}
        </div>
      )}
      {sub && !delta && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

/* ── Activity row ────────────────────────────────────────────────────────── */
function ActivityRow({ iv }) {
  const score = iv.scorecard?.overallScore;
  const scoreColor = score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--yellow)' : 'var(--red)';

  return (
    <Link to={`/reports/${iv._id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="feed-item" style={{ cursor: 'pointer', padding: '10px 0' }}
        onMouseEnter={(e) => e.currentTarget.style.paddingLeft = '4px'}
        onMouseLeave={(e) => e.currentTarget.style.paddingLeft = '0'}
      >
        <div className="feed-dot" style={{
          background: iv.status === 'completed' ? 'var(--green)' :
                      iv.status === 'in_progress' ? 'var(--yellow)' : 'var(--text-muted)',
          marginTop: 6,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}
              className="truncate">
              {iv.title}
            </span>
            <Badge variant={ROUND_BADGE[iv.round] || 'gray'}>{iv.round}</Badge>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {new Date(iv.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>
        {score != null && (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: scoreColor }} className="mono">
              {score}
            </span>
            <span style={{ fontSize: '0.714rem', color: 'var(--text-muted)' }}>/10</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Quick action — intentionally varied sizes ───────────────────────────── */
function QuickAction({ to, icon, label, sub, featured }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: featured ? '12px 14px' : '10px 14px',
        borderBottom: '1px solid var(--border)',
        transition: 'background var(--t-fast)',
        cursor: 'pointer',
        background: featured ? 'var(--accent-glow)' : 'transparent',
      }}
        onMouseEnter={(e) => e.currentTarget.style.background = featured ? 'var(--accent-dim)' : 'var(--bg-elevated)'}
        onMouseLeave={(e) => e.currentTarget.style.background = featured ? 'var(--accent-glow)' : 'transparent'}
      >
        <div style={{
          width: featured ? 30 : 26, height: featured ? 30 : 26,
          background: featured ? 'var(--accent-dim)' : 'var(--bg-overlay)',
          border: `1px solid ${featured ? 'rgba(95,98,232,0.3)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: featured ? 14 : 12, flexShrink: 0,
          color: featured ? '#a5b4fc' : 'var(--text-secondary)',
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: featured ? '0.857rem' : '0.829rem',
            fontWeight: featured ? 500 : 450,
            color: featured ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}>{label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
      </div>
    </Link>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviews({ limit: 8 })
      .then(({ data }) => setInterviews(data.interviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = interviews.filter((iv) => iv.status === 'completed');
  const lastIv    = completed[0];
  const sc        = lastIv?.scorecard;

  const scoreDelta = completed.length >= 2
    ? (completed[0].scorecard?.overallScore - completed[1].scorecard?.overallScore).toFixed(1)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 1080 }} className="anim-fade-up">

      {/* ── Page header — left-heavy, not centered ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 5 }}>
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '0.857rem', margin: 0 }}>
          {completed.length > 0
            ? `${completed.length} interview${completed.length !== 1 ? 's' : ''} completed · avg ${user?.averageScore?.toFixed(1) || '—'}/10`
            : 'Start your first interview to see your progress here.'}
        </p>
      </div>

      {/* ── Stats — 4 cols but with varied content density ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}
        className="stagger">
        <StatCard
          label="Interviews"
          value={user?.totalInterviews || 0}
          sub="all time"
          loading={loading}
        />
        <StatCard
          label="Avg Score"
          value={user?.averageScore ? `${user.averageScore.toFixed(1)}` : '—'}
          delta={scoreDelta ? `${Math.abs(scoreDelta)} pts vs prev` : null}
          deltaDir={scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'flat'}
          loading={loading}
        />
        <StatCard
          label="Weak Topics"
          value={user?.weakTopics?.length || 0}
          sub={user?.weakTopics?.length > 0 ? user.weakTopics[0] : 'none identified'}
          loading={loading}
          accent={user?.weakTopics?.length > 0 ? 'var(--yellow)' : undefined}
        />
        <StatCard
          label="Last Round"
          value={lastIv?.round?.toUpperCase() || '—'}
          sub={lastIv ? new Date(lastIv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'no interviews yet'}
          loading={loading}
        />
      </div>

      {/* ── Main grid — intentionally unequal columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

        {/* Left: Activity feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '15px 20px 13px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0 }}>Recent interviews</h3>
            <Link to="/reports" className="btn btn-ghost btn-xs" style={{ color: 'var(--text-tertiary)' }}>
              All reports →
            </Link>
          </div>
          <div style={{ padding: '0 20px' }}>
            {loading
              ? [1,2,3,4,5].map((i) => <SkeletonRow key={i} />)
              : interviews.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-icon">▷</div>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>No interviews yet</h4>
                  <p style={{ fontSize: '0.857rem', margin: 0 }}>
                    Your interview history will appear here.
                  </p>
                  <Link to="/interview/setup" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                    Start first interview
                  </Link>
                </div>
              )
              : interviews.map((iv) => <ActivityRow key={iv._id} iv={iv} />)
            }
          </div>
        </div>

        {/* Right column — 3 stacked panels, each with different padding */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Last interview scores — only when data exists */}
          {sc ? (
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14,
              }}>
                Last interview
              </div>
              {/* Rings — not perfectly centered, slight left offset */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginBottom: 14 }}>
                <RingChart score={sc.technicalScore || 0}     label="Tech"   size={58} strokeWidth={5} />
                <RingChart score={sc.communicationScore || 0} label="Comm"   size={58} strokeWidth={5} />
                <RingChart score={sc.confidenceScore || 0}    label="Conf"   size={58} strokeWidth={5} />
              </div>
              {/* Score bars — more detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <ScoreBar label="Technical"     score={sc.technicalScore || 0} />
                <ScoreBar label="Communication" score={sc.communicationScore || 0} />
                <ScoreBar label="Clarity"       score={sc.clarityScore || 0} />
              </div>
              {sc.aiSummary && (
                <p style={{
                  fontSize: '0.786rem', margin: '12px 0 0',
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--r-sm)',
                  lineHeight: 1.55,
                  borderLeft: '2px solid var(--accent)',
                }}>
                  {sc.aiSummary}
                </p>
              )}
            </div>
          ) : !loading && (
            <div className="card card-ghost" style={{ padding: '20px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.857rem', margin: 0 }}>
                Complete an interview to see your scorecard here.
              </p>
            </div>
          )}

          {/* Quick actions — varied featured state */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: '0.857rem' }}>Quick actions</h4>
            </div>
            <QuickAction to="/interview/setup" icon="▷" label="Start Interview"   sub="AI mock session"       featured />
            <QuickAction to="/resume"          icon="◫" label="Upload Resume"     sub="Parse & ATS score" />
            <QuickAction to="/coach"           icon="◎" label="AI Coach"          sub="Roadmap & feedback" />
            <QuickAction to="/intelligence"    icon="◈" label="Intelligence"      sub="ATS · Speech · Behavior" />
          </div>

          {/* Weak topics — only when present */}
          {user?.weakTopics?.length > 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Weak topics
                </div>
                <Link to="/coach" className="btn btn-ghost btn-xs" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  Roadmap →
                </Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {user.weakTopics.slice(0, 5).map((t) => (
                  <Badge key={t} variant="red">{t}</Badge>
                ))}
                {user.weakTopics.length > 5 && (
                  <Badge variant="gray">+{user.weakTopics.length - 5} more</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
