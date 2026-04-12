import React, { useState } from 'react';
import { analyzeSelf, analyzeCandidate } from '../../services/hiringAnalysisService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────────────────────

const verdictConfig = {
  YES:   { bg: 'bg-green-900/30',  border: 'border-green-600',  text: 'text-green-400',  icon: '✅', label: 'HIRE' },
  NO:    { bg: 'bg-red-900/30',    border: 'border-red-600',    text: 'text-red-400',    icon: '❌', label: 'DO NOT HIRE' },
  MAYBE: { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-400', icon: '⚠️', label: 'MAYBE — NEEDS REVIEW' },
};

const levelConfig = {
  'Junior':       'bg-blue-900/40 text-blue-300 border-blue-700',
  'Mid-level':    'bg-purple-900/40 text-purple-300 border-purple-700',
  'Senior':       'bg-green-900/40 text-green-300 border-green-700',
  'Not Suitable': 'bg-red-900/40 text-red-300 border-red-700',
};

function ScorePill({ label, value }) {
  const color = value >= 7 ? 'text-green-400' : value >= 4 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex flex-col items-center bg-slate-800 rounded-lg px-4 py-3 min-w-[80px]">
      <span className={`text-xl font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-xs text-slate-400 mt-0.5 text-center">{label}</span>
    </div>
  );
}

function Section({ icon, title, items, variant = 'neutral' }) {
  const colors = {
    green:   'border-green-700/40 bg-green-900/10',
    red:     'border-red-700/40 bg-red-900/10',
    yellow:  'border-yellow-700/40 bg-yellow-900/10',
    neutral: 'border-slate-700 bg-slate-800/40',
  };
  const dotColors = {
    green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-yellow-500', neutral: 'bg-slate-500',
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border p-4 ${colors[variant]}`}>
      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HiringSummaryCard({ candidateId = null, mode = 'self' }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const { data } = mode === 'recruiter' && candidateId
        ? await analyzeCandidate(candidateId)
        : await analyzeSelf();
      setSummary(data.summary);
      toast.success('Hiring analysis generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const verdict = summary ? verdictConfig[summary.hire_recommendation] ?? verdictConfig.MAYBE : null;
  const levelClass = summary?.technical_level
    ? Object.entries(levelConfig).find(([k]) => summary.technical_level.startsWith(k))?.[1] ?? 'bg-slate-700 text-slate-300 border-slate-600'
    : '';

  return (
    <div className="space-y-4">
      {/* Trigger */}
      {!summary && !loading && (
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">🧑‍⚖️</div>
          <h3 className="text-lg font-bold text-white mb-1">AI Hiring Analysis</h3>
          <p className="text-slate-400 text-sm mb-5 max-w-sm mx-auto">
            Get a strict, recruiter-grade hiring recommendation based on all interview data, scores, and resume.
          </p>
          <button onClick={handleGenerate} className="btn-primary px-8 py-3 text-base">
            Generate Hiring Summary
          </button>
        </div>
      )}

      {loading && (
        <div className="card flex flex-col items-center py-14 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 text-sm">Analysing interview data like a real recruiter…</p>
        </div>
      )}

      {summary && verdict && (
        <div className="space-y-4">
          {/* Header — Verdict */}
          <div className={`rounded-xl border-2 p-6 ${verdict.bg} ${verdict.border}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Hiring Recommendation</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{verdict.icon}</span>
                  <span className={`text-2xl font-black ${verdict.text}`}>{verdict.label}</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg border text-sm font-semibold ${levelClass}`}>
                {summary.technical_level}
              </div>
            </div>
            <p className="text-slate-300 text-sm mt-4 leading-relaxed border-t border-slate-700 pt-4">
              {summary.reason}
            </p>
          </div>

          {/* Score Pills */}
          <div className="card">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Aggregate Scores</p>
            <div className="flex flex-wrap gap-3">
              <ScorePill label="Overall" value={summary.meta?.avgOverallScore} />
              <ScorePill label="Technical" value={summary.meta?.avgTechnicalScore} />
              <ScorePill label="Communication" value={summary.meta?.avgCommunicationScore} />
              <div className="flex flex-col items-center bg-slate-800 rounded-lg px-4 py-3 min-w-[80px]">
                <span className="text-xl font-bold text-slate-200">{summary.meta?.interviewsAnalyzed}</span>
                <span className="text-xs text-slate-400 mt-0.5">Interviews</span>
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className="card">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Communication Assessment</p>
            <p className="text-slate-300 text-sm leading-relaxed">{summary.communication}</p>
          </div>

          {/* Strengths / Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon="✅" title="Strengths" items={summary.strengths} variant="green" />
            <Section icon="📌" title="Weaknesses" items={summary.weaknesses} variant="red" />
          </div>

          {/* Red Flags */}
          {summary.red_flags?.length > 0 && (
            <Section icon="🚩" title="Red Flags" items={summary.red_flags} variant="yellow" />
          )}

          {/* Suggested Follow-up */}
          {summary.suggested_follow_up && summary.suggested_follow_up !== 'None' && (
            <div className="card border-blue-700/40 bg-blue-900/10">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">💡 Suggested Follow-up</p>
              <p className="text-slate-300 text-sm">{summary.suggested_follow_up}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Generated: {new Date(summary.meta?.generatedAt).toLocaleString()}</span>
            <button
              onClick={handleGenerate}
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              ↻ Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
