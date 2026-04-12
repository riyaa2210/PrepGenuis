import React, { useEffect, useState, useCallback } from 'react';
import { getCandidatePool, rankCandidates } from '../services/candidateRankingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEIGHTS = { technical: 45, jdMatch: 30, communication: 15, confidence: 10 };

const verdictStyle = {
  YES:   { bg: 'bg-green-900/30 border-green-700',  text: 'text-green-400',  label: 'HIRE' },
  NO:    { bg: 'bg-red-900/30 border-red-700',      text: 'text-red-400',    label: 'NO HIRE' },
  MAYBE: { bg: 'bg-yellow-900/30 border-yellow-700',text: 'text-yellow-400', label: 'MAYBE' },
};

const levelBadge = {
  'Junior':       'blue',
  'Mid-level':    'purple',
  'Senior':       'green',
  'Not Suitable': 'red',
};

const rankMedal = (rank) => {
  if (rank === 1) return { emoji: '🥇', color: 'text-yellow-400' };
  if (rank === 2) return { emoji: '🥈', color: 'text-slate-300' };
  if (rank === 3) return { emoji: '🥉', color: 'text-amber-600' };
  return { emoji: `#${rank}`, color: 'text-slate-400' };
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniBar({ label, value, max = 10, color = 'bg-primary-500' }) {
  const pct = Math.round((value / max) * 100);
  const barColor = value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-300 w-8 text-right font-mono">{value}</span>
    </div>
  );
}

function CandidatePoolCard({ candidate, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(candidate._id)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? 'border-primary-500 bg-primary-900/20 ring-1 ring-primary-500'
          : 'border-slate-700 bg-dark-800 hover:border-slate-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
            selected ? 'bg-primary-600 border-primary-600' : 'border-slate-500'
          }`}>
            {selected && <span className="text-white text-xs">✓</span>}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{candidate.name}</p>
            <p className="text-xs text-slate-400">{candidate.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${
            candidate.averageScore >= 7 ? 'text-green-400' : candidate.averageScore >= 4 ? 'text-yellow-400' : 'text-red-400'
          }`}>{candidate.averageScore?.toFixed(1) || '—'}</p>
          <p className="text-xs text-slate-500">{candidate.totalInterviews} interviews</p>
        </div>
      </div>
    </button>
  );
}

function RankedCard({ result, isExpanded, onToggle }) {
  const medal  = rankMedal(result.rank);
  const verdict = verdictStyle[result.hire_recommendation] ?? verdictStyle.MAYBE;
  const meta   = result.meta || {};

  return (
    <div className={`rounded-xl border transition-all ${
      result.rank === 1 ? 'border-yellow-600/50 bg-yellow-900/5' :
      result.rank === 2 ? 'border-slate-500/50 bg-slate-800/30' :
      result.rank === 3 ? 'border-amber-700/50 bg-amber-900/5' :
      'border-slate-700 bg-dark-800'
    }`}>
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-4"
      >
        {/* Rank */}
        <div className={`text-2xl font-black w-10 text-center shrink-0 ${medal.color}`}>
          {medal.emoji}
        </div>

        {/* Name + level */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-white">{result.name}</p>
            <Badge variant={levelBadge[result.technical_level] || 'slate'}>
              {result.technical_level}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{result.reason}</p>
        </div>

        {/* Score + verdict */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xl font-black text-white">{result.score}</p>
            <p className="text-xs text-slate-400">composite</p>
          </div>
          <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${verdict.bg} ${verdict.text}`}>
            {verdict.label}
          </div>
          <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score breakdown */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Score Breakdown</p>
              <MiniBar label={`Technical (${WEIGHTS.technical}%)`}  value={meta.avgTechnicalScore}  />
              <MiniBar label={`JD Match (${WEIGHTS.jdMatch}%)`}     value={meta.jdMatchPercent}     max={100} />
              <MiniBar label={`Communication (${WEIGHTS.communication}%)`} value={meta.avgCommScore} />
              <MiniBar label={`Confidence (${WEIGHTS.confidence}%)`} value={meta.avgConfidenceScore} />
              <div className="border-t border-slate-700 pt-2 mt-2">
                <MiniBar label="Overall Avg" value={meta.avgOverallScore} />
              </div>
            </div>

            {/* Strengths & Gaps */}
            <div className="space-y-3">
              {result.key_strengths?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Key Strengths</p>
                  <ul className="space-y-1">
                    {result.key_strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-green-400 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.key_gaps?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Key Gaps</p>
                  <ul className="space-y-1">
                    {result.key_gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-red-400 mt-0.5">✗</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {meta.skills?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {meta.skills.slice(0, 12).map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{s}</span>
                ))}
                {meta.skills.length > 12 && (
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">+{meta.skills.length - 12} more</span>
                )}
              </div>
            </div>
          )}

          {/* Weak topics */}
          {meta.weakTopics?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Weak Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {meta.weakTopics.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-red-900/30 text-red-400 border border-red-800 rounded text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Full reason */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">AI Justification</p>
            <p className="text-sm text-slate-300 leading-relaxed">{result.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidateRankingPage() {
  const [pool, setPool]               = useState([]);
  const [selected, setSelected]       = useState(new Set());
  const [jd, setJd]                   = useState('');
  const [search, setSearch]           = useState('');
  const [results, setResults]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [poolLoading, setPoolLoading] = useState(true);
  const [expandedId, setExpandedId]   = useState(null);

  const fetchPool = useCallback(async (q = '') => {
    setPoolLoading(true);
    try {
      const { data } = await getCandidatePool({ search: q, limit: 50 });
      setPool(data.candidates);
    } catch { toast.error('Failed to load candidates'); }
    finally { setPoolLoading(false); }
  }, []);

  useEffect(() => { fetchPool(); }, [fetchPool]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(pool.map((c) => c._id)));
  const clearAll  = () => setSelected(new Set());

  const handleRank = async () => {
    if (selected.size < 2) return toast.error('Select at least 2 candidates');
    setLoading(true);
    setResults(null);
    setExpandedId(null);
    try {
      const { data } = await rankCandidates({
        candidateIds: [...selected],
        jobDescription: jd,
      });
      setResults(data);
      toast.success(`Ranked ${data.totalCandidates} candidates`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ranking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchPool(e.target.value);
  };

  // Summary stats from results
  const hireCount  = results?.ranked?.filter((r) => r.hire_recommendation === 'YES').length  || 0;
  const maybeCount = results?.ranked?.filter((r) => r.hire_recommendation === 'MAYBE').length || 0;
  const noCount    = results?.ranked?.filter((r) => r.hire_recommendation === 'NO').length    || 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Candidate Ranking</h2>
        <p className="text-slate-400 mt-1">AI-powered ranking by technical ability, JD match, and communication</p>
      </div>

      {/* Weight legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(WEIGHTS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${k === 'technical' ? 'bg-primary-500' : k === 'jdMatch' ? 'bg-purple-500' : k === 'communication' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-slate-300 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
            <span className="text-slate-500 font-bold">{v}%</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Candidate selector ── */}
        <div className="space-y-3">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Candidate Pool</h3>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-primary-400 hover:text-primary-300">All</button>
                <span className="text-slate-600">|</span>
                <button onClick={clearAll} className="text-slate-400 hover:text-slate-300">Clear</button>
              </div>
            </div>
            <input
              className="input text-sm mb-3"
              placeholder="Search candidates..."
              value={search}
              onChange={handleSearch}
            />
            <div className="text-xs text-slate-400 mb-2">
              {selected.size} selected · {pool.length} total
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {poolLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : pool.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-sm">No candidates found</div>
            ) : (
              pool.map((c) => (
                <CandidatePoolCard
                  key={c._id}
                  candidate={c}
                  selected={selected.has(c._id)}
                  onToggle={toggleSelect}
                />
              ))
            )}
          </div>

          {/* JD input */}
          <div className="card space-y-3">
            <label className="label">Job Description</label>
            <textarea
              className="input min-h-[120px] resize-none text-sm"
              placeholder="Paste the job description here for accurate JD match scoring…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <button
              onClick={handleRank}
              disabled={loading || selected.size < 2}
              className="btn-primary w-full py-3 text-base"
            >
              {loading
                ? <LoadingSpinner size="sm" text="Ranking candidates…" />
                : `🏆 Rank ${selected.size} Candidate${selected.size !== 1 ? 's' : ''}`}
            </button>
            {selected.size < 2 && (
              <p className="text-xs text-slate-500 text-center">Select at least 2 candidates</p>
            )}
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-2 space-y-4">
          {!results && !loading && (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-bold text-white mb-2">AI Candidate Ranking</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Select candidates from the pool, optionally paste a job description, then click Rank.
              </p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-slate-400 text-sm">Analysing {selected.size} candidates…</p>
            </div>
          )}

          {results && !loading && (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Hire',     count: hireCount,  color: 'text-green-400',  bg: 'bg-green-900/20 border-green-800' },
                  { label: 'Maybe',    count: maybeCount, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800' },
                  { label: 'No Hire',  count: noCount,    color: 'text-red-400',    bg: 'bg-red-900/20 border-red-800' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>{results.totalCandidates} candidates ranked · {new Date(results.generatedAt).toLocaleString()}</span>
                <button onClick={handleRank} className="text-primary-400 hover:text-primary-300">↻ Re-rank</button>
              </div>

              {/* Ranked list */}
              <div className="space-y-3">
                {results.ranked.map((r) => (
                  <RankedCard
                    key={r.candidate_id}
                    result={r}
                    isExpanded={expandedId === r.candidate_id}
                    onToggle={() => setExpandedId(expandedId === r.candidate_id ? null : r.candidate_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
