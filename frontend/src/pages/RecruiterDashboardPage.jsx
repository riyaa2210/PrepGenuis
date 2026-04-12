import React, { useEffect, useState } from 'react';
import { getCandidates, getCandidateDetail, getAnalytics } from '../services/recruiterService';
import HiringSummaryCard from '../components/hiring/HiringSummaryCard';
import ScoreBar from '../components/ui/ScoreBar';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { SkeletonRow, SkeletonStat } from '../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

export default function RecruiterDashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [minScore, setMinScore]     = useState('');

  useEffect(() => {
    Promise.all([getCandidates({ limit: 50 }), getAnalytics()])
      .then(([cRes, aRes]) => {
        setCandidates(cRes.data.candidates);
        setAnalytics(aRes.data.analytics);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    try {
      const { data } = await getCandidates({ search, minScore, limit: 50 });
      setCandidates(data.candidates);
    } catch { toast.error('Search failed'); }
  };

  const handleSelect = async (id) => {
    try {
      const { data } = await getCandidateDetail(id);
      setSelected(data);
    } catch { toast.error('Failed to load candidate'); }
  };

  return (
    <div style={{ maxWidth: 1060 }} className="anim-fade-up">

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>Candidates</h1>
        <p style={{ fontSize: '0.857rem', margin: 0 }}>
          {analytics ? `${analytics.totalCandidates} candidates · ${analytics.totalInterviews} completed interviews` : 'Loading…'}
        </p>
      </div>

      {/* Analytics strip — horizontal, not a grid */}
      {analytics && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto' }}>
          {[
            { label: 'Candidates', value: analytics.totalCandidates },
            { label: 'Interviews', value: analytics.totalInterviews },
            { label: 'Top score', value: analytics.topCandidates?.[0]?.averageScore?.toFixed(1) ? `${analytics.topCandidates[0].averageScore.toFixed(1)}/10` : '—' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: '12px 16px', flexShrink: 0 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: '1.286rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>

        {/* Candidate list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="input"
              style={{ flex: 1, height: 30, fontSize: '0.786rem' }}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              className="input"
              style={{ width: 52, height: 30, fontSize: '0.786rem' }}
              type="number" placeholder="≥" min="0" max="10"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleSearch}>↵</button>
          </div>

          {/* List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
            {loading
              ? [1,2,3,4,5].map((i) => <div key={i} style={{ padding: '0 12px' }}><SkeletonRow /></div>)
              : candidates.length === 0
              ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.857rem', margin: 0 }}>No candidates found</p>
                </div>
              )
              : candidates.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleSelect(c._id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: selected?.candidate?._id === c._id ? 'var(--accent-dim)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background var(--t-fast)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={(e) => { if (selected?.candidate?._id !== c._id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={(e) => { if (selected?.candidate?._id !== c._id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar name={c.name} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.totalInterviews} interview{c.totalInterviews !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.857rem', fontWeight: 600, flexShrink: 0,
                    color: c.averageScore >= 7 ? 'var(--green)' : c.averageScore >= 4 ? 'var(--yellow)' : 'var(--text-muted)',
                  }} className="mono">
                    {c.averageScore?.toFixed(1) || '—'}
                  </div>
                </button>
              ))
            }
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {!selected ? (
            <div style={{
              height: '100%', minHeight: 300,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border-mid)', borderRadius: 'var(--r-lg)',
              gap: 8,
            }}>
              <div style={{ fontSize: '0.857rem', color: 'var(--text-muted)' }}>
                Select a candidate to view their profile
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Candidate header */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <Avatar name={selected.candidate.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.071rem' }}>{selected.candidate.name}</h2>
                    <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>{selected.candidate.email}</div>
                    {selected.candidate.weakTopics?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {selected.candidate.weakTopics.slice(0, 4).map((t) => (
                          <Badge key={t} variant="red">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
                      {selected.candidate.averageScore?.toFixed(1) || '—'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>avg score</div>
                  </div>
                </div>

                {/* AI summary from last interview */}
                {selected.interviews?.[0]?.scorecard?.aiSummary && (
                  <div style={{
                    marginTop: 14, padding: '10px 13px',
                    background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)',
                    borderLeft: '2px solid var(--accent)',
                    fontSize: '0.829rem', color: 'var(--text-secondary)', lineHeight: 1.55,
                  }}>
                    {selected.interviews[0].scorecard.aiSummary}
                  </div>
                )}
              </div>

              {/* Interview history — compact */}
              {selected.interviews?.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid var(--border)' }}>
                    <h4 style={{ margin: 0, fontSize: '0.857rem' }}>Interview history</h4>
                  </div>
                  {selected.interviews.map((iv, i) => (
                    <div key={iv._id} style={{
                      padding: '12px 18px',
                      borderBottom: i < selected.interviews.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: iv.scorecard ? 8 : 0 }}>
                        <span style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }} className="truncate">
                          {iv.title}
                        </span>
                        <Badge variant={{ hr:'blue', technical:'purple', managerial:'yellow', coding:'green', mock:'gray' }[iv.round] || 'gray'}>
                          {iv.round}
                        </Badge>
                        {iv.scorecard?.overallScore != null && (
                          <span style={{ fontSize: '0.857rem', fontWeight: 600, color: 'var(--text-primary)' }} className="mono">
                            {iv.scorecard.overallScore}/10
                          </span>
                        )}
                      </div>
                      {iv.scorecard && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <ScoreBar label="Technical"     score={iv.scorecard.technicalScore || 0} />
                          <ScoreBar label="Communication" score={iv.scorecard.communicationScore || 0} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Hiring Analysis */}
              <HiringSummaryCard mode="recruiter" candidateId={selected.candidate._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
