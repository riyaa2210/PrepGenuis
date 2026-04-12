import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  getRealTimeFeedback,
  getLearningRoadmap,
  getMultiRoundQuestions,
  getMemoryInterview,
} from '../services/aiCoachService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

// ── Shared helpers ────────────────────────────────────────────────────────────

const feedbackTypeStyle = {
  good:    'bg-green-900/40 border-green-600 text-green-300',
  filler:  'bg-yellow-900/40 border-yellow-600 text-yellow-300',
  vague:   'bg-orange-900/40 border-orange-600 text-orange-300',
  example: 'bg-blue-900/40 border-blue-600 text-blue-300',
  clarity: 'bg-purple-900/40 border-purple-600 text-purple-300',
  concise: 'bg-pink-900/40 border-pink-600 text-pink-300',
  pace:    'bg-cyan-900/40 border-cyan-600 text-cyan-300',
  neutral: 'bg-slate-700 border-slate-600 text-slate-300',
};

const feedbackTypeIcon = {
  good: '✅', filler: '⚠️', vague: '🔍', example: '💡',
  clarity: '🗣', concise: '✂️', pace: '⏱', neutral: '💬',
};

const priorityColor = { High: 'red', Medium: 'yellow', Low: 'green' };
const difficultyColor = { Easy: 'green', Medium: 'yellow', Hard: 'red' };
const roundColor = { hr: 'blue', technical: 'purple', managerial: 'yellow' };

function BulletList({ items = [], icon = '→', color = 'text-slate-400' }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{title}</p>
      {children}
    </div>
  );
}

// ── TAB 1: Real-Time Feedback ─────────────────────────────────────────────────

function RealTimeFeedbackTab() {
  const [answer, setAnswer]         = useState('');
  const [feedbackLog, setFeedbackLog] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [autoMode, setAutoMode]     = useState(false);
  const debounceRef = useRef(null);
  const logEndRef   = useRef(null);

  // Auto-analyze as user types (debounced 1.5s)
  useEffect(() => {
    if (!autoMode || !answer.trim() || answer.trim().split(' ').length < 5) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { analyze(answer); }, 1500);
    return () => clearTimeout(debounceRef.current);
  }, [answer, autoMode]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedbackLog]);

  const analyze = useCallback(async (text) => {
    if (!text?.trim() || text.trim().split(' ').length < 3) return;
    setLoading(true);
    try {
      const { data } = await getRealTimeFeedback(text);
      const entry = {
        id:       Date.now(),
        feedback: data.feedback,
        type:     data.type || 'neutral',
        chunk:    text.slice(-60),
        time:     new Date().toLocaleTimeString(),
      };
      setFeedbackLog((prev) => [...prev.slice(-19), entry]);
    } catch { /* silent fail for real-time */ }
    finally { setLoading(false); }
  }, []);

  const handleManualAnalyze = () => analyze(answer);
  const clearLog = () => setFeedbackLog([]);

  const latestFeedback = feedbackLog[feedbackLog.length - 1];

  return (
    <div className="space-y-5">
      {/* Live feedback banner */}
      {latestFeedback && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${feedbackTypeStyle[latestFeedback.type] || feedbackTypeStyle.neutral}`}>
          <span className="text-lg">{feedbackTypeIcon[latestFeedback.type] || '💬'}</span>
          <span className="flex-1">{latestFeedback.feedback}</span>
          {loading && <LoadingSpinner size="sm" />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Your Answer</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-400">Auto-analyze</span>
              <div
                onClick={() => setAutoMode((p) => !p)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${autoMode ? 'bg-primary-600' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
          <textarea
            className="input min-h-[220px] resize-none text-sm leading-relaxed"
            placeholder="Start typing your interview answer here…&#10;&#10;Real-time coach will analyze as you speak or type."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualAnalyze}
              disabled={loading || !answer.trim()}
              className="btn-primary flex-1"
            >
              {loading ? <LoadingSpinner size="sm" /> : '⚡ Analyze Now'}
            </button>
            <button onClick={() => { setAnswer(''); clearLog(); }} className="btn-secondary px-4">
              Clear
            </button>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Words: <span className="text-slate-300 font-bold">{answer.trim() ? answer.trim().split(/\s+/).length : 0}</span></span>
            <span>Feedback count: <span className="text-slate-300 font-bold">{feedbackLog.length}</span></span>
          </div>
        </div>

        {/* Feedback log */}
        <div className="card bg-slate-900/50 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Feedback Log</p>
            {feedbackLog.length > 0 && (
              <button onClick={clearLog} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1">
            {feedbackLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
                <span className="text-3xl mb-2">🎙</span>
                Feedback will appear here as you type
              </div>
            ) : (
              feedbackLog.map((entry) => (
                <div key={entry.id} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${feedbackTypeStyle[entry.type] || feedbackTypeStyle.neutral}`}>
                  <span>{feedbackTypeIcon[entry.type] || '💬'}</span>
                  <div className="flex-1">
                    <p className="font-medium">{entry.feedback}</p>
                    <p className="opacity-60 mt-0.5">{entry.time}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>

          {/* Type legend */}
          <div className="border-t border-slate-700 pt-3 mt-3">
            <p className="text-xs text-slate-500 mb-2">Feedback types</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(feedbackTypeIcon).map(([type, icon]) => (
                <span key={type} className={`px-2 py-0.5 rounded text-xs border ${feedbackTypeStyle[type]}`}>
                  {icon} {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TAB 2: Learning Roadmap ───────────────────────────────────────────────────

function LearningRoadmapTab() {
  const [weakAreas, setWeakAreas] = useState('');
  const [role, setRole]           = useState('');
  const [days, setDays]           = useState(14);
  const [roadmap, setRoadmap]     = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleGenerate = async () => {
    setLoading(true); setRoadmap(null);
    try {
      const areas = weakAreas.trim()
        ? weakAreas.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const { data } = await getLearningRoadmap({ weakAreas: areas, role, targetDays: days });
      setRoadmap(data.roadmap);
      toast.success('Roadmap generated!');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate roadmap'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="label">Weak Areas <span className="text-slate-500">(comma-separated, or leave blank to use your profile)</span></label>
          <input className="input" placeholder="e.g. Dynamic Programming, System Design, SQL"
            value={weakAreas} onChange={(e) => setWeakAreas(e.target.value)} />
        </div>
        <div>
          <label className="label">Target Role</label>
          <input className="input" placeholder="e.g. Senior Backend Engineer"
            value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div>
          <label className="label">Plan Duration: <span className="text-primary-400 font-bold">{days} days</span></label>
          <input type="range" min={7} max={30} value={days} onChange={(e) => setDays(+e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 mt-2"
            style={{ accentColor: '#3b82f6' }} />
          <div className="flex justify-between text-xs text-slate-500 mt-1"><span>7d</span><span>30d</span></div>
        </div>
        <div className="md:col-span-2 flex items-end">
          <button onClick={handleGenerate} disabled={loading} className="btn-primary px-8 py-3 w-full md:w-auto">
            {loading ? <LoadingSpinner size="sm" text="Building roadmap…" /> : '📈 Generate Roadmap'}
          </button>
        </div>
      </div>

      {roadmap && (
        <div className="space-y-4">
          {/* Header */}
          <div className="card bg-primary-900/20 border-primary-700/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white text-lg">{roadmap.target_role}</p>
                <p className="text-slate-400 text-sm">{roadmap.total_days}-day plan · {roadmap.weak_areas?.length} weak areas</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {roadmap.weak_areas?.map((a) => (
                  <span key={a} className="px-2.5 py-1 bg-red-900/40 text-red-300 border border-red-700 rounded-full text-xs">{a}</span>
                ))}
              </div>
            </div>
            {roadmap.coach_note && (
              <p className="text-slate-300 text-sm mt-3 pt-3 border-t border-slate-700 italic">
                💬 "{roadmap.coach_note}"
              </p>
            )}
          </div>

          {/* Roadmap topics */}
          <div className="space-y-3">
            {roadmap.roadmap?.map((item, i) => (
              <details key={i} className="card group" open={i === 0}>
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600/30 border border-primary-600/50 rounded-lg flex items-center justify-center text-sm font-bold text-primary-400">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.topic}</p>
                      <p className="text-xs text-slate-400">{item.duration} · {item.daily_time_commitment}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityColor[item.priority] || 'slate'}>{item.priority}</Badge>
                    <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                  </div>
                </summary>
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Goal</p>
                    <p className="text-sm text-slate-300">{item.goal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Tasks</p>
                    <BulletList items={item.tasks} icon="✦" color="text-primary-400" />
                  </div>
                </div>
              </details>
            ))}
          </div>

          {/* Milestones */}
          {roadmap.milestones?.length > 0 && (
            <SectionCard title="🏁 Milestones">
              <div className="flex flex-wrap gap-3">
                {roadmap.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-primary-400 font-bold text-sm">Day {m.day}</span>
                    <span className="text-slate-300 text-xs">{m.checkpoint}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Resources */}
          {roadmap.resources?.length > 0 && (
            <SectionCard title="📚 Resources">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roadmap.resources.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                    <span className="text-lg">{r.type === 'Video' ? '🎥' : r.type === 'Practice' ? '💻' : r.type === 'Book' ? '📖' : '📄'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.url}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Covers: {r.covers}</p>
                    </div>
                    <Badge variant="slate">{r.type}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

// ── TAB 3: Multi-Round Interview ──────────────────────────────────────────────

function MultiRoundTab() {
  const [roundType, setRoundType]   = useState('technical');
  const [jd, setJd]                 = useState('');
  const [count, setCount]           = useState(5);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [activeQ, setActiveQ]       = useState(null);
  const [answers, setAnswers]       = useState({});

  const handleGenerate = async () => {
    setLoading(true); setResult(null); setActiveQ(null); setAnswers({});
    try {
      const { data } = await getMultiRoundQuestions({ roundType, jobDescription: jd, count });
      setResult(data);
      toast.success(`${data.questions?.length} ${roundType.toUpperCase()} questions ready`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate questions'); }
    finally { setLoading(false); }
  };

  const roundIcons = { hr: '🤝', technical: '💻', managerial: '🏢' };

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Round Type</label>
            <div className="flex gap-2">
              {['hr', 'technical', 'managerial'].map((r) => (
                <button key={r} onClick={() => setRoundType(r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    roundType === r
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}>
                  {roundIcons[r]} {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Questions: <span className="text-primary-400 font-bold">{count}</span></label>
            <input type="range" min={3} max={8} value={count} onChange={(e) => setCount(+e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 mt-2"
              style={{ accentColor: '#3b82f6' }} />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>3</span><span>8</span></div>
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full py-3">
              {loading ? <LoadingSpinner size="sm" text="Generating…" /> : `🔄 Generate ${roundType.toUpperCase()} Round`}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Job Description <span className="text-slate-500">(optional)</span></label>
          <textarea className="input min-h-[80px] resize-none text-sm"
            placeholder="Paste JD for personalized questions…"
            value={jd} onChange={(e) => setJd(e.target.value)} />
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Round header */}
          <div className="card flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{roundIcons[result.round_type]}</span>
              <div>
                <p className="font-bold text-white capitalize">{result.round_type} Round</p>
                <p className="text-xs text-slate-400">{result.questions?.length} questions</p>
              </div>
            </div>
            {result.round_strategy && (
              <p className="text-sm text-slate-400 max-w-md text-right hidden md:block">{result.round_strategy}</p>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {result.questions?.map((q, i) => (
              <div key={q.id || i} className={`card border transition-all ${activeQ === i ? 'border-primary-500' : 'border-slate-700'}`}>
                <button className="w-full text-left" onClick={() => setActiveQ(activeQ === i ? null : i)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      activeQ === i ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-white font-medium leading-relaxed">{q.text}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={difficultyColor[q.difficulty] || 'slate'}>{q.difficulty}</Badge>
                        <Badge variant="slate">{q.category}</Badge>
                      </div>
                    </div>
                    <span className={`text-slate-400 transition-transform shrink-0 ${activeQ === i ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {activeQ === i && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                    {/* Why asked */}
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                      <p className="text-xs text-blue-400 mb-1">Why this question</p>
                      <p className="text-sm text-slate-300">{q.why_asked}</p>
                    </div>

                    {/* Expected keywords */}
                    {q.expected_keywords?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Expected keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {q.expected_keywords.map((kw) => (
                            <span key={kw} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practice answer */}
                    <div>
                      <label className="label text-xs">Practice your answer</label>
                      <textarea
                        className="input min-h-[100px] resize-none text-sm"
                        placeholder="Type your answer here to practice…"
                        value={answers[i] || ''}
                        onChange={(e) => setAnswers((p) => ({ ...p, [i]: e.target.value }))}
                      />
                    </div>

                    {/* Follow-up */}
                    {q.follow_up && (
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Follow-up question</p>
                        <p className="text-sm text-slate-300 italic">"{q.follow_up}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 4: Memory-Based RAG Interview ────────────────────────────────────────

function MemoryInterviewTab() {
  const [jd, setJd]           = useState('');
  const [count, setCount]     = useState(5);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeQ, setActiveQ] = useState(null);

  const handleGenerate = async () => {
    setLoading(true); setResult(null); setActiveQ(null);
    try {
      const { data } = await getMemoryInterview({ jobDescription: jd, count });
      setResult(data);
      toast.success('Memory-based interview ready');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate memory interview'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Explainer */}
      <div className="card bg-purple-900/20 border-purple-700/40">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧩</span>
          <div>
            <p className="font-semibold text-white">Memory-Based AI Interviewer</p>
            <p className="text-sm text-slate-400 mt-1">
              The AI reads your entire interview history, remembers your past mistakes and strengths,
              and generates questions specifically designed to revisit weak areas — just like a real interviewer who knows you.
            </p>
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="label">Job Description <span className="text-slate-500">(optional)</span></label>
          <textarea className="input min-h-[80px] resize-none text-sm"
            placeholder="Paste JD to align memory-based questions with the role…"
            value={jd} onChange={(e) => setJd(e.target.value)} />
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Questions: <span className="text-primary-400 font-bold">{count}</span></label>
            <input type="range" min={3} max={8} value={count} onChange={(e) => setCount(+e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 mt-2"
              style={{ accentColor: '#a855f7' }} />
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full py-3 bg-purple-600 hover:bg-purple-700">
            {loading ? <LoadingSpinner size="sm" text="Reading memory…" /> : '🧩 Start Memory Interview'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Memory feedback banner */}
          {result.memory_feedback && (
            <div className="card bg-purple-900/30 border-purple-600/50">
              <p className="text-xs text-purple-400 uppercase tracking-widest mb-2">🧠 AI Memory</p>
              <p className="text-slate-200 text-sm leading-relaxed italic">"{result.memory_feedback}"</p>
            </div>
          )}

          {/* Session strategy + encouragement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.session_strategy && (
              <SectionCard title="📋 Session Strategy">
                <p className="text-sm text-slate-300">{result.session_strategy}</p>
              </SectionCard>
            )}
            {result.encouragement && (
              <SectionCard title="💪 Encouragement" className="border-green-700/30 bg-green-900/10">
                <p className="text-sm text-slate-300">{result.encouragement}</p>
              </SectionCard>
            )}
          </div>

          {/* Focus areas */}
          {result.focus_areas?.length > 0 && (
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">🎯 Focus Areas Today</p>
              <div className="flex flex-wrap gap-2">
                {result.focus_areas.map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-purple-900/40 text-purple-300 border border-purple-700 rounded-full text-sm font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-3">
            {result.questions?.map((q, i) => (
              <div key={q.id || i} className={`card border transition-all ${activeQ === i ? 'border-purple-500' : 'border-slate-700'}`}>
                <button className="w-full text-left" onClick={() => setActiveQ(activeQ === i ? null : i)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      activeQ === i ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-white font-medium leading-relaxed">{q.text}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={difficultyColor[q.difficulty] || 'slate'}>{q.difficulty}</Badge>
                        <Badge variant="slate">{q.category}</Badge>
                        {q.memory_reference && (
                          <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-700 rounded-full text-xs">
                            🧠 memory-based
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-slate-400 transition-transform shrink-0 ${activeQ === i ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {activeQ === i && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                    {q.memory_reference && (
                      <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
                        <p className="text-xs text-purple-400 mb-1">Why this question (from memory)</p>
                        <p className="text-sm text-slate-300">{q.memory_reference}</p>
                      </div>
                    )}
                    {q.expected_keywords?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Expected keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {q.expected_keywords.map((kw) => (
                            <span key={kw} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'realtime', label: '⚡ Real-Time Feedback', desc: 'Live coaching as you speak' },
  { id: 'roadmap',  label: '📈 Learning Roadmap',   desc: '7–14 day structured plan' },
  { id: 'rounds',   label: '🔄 Multi-Round',         desc: 'HR / Technical / Managerial' },
  { id: 'memory',   label: '🧩 Memory Interview',    desc: 'AI remembers your past' },
];

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Coach</h2>
        <p className="text-slate-400 mt-1">
          Real-time feedback · Learning roadmap · Multi-round questions · Memory-based interviews
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-400 bg-primary-900/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>{tab.label}</span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-2">— {tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'realtime' && <RealTimeFeedbackTab />}
        {activeTab === 'roadmap'  && <LearningRoadmapTab />}
        {activeTab === 'rounds'   && <MultiRoundTab />}
        {activeTab === 'memory'   && <MemoryInterviewTab />}
      </div>
    </div>
  );
}
