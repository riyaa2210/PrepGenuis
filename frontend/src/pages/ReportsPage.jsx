import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterviews } from '../services/interviewService';
import Badge from '../components/ui/Badge';
import { SkeletonRow } from '../components/ui/SkeletonLoader';

const ROUND_BADGE = { hr: 'blue', technical: 'purple', managerial: 'yellow', coding: 'green', mock: 'gray' };
const STATUS_BADGE = { completed: 'green', in_progress: 'yellow', scheduled: 'gray' };

export default function ReportsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ round: '', status: '', page: 1 });
  const [total, setTotal]           = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 15, page: filters.page };
    if (filters.round)  params.round  = filters.round;
    if (filters.status) params.status = filters.status;
    getInterviews(params)
      .then(({ data }) => { setInterviews(data.interviews || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const pages = Math.ceil(total / 15);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }} className="anim-fade-up">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.857rem' }}>{total} interview{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/interview/setup" className="btn btn-primary">+ New Interview</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select className="input" style={{ width: 'auto', height: 30, fontSize: '0.786rem' }}
          value={filters.round} onChange={(e) => setFilters({ ...filters, round: e.target.value, page: 1 })}>
          <option value="">All rounds</option>
          {['mock','hr','technical','managerial','coding'].map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select className="input" style={{ width: 'auto', height: 30, fontSize: '0.786rem' }}
          value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All status</option>
          {['completed','in_progress','scheduled'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        {(filters.round || filters.status) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ round: '', status: '', page: 1 })}>
            Clear filters
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>{total} results</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Interview</th>
              <th>Round</th>
              <th>Status</th>
              <th>Score</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [1,2,3,4,5].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <SkeletonRow />
                    </td>
                  </tr>
                ))
              : interviews.length === 0
              ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">≡</div>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>No interviews found</h4>
                      <p style={{ fontSize: '0.857rem', margin: 0 }}>Try adjusting your filters or start a new interview.</p>
                    </div>
                  </td>
                </tr>
              )
              : interviews.map((iv) => (
                <tr key={iv._id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.857rem' }}>{iv.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {iv.questions?.length || 0} questions · {Math.round((iv.duration || 0) / 60)} min
                    </div>
                  </td>
                  <td><Badge variant={ROUND_BADGE[iv.round] || 'gray'}>{iv.round}</Badge></td>
                  <td><Badge variant={STATUS_BADGE[iv.status] || 'gray'} dot>{iv.status.replace('_', ' ')}</Badge></td>
                  <td>
                    {iv.scorecard?.overallScore != null ? (
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {iv.scorecard.overallScore}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>/10</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.786rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.786rem', whiteSpace: 'nowrap' }}>
                    {new Date(iv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <Link to={`/reports/${iv._id}`} className="btn btn-ghost btn-sm">View →</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" disabled={filters.page === 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p}
              className={`btn btn-sm ${filters.page === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilters((f) => ({ ...f, page: p }))}>{p}</button>
          ))}
          <button className="btn btn-secondary btn-sm" disabled={filters.page === pages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next →</button>
        </div>
      )}
    </div>
  );
}
