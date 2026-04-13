import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getLearningRoadmap } from '../services/aiCoachService';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import Badge from '../components/ui/Badge';
import ScoreBar from '../components/ui/ScoreBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SkeletonStat } from '../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ROUND_COLOR = { hr:'var(--blue)', technical:'var(--purple)', managerial:'var(--yellow)', coding:'var(--green)', mock:'var(--text-tertiary)' };
const ROUND_ICON  = { hr:'🤝', technical:'💻', managerial:'🏢', coding:'⌨️', mock:'🎯' };

export default function ProgressPage() {
  const [progress, setProgress]             = useState(null);
  const [roadmap, setRoadmap]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [activeTab, setActiveTab]           = useState('overview');

  useEffect(() => {
    api.get('/progress')
      .then(({ data }) => setProgress(data.progress))
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoadmap = async () => {
    setRoadmapLoading(true);
    try {
      const { data } = await getLearningRoadmap({ weakAreas: progress?.weakTopics || [] });
      setRoadmap(data.roadmap);
      setActiveTab('roadmap');
      toast.success('Roadmap generated');
    } catch { toast.error('Failed to generate roadmap'); }
    finally { setRoadmapLoading(false); }
  };

  if (loading) return (
    <div style={{ maxWidth:860, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[1,2,3,4].map(i => <SkeletonStat key={i} />)}
      </div>
    </div>
  );

  const hasGraph = progress?.graphData?.length > 1;

  const chartData = {
    labels: progress?.graphData?.map(d =>
      new Date(d.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})
    ) || [],
    datasets: [
      { label:'Overall', data:progress?.graphData?.map(d=>d.overallScore)||[], borderColor:'var(--accent)', backgroundColor:'rgba(95,98,232,0.06)', borderWidth:2, tension:0.35, pointRadius:3, pointBackgroundColor:'var(--accent)' },
      { label:'Technical', data:progress?.graphData?.map(d=>d.technicalScore)||[], borderColor:'var(--purple)', backgroundColor:'transparent', borderWidth:1.5, tension:0.35, pointRadius:2, borderDash:[4,3] },
      { label:'Communication', data:progress?.graphData?.map(d=>d.communicationScore)||[], borderColor:'var(--green)', backgroundColor:'transparent', borderWidth:1.5, tension:0.35, pointRadius:2, borderDash:[4,3] },
    ],
  };

  const chartOptions = {
    responsive:true, maintainAspectRatio:true,
    plugins: {
      legend: { labels:{ color:'var(--text-tertiary)', font:{size:11,family:'Inter'}, boxWidth:12, padding:16 } },
      tooltip: { backgroundColor:'var(--bg-overlay)', borderColor:'var(--border-strong)', borderWidth:1, titleColor:'var(--text-primary)', bodyColor:'var(--text-secondary)', padding:10 },
    },
    scales: {
      x: { ticks:{color:'var(--text-muted)',font:{size:11}}, grid:{color:'var(--border)'} },
      y: { min:0, max:10, ticks:{color:'var(--text-muted)',font:{size:11},stepSize:2}, grid:{color:'var(--border)'} },
    },
  };

  const TABS = [
    { id:'overview', label:'Overview' },
    { id:'rounds',   label:'By Round' },
    { id:'memory',   label:'AI Memory', count: progress?.interviewMemory?.length || 0 },
    { id:'roadmap',  label:'Roadmap', badge: roadmap ? '✓' : null },
  ];

  return (
    <div style={{ maxWidth:900 }} className="anim-fade-up">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:'0 0 4px' }}>Progress</h1>
          <p style={{ margin:0, fontSize:'0.857rem' }}>
            {progress?.totalInterviews > 0
              ? `${progress.totalInterviews} sessions · avg ${progress.averageScore?.toFixed(1)||'—'}/10`
              : 'Complete interviews to track your progress'}
          </p>
        </div>
        {progress?.weakTopics?.length > 0 && !roadmap && (
          <button className="btn btn-secondary" onClick={handleRoadmap} disabled={roadmapLoading}>
            {roadmapLoading ? <LoadingSpinner size="sm" /> : '🗺 Generate Roadmap'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }} className="stagger">
        {[
          { label:'Interviews', value:progress?.totalInterviews||0, icon:'🎤' },
          { label:'Avg Score',  value:progress?.averageScore ? `${progress.averageScore.toFixed(1)}/10` : '—', icon:'⭐', color: progress?.averageScore >= 7 ? 'var(--green)' : progress?.averageScore >= 4 ? 'var(--yellow)' : undefined },
          { label:'Weak Topics', value:progress?.weakTopics?.length||0, icon:'📌', color: progress?.weakTopics?.length > 0 ? 'var(--yellow)' : undefined },
          { label:'Rounds',     value:Object.keys(progress?.roundBreakdown||{}).length, icon:'🔄' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</div>
              <span style={{ fontSize:16 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:'1.714rem', fontWeight:700, letterSpacing:'-0.04em', color:s.color||'var(--text-primary)', lineHeight:1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.count > 0 && <span style={{ marginLeft:5, fontSize:'0.714rem', background:'var(--bg-overlay)', padding:'1px 5px', borderRadius:99, color:'var(--text-muted)' }}>{t.count}</span>}
            {t.badge && <span style={{ marginLeft:5, fontSize:'0.714rem', color:'var(--green)' }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {hasGraph ? (
            <div className="card" style={{ padding:'18px 20px 14px' }}>
              <div style={{ fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', marginBottom:14 }}>Score over time</div>
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="empty-state" style={{ border:'1px dashed var(--border-mid)', borderRadius:'var(--r-lg)' }}>
              <div className="empty-icon">📈</div>
              <h4 style={{ color:'var(--text-primary)', margin:0 }}>Not enough data yet</h4>
              <p style={{ fontSize:'0.857rem', margin:0 }}>Complete 2+ interviews to see your score trend.</p>
            </div>
          )}

          {progress?.weakTopics?.length > 0 && (
            <div className="card" style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  Weak topics
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => setActiveTab('roadmap')}>
                  View roadmap →
                </button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {progress.weakTopics.map(t => <Badge key={t} variant="red">{t}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: By Round */}
      {activeTab === 'rounds' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {Object.entries(progress?.roundBreakdown||{}).map(([round, data]) => (
            <div key={round} className="card" style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{
                  width:36, height:36, borderRadius:'var(--r-md)',
                  background:'var(--bg-overlay)', border:'1px solid var(--border-strong)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                }}>
                  {ROUND_ICON[round]||'🎯'}
                </div>
                <div>
                  <div style={{ fontSize:'0.857rem', fontWeight:500, color:'var(--text-primary)', textTransform:'capitalize' }}>{round}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{data.count} session{data.count!==1?'s':''}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:10 }}>
                <span style={{ fontSize:'2rem', fontWeight:700, letterSpacing:'-0.04em', color:ROUND_COLOR[round]||'var(--accent)' }} className="mono">
                  {data.avgScore}
                </span>
                <span style={{ fontSize:'0.857rem', color:'var(--text-muted)' }}>/10</span>
              </div>
              <div className="score-track">
                <div className="score-fill" style={{ width:`${(data.avgScore/10)*100}%`, background:ROUND_COLOR[round]||'var(--accent)' }} />
              </div>
            </div>
          ))}
          {Object.keys(progress?.roundBreakdown||{}).length === 0 && (
            <div className="empty-state" style={{ gridColumn:'1/-1', border:'1px dashed var(--border-mid)', borderRadius:'var(--r-lg)' }}>
              <div className="empty-icon">🔄</div>
              <p style={{ fontSize:'0.857rem', margin:0 }}>No round data yet. Complete interviews to see breakdown.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Memory */}
      {activeTab === 'memory' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {progress?.interviewMemory?.length > 0 ? (
            progress.interviewMemory.slice(-8).reverse().map((m, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'flex-start', gap:12,
                padding:'14px 20px',
                borderBottom: i < Math.min(progress.interviewMemory.length,8)-1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width:8, height:8, borderRadius:'50%', marginTop:6, flexShrink:0,
                  background: m.performance==='strong' ? 'var(--green)' : 'var(--red)',
                  boxShadow: `0 0 6px ${m.performance==='strong' ? 'var(--green)' : 'var(--red)'}`,
                }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.857rem', fontWeight:500, color:'var(--text-primary)', marginBottom:3 }}>{m.topic}</div>
                  {m.notes && <p style={{ fontSize:'0.786rem', margin:0, lineHeight:1.5 }}>{m.notes}</p>}
                </div>
                <Badge variant={m.performance==='strong'?'green':'red'}>{m.performance}</Badge>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <p style={{ fontSize:'0.857rem', margin:0 }}>AI memory builds up as you complete interviews.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Roadmap */}
      {activeTab === 'roadmap' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {!roadmap ? (
            <div className="empty-state" style={{ border:'1px dashed var(--border-mid)', borderRadius:'var(--r-lg)' }}>
              <div className="empty-icon">🗺</div>
              <h4 style={{ color:'var(--text-primary)', margin:0 }}>No roadmap yet</h4>
              <p style={{ fontSize:'0.857rem', margin:0 }}>
                {progress?.weakTopics?.length > 0
                  ? 'Generate a personalized learning plan based on your weak topics.'
                  : 'Complete interviews first to identify weak areas.'}
              </p>
              {progress?.weakTopics?.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={handleRoadmap} disabled={roadmapLoading} style={{ marginTop:10 }}>
                  {roadmapLoading ? <LoadingSpinner size="sm" /> : '🗺 Generate Roadmap'}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="card" style={{ padding:'16px 20px', background:'var(--accent-glow)', borderColor:'rgba(95,98,232,0.2)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:'0.857rem', fontWeight:500, color:'var(--text-primary)', marginBottom:4 }}>
                      {roadmap.target_role} · {roadmap.total_days}-day plan
                    </div>
                    {roadmap.coach_note && (
                      <p style={{ fontSize:'0.786rem', margin:0, fontStyle:'italic' }}>"{roadmap.coach_note}"</p>
                    )}
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={handleRoadmap} disabled={roadmapLoading}>
                    {roadmapLoading ? '…' : '↻ Regenerate'}
                  </button>
                </div>
              </div>

              {roadmap.roadmap?.map((item, i) => (
                <div key={i} className="card" style={{ padding:'16px 20px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{
                      width:28, height:28, borderRadius:'var(--r-sm)',
                      background:'var(--bg-overlay)', border:'1px solid var(--border-strong)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.786rem', fontWeight:700, color:'var(--text-muted)',
                      flexShrink:0, marginTop:1,
                    }}>{i+1}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:'0.929rem', fontWeight:500, color:'var(--text-primary)' }}>{item.topic}</span>
                        <Badge variant={item.priority==='High'?'red':item.priority==='Medium'?'yellow':'green'}>{item.priority}</Badge>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{item.duration}</span>
                      </div>
                      {item.goal && (
                        <p style={{ fontSize:'0.786rem', margin:'0 0 8px', color:'var(--text-secondary)' }}>{item.goal}</p>
                      )}
                      <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
                        {item.tasks?.slice(0,3).map((task, j) => (
                          <li key={j} style={{ display:'flex', gap:7, fontSize:'0.786rem', color:'var(--text-secondary)' }}>
                            <span style={{ color:'var(--accent)', flexShrink:0 }}>✦</span>{task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', flexShrink:0, textAlign:'right' }}>
                      {item.daily_time_commitment}
                    </div>
                  </div>
                </div>
              ))}

              {roadmap.resources?.length > 0 && (
                <div className="card" style={{ padding:'16px 20px' }}>
                  <div style={{ fontSize:'0.786rem', fontWeight:500, color:'var(--text-tertiary)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    Resources
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
                    {roadmap.resources.map((r, i) => (
                      <div key={i} style={{ padding:'10px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)' }}>
                        <div style={{ fontSize:'0.857rem', fontWeight:500, color:'var(--text-primary)', marginBottom:2 }}>{r.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{r.url}</div>
                        <div style={{ fontSize:'0.714rem', color:'var(--text-tertiary)', marginTop:4 }}>{r.covers}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
