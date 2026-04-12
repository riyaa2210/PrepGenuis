import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterview } from '../services/interviewService';
import { downloadReportPDF, triggerDownload } from '../services/pdfService';
import Badge from '../components/ui/Badge';
import ScoreBar from '../components/ui/ScoreBar';
import RingChart from '../components/ui/RingChart';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const ROUND_BADGE = { hr:'blue', technical:'purple', managerial:'yellow', coding:'green', mock:'gray' };

export default function ReportDetailPage() {
  const { id } = useParams();
  const [interview, setInterview]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [expandedQ, setExpandedQ]     = useState(null);

  useEffect(() => {
    getInterview(id)
      .then(({ data }) => setInterview(data.interview))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await downloadReportPDF(id);
      triggerDownload(data, `report-${id}.pdf`);
    } catch { toast.error('Failed to generate PDF'); }
    finally { setDownloading(false); }
  };

  if (loading) return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1,2,3].map((i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (!interview) return (
    <div className="empty-state">
      <div className="empty-icon">≡</div>
      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Report not found</h4>
      <Link to="/reports" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>← Reports</Link>
    </div>
  );

  const sc = interview.scorecard;

  return (
    <div style={{ maxWidth: 760 }} className="anim-fade-up">

      {/* Nav row — minimal */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Link to="/reports" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-tertiary)', marginLeft: -8 }}>
          ← Reports
        </Link>
        <div style={{ flex: 1 }} />
        {interview.status === 'completed' && (
          <button className="btn btn-secondary btn-sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? '…' : '↓ PDF'}
          </button>
        )}
      </div>

      {/* Title block — score is inline, not a separate card */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ marginBottom: 8, fontSize: '1.286rem' }}>{interview.title}</h1>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge variant={ROUND_BADGE[interview.round] || 'gray'}>{interview.round}</Badge>
              <Badge variant={interview.status === 'completed' ? 'green' : 'yellow'} dot>
                {interview.status.replace('_', ' ')}
              </Badge>
              <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
                {new Date(interview.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              {interview.duration > 0 && (
                <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
                  · {Math.round(interview.duration / 60)} min
                </span>
              )}
            </div>
          </div>
          {sc?.overallScore != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.05em',
                color: sc.overallScore >= 7 ? 'var(--green)' : sc.overallScore >= 4 ? 'var(--yellow)' : 'var(--red)',
                lineHeight: 1,
              }}>
                {sc.overallScore}
              </div>
              <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>out of 10</div>
            </div>
          )}
        </div>
      </div>

      {sc && (
        <>
          {/* Scores — asymmetric: bars take 60%, rings take 40% */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12, marginBottom: 12 }}>
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14 }}>
                Score breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <ScoreBar label="Technical"     score={sc.technicalScore || 0} />
                <ScoreBar label="Communication" score={sc.communicationScore || 0} />
                <ScoreBar label="Confidence"    score={sc.confidenceScore || 0} />
                <ScoreBar label="Clarity"       score={sc.clarityScore || 0} />
              </div>
            </div>

            {/* Rings — left-aligned, not centered */}
            <div className="card" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                <RingChart score={sc.technicalScore || 0}     label="Tech"  size={62} strokeWidth={5} />
                <RingChart score={sc.communicationScore || 0} label="Comm"  size={62} strokeWidth={5} />
                <RingChart score={sc.confidenceScore || 0}    label="Conf"  size={62} strokeWidth={5} />
              </div>
            </div>
          </div>

          {/* AI Summary — full width, distinct treatment */}
          {sc.aiSummary && (
            <div style={{
              padding: '14px 18px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--r-md)',
              marginBottom: 12,
            }}>
              <div style={{ fontSize: '0.714rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                AI summary
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                {sc.aiSummary}
              </p>
            </div>
          )}

          {/* Strengths + Improvements — intentionally unequal when one has more items */}
          {(sc.strengths?.length > 0 || sc.improvements?.length > 0) && (
            <div style={{
              display: 'grid',
              /* Wider column for whichever has more items */
              gridTemplateColumns: sc.strengths?.length >= (sc.improvements?.length || 0) ? '1.1fr 0.9fr' : '0.9fr 1.1fr',
              gap: 12,
              marginBottom: 12,
            }}>
              {sc.strengths?.length > 0 && (
                <div className="card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--green)', marginBottom: 10, letterSpacing: '0.03em' }}>
                    Strengths
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {sc.strengths.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sc.improvements?.length > 0 && (
                <div className="card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--yellow)', marginBottom: 10, letterSpacing: '0.03em' }}>
                    To improve
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {sc.improvements.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }}>→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Filler words — inline, not a card */}
          {sc.fillerWordsDetected?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: 'var(--yellow-dim)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 'var(--r-sm)' }}>
              <span style={{ fontSize: '0.786rem', color: 'var(--yellow)', fontWeight: 500, flexShrink: 0 }}>
                Filler words
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {sc.fillerWordsDetected.map((w) => <Badge key={w} variant="yellow">{w}</Badge>)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Q&A — the main content, gets the most vertical space */}
      {interview.answers?.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Q&A review</h3>
            <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
              {interview.answers.length} question{interview.answers.length !== 1 ? 's' : ''}
            </span>
          </div>
          {interview.answers.map((a, i) => {
            const score = a.aiEvaluation?.score;
            const isOpen = expandedQ === i;
            return (
              <div key={i} style={{ borderBottom: i < interview.answers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <button
                  onClick={() => setExpandedQ(isOpen ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left',
                    /* Slightly more padding on first item — creates visual entry point */
                    padding: i === 0 ? '14px 20px 12px' : '12px 20px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'background var(--t-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: isOpen ? 'var(--accent-dim)' : 'var(--bg-overlay)',
                    border: `1px solid ${isOpen ? 'rgba(95,98,232,0.3)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.714rem', fontWeight: 600,
                    color: isOpen ? '#a5b4fc' : 'var(--text-muted)',
                  }}>{i + 1}</div>
                  <span style={{ flex: 1, fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    {a.question}
                  </span>
                  {score != null && (
                    <span style={{
                      fontSize: '0.857rem', fontWeight: 600, flexShrink: 0,
                      color: score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--yellow)' : 'var(--red)',
                    }} className="mono">
                      {score}/10
                    </span>
                  )}
                  <span style={{
                    color: 'var(--text-muted)', fontSize: 10, flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--t-base)',
                  }}>▼</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 16px 54px', display: 'flex', flexDirection: 'column', gap: 10 }}
                    className="anim-fade-up">
                    {/* Answer */}
                    <div style={{
                      background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)',
                      padding: '10px 13px',
                    }}>
                      <div style={{ fontSize: '0.714rem', color: 'var(--text-muted)', marginBottom: 5 }}>Your answer</div>
                      <p style={{ margin: 0, fontSize: '0.857rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                        {a.answer || '(No answer provided)'}
                      </p>
                    </div>
                    {/* Feedback */}
                    {a.aiEvaluation?.feedback && (
                      <p style={{ margin: 0, fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {a.aiEvaluation.feedback}
                      </p>
                    )}
                    {/* Model answer — collapsed by default */}
                    {a.aiEvaluation?.betterAnswer && (
                      <details>
                        <summary style={{
                          cursor: 'pointer', fontSize: '0.786rem',
                          color: 'var(--accent-light)', userSelect: 'none',
                          listStyle: 'none', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <span>▷</span> View model answer
                        </summary>
                        <div style={{
                          marginTop: 8, padding: '10px 13px',
                          background: 'var(--accent-glow)',
                          border: '1px solid rgba(95,98,232,0.15)',
                          borderRadius: 'var(--r-sm)',
                          fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                          {a.aiEvaluation.betterAnswer}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
