import React, { useState } from 'react';
import { analyzeATS, analyzeSpeech, analyzeBehavior } from '../services/intelligenceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Shared helpers ────────────────────────────────────────────────────────────

const ScoreRing = ({ score, max = 10, label, size = 'md' }) => {
  const pct   = Math.round((score / max) * 100);
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
  const r = size === 'lg' ? 44 : 32;
  const stroke = size === 'lg' ? 6 : 5;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={r * 2 + stroke * 2} height={r * 2 + stroke * 2}>
        <circle cx={r + stroke} cy={r + stroke} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle cx={r + stroke} cy={r + stroke} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${r + stroke} ${r + stroke})`} />
        <text x={r + stroke} y={r + stroke + (size === 'lg' ? 6 : 5)}
          textAnchor="middle" fill="white" fontSize={size === 'lg' ? 16 : 12} fontWeight="bold">
          {score}
        </text>
      </svg>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
};

const Chip = ({ text, variant = 'slate' }) => {
  const colors = {
    green:  'bg-green-900/40 text-green-300 border-green-700',
    red:    'bg-red-900/40 text-red-300 border-red-700',
    yellow: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
    blue:   'bg-blue-900/40 text-blue-300 border-blue-700',
    slate:  'bg-slate-700 text-slate-300 border-slate-600',
  };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[variant]}`}>{text}</span>;
};

const BulletList = ({ items = [], icon = '•', iconColor = 'text-slate-400' }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
        <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
        {item}
      </li>
    ))}
  </ul>
);

const verdictColor = (v = '') => {
  const u = v.toUpperCase();
  if (u.includes('STRONG') || u.includes('EXCELLENT') || u.includes('GOOD')) return 'text-green-400';
  if (u.includes('MODERATE') || u.includes('MAYBE') || u.includes('NEUTRAL')) return 'text-yellow-400';
  return 'text-red-400';
};

// ── TAB 1: ATS Analyzer ───────────────────────────────────────────────────────

function ATSTab() {
  const [jd, setJd]         = useState('');
  const [resume, setResume] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!jd.trim()) return toast.error('Job description is required');
    setLoading(true); setResult(null);
    try {
      const { data } = await analyzeATS({ jobDescription: jd, resumeText: resume || undefined });
      setResult(data.ats);
      toast.success('ATS analysis complete');
    } catch (e) { toast.error(e.response?.data?.message || 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const scoreColor = (s) => s >= 70 ? 'text-green-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400';
  const verdictBg  = (v = '') => {
    if (v.includes('STRONG'))   return 'bg-green-900/30 border-green-600 text-green-400';
    if (v.includes('MODERATE')) return 'bg-yellow-900/30 border-yellow-600 text-yellow-400';
    return 'bg-red-900/30 border-red-600 text-red-400';
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="label">Job Description *</label>
          <textarea className="input min-h-[180px] resize-none text-sm"
            placeholder="Paste the full job description here…"
            value={jd} onChange={(e) => setJd(e.target.value)} />
        </div>
        <div>
          <label className="label">Resume Text <span className="text-slate-500">(optional — uses stored resume if blank)</span></label>
          <textarea className="input min-h-[180px] resize-none text-sm"
            placeholder="Paste resume text, or leave blank to use your uploaded resume…"
            value={resume} onChange={(e) => setResume(e.target.value)} />
        </div>
      </div>
      <button onClick={handleAnalyze} disabled={loading || !jd.trim()} className="btn-primary px-8 py-3">
        {loading ? <LoadingSpinner size="sm" text="Scanning resume…" /> : '🔍 Run ATS Scan'}
      </button>

      {result && (
        <div className="space-y-4 pt-2">
          {/* Score header */}
          <div className="card flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center">
              <span className={`text-6xl font-black ${scoreColor(result.match_score)}`}>{result.match_score}</span>
              <span className="text-slate-400 text-sm">/ 100</span>
              <span className="text-xs text-slate-500 mt-1">ATS Match Score</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className={`inline-flex px-4 py-1.5 rounded-lg border text-sm font-bold ${verdictBg(result.ats_verdict)}`}>
                {result.ats_verdict}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {/* Section scores */}
          {result.section_scores && (
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Section Breakdown</p>
              <div className="flex flex-wrap gap-6 justify-around">
                {Object.entries(result.section_scores).map(([k, v]) => (
                  <ScoreRing key={k} score={v} max={100}
                    label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
                ))}
              </div>
            </div>
          )}

          {/* Skills grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">✅ Matched Skills ({result.matched_skills?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {result.matched_skills?.length > 0
                  ? result.matched_skills.map((s) => <Chip key={s} text={s} variant="green" />)
                  : <p className="text-slate-500 text-sm">None matched</p>}
              </div>
            </div>
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">❌ Missing Skills ({result.missing_skills?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills?.length > 0
                  ? result.missing_skills.map((s) => <Chip key={s} text={s} variant="red" />)
                  : <p className="text-slate-500 text-sm">None missing</p>}
              </div>
            </div>
          </div>

          {/* Keywords */}
          {result.keyword_density && (
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">High-Impact Keywords</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-green-400 mb-2">Present in Resume</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keyword_density.high_impact_present?.map((k) => <Chip key={k} text={k} variant="green" />)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-red-400 mb-2">Missing from Resume</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keyword_density.high_impact_missing?.map((k) => <Chip key={k} text={k} variant="red" />)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.improvement_suggestions?.length > 0 && (
            <div className="card border-blue-700/30 bg-blue-900/10">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">💡 Improvement Suggestions</p>
              <BulletList items={result.improvement_suggestions} icon="→" iconColor="text-blue-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── TAB 2: Speech Analyzer ────────────────────────────────────────────────────

function SpeechTab() {
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration]     = useState('');
  const [context, setContext]       = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return toast.error('Transcript is required');
    setLoading(true); setResult(null);
    try {
      const { data } = await analyzeSpeech({
        transcript,
        durationSeconds: duration ? parseInt(duration) : undefined,
        questionContext: context || undefined,
      });
      setResult(data.speech);
      toast.success('Speech analysis complete');
    } catch (e) { toast.error(e.response?.data?.message || 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const paceColor = (p = '') =>
    p === 'Good' ? 'text-green-400' : p === 'Unknown' ? 'text-slate-400' : 'text-yellow-400';

  const verdictBadge = (v = '') => {
    if (v === 'Excellent') return 'bg-green-900/30 border-green-600 text-green-400';
    if (v === 'Good')      return 'bg-blue-900/30 border-blue-600 text-blue-400';
    if (v === 'Needs Improvement') return 'bg-yellow-900/30 border-yellow-600 text-yellow-400';
    return 'bg-red-900/30 border-red-600 text-red-400';
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="label">Speech Transcript *</label>
            <textarea className="input min-h-[180px] resize-none text-sm"
              placeholder="Paste the candidate's spoken answer transcript here…"
              value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duration (seconds)</label>
              <input type="number" className="input" placeholder="e.g. 90"
                value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
            </div>
            <div>
              <label className="label">Question Context</label>
              <input type="text" className="input" placeholder="e.g. Tell me about yourself"
                value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Live filler preview */}
        <div className="card bg-slate-800/50">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Live Filler Word Preview</p>
          {transcript ? (() => {
            const fillers = ['um','uh','like','you know','basically','literally','actually','right','so','kind of','sort of','i mean'];
            const found = fillers.filter((f) => new RegExp(`\\b${f}\\b`, 'i').test(transcript));
            return found.length > 0
              ? <div className="flex flex-wrap gap-2">{found.map((f) => <Chip key={f} text={f} variant="yellow" />)}</div>
              : <p className="text-green-400 text-sm">✓ No filler words detected in preview</p>;
          })()
          : <p className="text-slate-500 text-sm">Start typing to see filler word preview…</p>}

          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Word count</p>
            <p className="text-2xl font-bold text-white">
              {transcript.trim() ? transcript.trim().split(/\s+/).length : 0}
            </p>
          </div>
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={loading || !transcript.trim()} className="btn-primary px-8 py-3">
        {loading ? <LoadingSpinner size="sm" text="Analysing speech…" /> : '🎤 Analyse Speech'}
      </button>

      {result && (
        <div className="space-y-4 pt-2">
          {/* Score header */}
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-6">
                <ScoreRing score={result.clarity_score}    label="Clarity"    size="lg" />
                <ScoreRing score={result.confidence_score} label="Confidence" size="lg" />
              </div>
              <div className="space-y-2 text-right">
                <div className={`inline-flex px-4 py-1.5 rounded-lg border text-sm font-bold ${verdictBadge(result.overall_verdict)}`}>
                  {result.overall_verdict}
                </div>
                <div className="flex gap-4 text-sm justify-end">
                  <span className="text-slate-400">Words: <span className="text-white font-bold">{result.word_count}</span></span>
                  {result.estimated_wpm && (
                    <span className="text-slate-400">WPM: <span className={`font-bold ${paceColor(result.pace_assessment)}`}>{result.estimated_wpm}</span></span>
                  )}
                  <span className="text-slate-400">Pace: <span className={`font-bold ${paceColor(result.pace_assessment)}`}>{result.pace_assessment}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Filler words */}
          {result.filler_words_detected?.length > 0 && (
            <div className="card border-yellow-700/30 bg-yellow-900/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 uppercase tracking-widest">⚠️ Filler Words Detected</p>
                <span className="text-yellow-400 text-sm font-bold">{result.filler_ratio_percent}% of speech</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.filler_words_detected.map((f) => <Chip key={f} text={f} variant="yellow" />)}
              </div>
            </div>
          )}

          {/* Best / Worst moments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.strongest_moment && (
              <div className="card border-green-700/30 bg-green-900/10">
                <p className="text-xs text-green-400 uppercase tracking-widest mb-2">💪 Strongest Moment</p>
                <p className="text-sm text-slate-300 italic">"{result.strongest_moment}"</p>
              </div>
            )}
            {result.weakest_moment && (
              <div className="card border-red-700/30 bg-red-900/10">
                <p className="text-xs text-red-400 uppercase tracking-widest mb-2">📌 Weakest Moment</p>
                <p className="text-sm text-slate-300 italic">"{result.weakest_moment}"</p>
              </div>
            )}
          </div>

          {/* Feedback + Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.speaking_feedback?.length > 0 && (
              <div className="card">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Observations</p>
                <BulletList items={result.speaking_feedback} icon="→" iconColor="text-slate-400" />
              </div>
            )}
            {result.improvement_tips?.length > 0 && (
              <div className="card border-blue-700/30 bg-blue-900/10">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">💡 Improvement Tips</p>
                <BulletList items={result.improvement_tips} icon="✦" iconColor="text-blue-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 3: Behavioral Analyzer ────────────────────────────────────────────────

function BehaviorTab() {
  const [form, setForm] = useState({
    eyeContactPercent: 65,
    confident: 55, nervous: 20, neutral: 20, happy: 5,
    stable: 70, nodding: 20, excessive: 10,
    durationSeconds: 1800,
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: parseFloat(v) || 0 }));

  const handleAnalyze = async () => {
    setLoading(true); setResult(null);
    try {
      const { data } = await analyzeBehavior({
        eyeContactPercent: form.eyeContactPercent,
        facialEmotions:    { confident: form.confident, nervous: form.nervous, neutral: form.neutral, happy: form.happy },
        headMovementData:  { stable: form.stable, nodding: form.nodding, excessive: form.excessive },
        durationSeconds:   form.durationSeconds,
      });
      setResult(data.behavior);
      toast.success('Behavioral analysis complete');
    } catch (e) { toast.error(e.response?.data?.message || 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const hireSignalColor = (s = '') => {
    if (s.includes('Strong Positive') || s.includes('Positive')) return 'text-green-400 border-green-600 bg-green-900/30';
    if (s.includes('Neutral'))   return 'text-yellow-400 border-yellow-600 bg-yellow-900/30';
    return 'text-red-400 border-red-600 bg-red-900/30';
  };

  const SliderRow = ({ label, field, color = 'bg-primary-500' }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">{form[field]}%</span>
      </div>
      <input type="range" min="0" max="100" value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700"
        style={{ accentColor: color === 'bg-primary-500' ? '#3b82f6' : color === 'bg-green-500' ? '#22c55e' : color === 'bg-red-500' ? '#ef4444' : '#eab308' }}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Eye contact */}
        <div className="card space-y-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest">👁 Eye Contact</p>
          <div className="flex justify-center">
            <ScoreRing score={Math.round(form.eyeContactPercent / 10)} max={10} label="Eye Contact" size="lg" />
          </div>
          <SliderRow label="Eye Contact %" field="eyeContactPercent" color="bg-primary-500" />
          <div>
            <label className="label text-xs">Duration (seconds)</label>
            <input type="number" className="input text-sm" value={form.durationSeconds}
              onChange={(e) => set('durationSeconds', e.target.value)} min="60" />
          </div>
        </div>

        {/* Facial emotions */}
        <div className="card space-y-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest">😊 Facial Emotions</p>
          <SliderRow label="Confident" field="confident" color="bg-green-500" />
          <SliderRow label="Nervous"   field="nervous"   color="bg-red-500" />
          <SliderRow label="Neutral"   field="neutral"   color="bg-slate-500" />
          <SliderRow label="Happy / Engaged" field="happy" color="bg-yellow-500" />
          <p className="text-xs text-slate-500">Total: {form.confident + form.nervous + form.neutral + form.happy}% (aim for ~100)</p>
        </div>

        {/* Head movement */}
        <div className="card space-y-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest">🗣 Head Movement</p>
          <SliderRow label="Stable"    field="stable"    color="bg-green-500" />
          <SliderRow label="Nodding"   field="nodding"   color="bg-blue-500" />
          <SliderRow label="Excessive" field="excessive" color="bg-red-500" />
          <p className="text-xs text-slate-500">Total: {form.stable + form.nodding + form.excessive}% (aim for ~100)</p>
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={loading} className="btn-primary px-8 py-3">
        {loading ? <LoadingSpinner size="sm" text="Analysing behavior…" /> : '🧠 Analyse Body Language'}
      </button>

      {result && (
        <div className="space-y-4 pt-2">
          {/* Header */}
          <div className="card flex flex-wrap items-center gap-6">
            <ScoreRing score={result.eye_contact_score} label="Eye Contact" size="lg" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-3">
                <div className="bg-slate-800 rounded-lg px-4 py-2 text-center">
                  <p className={`font-bold text-sm ${verdictColor(result.confidence_level)}`}>{result.confidence_level}</p>
                  <p className="text-xs text-slate-400">Confidence</p>
                </div>
                <div className="bg-slate-800 rounded-lg px-4 py-2 text-center">
                  <p className={`font-bold text-sm ${verdictColor(result.nervousness_level)}`}>{result.nervousness_level}</p>
                  <p className="text-xs text-slate-400">Nervousness</p>
                </div>
                <div className="bg-slate-800 rounded-lg px-4 py-2 text-center">
                  <p className="font-bold text-sm text-white capitalize">{result.dominant_emotion}</p>
                  <p className="text-xs text-slate-400">Dominant Emotion</p>
                </div>
              </div>
              <div className={`inline-flex px-4 py-1.5 rounded-lg border text-sm font-bold ${hireSignalColor(result.hire_signal)}`}>
                {result.hire_signal}
              </div>
            </div>
          </div>

          {/* Final assessment */}
          <div className="card bg-slate-800/50">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Recruiter Assessment</p>
            <p className="text-slate-300 text-sm leading-relaxed">{result.final_assessment}</p>
          </div>

          {/* Positive / Improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.positive_signals?.length > 0 && (
              <div className="card border-green-700/30 bg-green-900/10">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">✅ Positive Signals</p>
                <BulletList items={result.positive_signals} icon="✓" iconColor="text-green-400" />
              </div>
            )}
            {result.areas_to_improve?.length > 0 && (
              <div className="card border-yellow-700/30 bg-yellow-900/10">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">📌 Areas to Improve</p>
                <BulletList items={result.areas_to_improve} icon="→" iconColor="text-yellow-400" />
              </div>
            )}
          </div>

          {/* Body language feedback */}
          {result.body_language_feedback?.length > 0 && (
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Detailed Observations</p>
              <BulletList items={result.body_language_feedback} icon="•" iconColor="text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'ats',      label: '📄 ATS Scanner',       desc: 'Resume vs Job Description' },
  { id: 'speech',   label: '🎤 Speech Analyzer',    desc: 'Clarity, confidence, fillers' },
  { id: 'behavior', label: '🧠 Behavior Analyzer',  desc: 'Eye contact, emotions, posture' },
];

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState('ats');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Intelligence Engine</h2>
        <p className="text-slate-400 mt-1">Three AI analyzers — ATS matching, speech coaching, and behavioral assessment</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-0">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-400 bg-primary-900/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}>
            <span>{tab.label}</span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-2">— {tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'ats'      && <ATSTab />}
        {activeTab === 'speech'   && <SpeechTab />}
        {activeTab === 'behavior' && <BehaviorTab />}
      </div>
    </div>
  );
}
