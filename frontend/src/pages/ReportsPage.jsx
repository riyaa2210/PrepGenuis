import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterviews } from '../services/interviewService';
import Badge from '../components/ui/Badge';
import { SkeletonRow } from '../components/ui/SkeletonLoader';

const ROUND_BADGE  = { hr:'blue', technical:'purple', managerial:'yellow', coding:'green', mock:'gray' };
const ROUND_ICON   = { hr:'🤝', technical:'💻', managerial:'🏢', coding:'⌨️', mock:'🎯' };
const STATUS_BADGE = { completed:'green', in_progress:'yellow', scheduled:'gray' };

function ScoreChip({ score }) {
  if (score == null) return <span style={{ fontSize:'0.786rem', color:'var(--text-muted)' }}>—</span>;
  const color = score >= 7 ? 'var(--green)' : score >= 4 ? 'var(--yellow)' : 'var(--red)';
  const bg    = score >= 7 ? 'var(--green-dim)' : score >= 4 ? 'var(--yellow-dim)' : 'var(--red-dim)';
  return (
    <div style={{
      display:'inline-flex', alignItems:'baseline', gap:1,
      background:bg, borderRadius:6, padding:'3px 8px',
    }}>
      <span style={{ fontSize:'0.929rem', fontWeight:700, color, letterSpacing:'-0.02em' }} className="mono">{score}</span>
      <span style={{ fontSize:'0.643rem', color, opacity:0.7 }}>/10</span>
    </div>
  );
}

export default function ReportsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ round:'', status:'', page:1 });
  const [total, setTotal]           = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = { limit:15, page:filters.page };
    if (filters.round)  params.round  = filters.round;
    if (filters.status) params.status = filters.status;
    getInterviews(params)
      .then(({ data }) => { setInterviews(data.interviews||[]); setTotal(data.total||0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const pages = Math.ceil(total / 15);

  return (
    <div style={{ maxWidth:920, display:'flex', flexDirection:'column', gap:20 }} className="anim-fade-up">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:'0 0 4px' }}>Reports</h1>
          <p style={{ margin:0, fontSize:'0.857rem' }}>
            {total > 0 ? `${total} interview${total!==1?'s':''} recorded` : 'No interviews yet'}
          </p>
        </div>
        <Link to="/interview/setup" className="btn btn-primary">+ New Interview</Link>
      </div>

      {/* Filter bar */}
      <div style={{
        display:'flex', gap:8, alignItems:'center',
        padding:'10px 14px',
        background:'var(--bg-surface)',
        border:'1px solid var(--border)',
        borderRadius:'var(--r-md)',
      }}>
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginRight:4 }}>Filter:</span>
        <select className="input" style={{ width:'auto', height:28, fontSize:'0.786rem', background:'var(--bg-elevated)' }}
          value={filters.round} onChange={e => setFilters({...filters, round:e.target.value, page:1})}>
          <option value="">All rounds</option>
          {['mock','hr','technical','managerial','coding'].map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
          ))}
        </select>
        <select className="input" style={{ width:'auto', height:28, fontSize:'0.786rem', background:'var(--bg-elevated)' }}
          value={filters.status} onChange={e => setFilters({...filters, status:e.target.value, page:1})}>
          <option value="">All status</option>
          {['completed','in_progress','scheduled'].map(s => (
            <option key={s} value={s}>{s.replace('_',' ')}</option>
          ))}
        </select>
        {(filters.round || filters.status) && (
          <button className="btn btn-ghost btn-xs" onClick={() => setFilters({round:'',status:'',page:1})}>
            ✕ Clear
          </button>
        )}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{total} results</span>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ padding:'0 20px' }}><SkeletonRow /></div>
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="empty-state" style={{ border:'1px dashed var(--border-mid)', borderRadius:'var(--r-lg)' }}>
          <div className="empty-icon">📊</div>
          <h4 style={{ color:'var(--text-primary)', margin:0 }}>No interviews found</h4>
          <p style={{ fontSize:'0.857rem', margin:0 }}>Adjust filters or start a new interview.</p>
          <Link to="/interview/setup" className="btn btn-primary btn-sm" style={{ marginTop:10 }}>
            Start Interview
          </Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {interviews.map(iv => (
            <Link key={iv._id} to={`/reports/${iv._id}`} style={{ textDecoration:'none' }}>
              <div
                className="card"
                style={{
                  padding:'14px 18px',
                  display:'flex', alignItems:'center', gap:14,
                  transition:'border-color var(--t-fast), background var(--t-fast)',
                  cursor:'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-mid)'; e.currentTarget.style.background='var(--bg-elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-surface)'; }}
              >
                {/* Round icon */}
                <div style={{
                  width:38, height:38, borderRadius:'var(--r-md)',
                  background:'var(--bg-overlay)', border:'1px solid var(--border-strong)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, flexShrink:0,
                }}>
                  {ROUND_ICON[iv.round] || '🎯'}
                </div>

                {/* Title + meta */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500, color:'var(--text-primary)', fontSize:'0.929rem', marginBottom:4 }} className="truncate">
                    {iv.title}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                    <Badge variant={ROUND_BADGE[iv.round]||'gray'}>{iv.round}</Badge>
                    <Badge variant={STATUS_BADGE[iv.status]||'gray'} dot>{iv.status.replace('_',' ')}</Badge>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                      {iv.questions?.length||0} questions
                      {iv.duration > 0 && ` · ${Math.round(iv.duration/60)} min`}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div style={{ flexShrink:0, textAlign:'right' }}>
                  <ScoreChip score={iv.scorecard?.overallScore} />
                  <div style={{ fontSize:'0.714rem', color:'var(--text-muted)', marginTop:4 }}>
                    {new Date(iv.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </div>
                </div>

                <span style={{ color:'var(--text-muted)', fontSize:12, flexShrink:0 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
          <button className="btn btn-secondary btn-sm" disabled={filters.page===1}
            onClick={() => setFilters(f => ({...f, page:f.page-1}))}>← Prev</button>
          {Array.from({length:pages},(_,i)=>i+1).map(p => (
            <button key={p}
              className={`btn btn-sm ${filters.page===p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilters(f => ({...f, page:p}))}>{p}</button>
          ))}
          <button className="btn btn-secondary btn-sm" disabled={filters.page===pages}
            onClick={() => setFilters(f => ({...f, page:f.page+1}))}>Next →</button>
        </div>
      )}
    </div>
  );
}
