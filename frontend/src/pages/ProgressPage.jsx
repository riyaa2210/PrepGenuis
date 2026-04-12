import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getLearningRoadmap } from '../services/aiCoachService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend,
} from 'chart.js';
import Badge from '../components/ui/Badge';
import ScoreBar from '../components/ui/ScoreBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SkeletonStat } from '../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ROUND_COLOR = { hr: 'var(--blue)', technical: 'var(--purple)', managerial: 'var(--yellow)', coding: 'var(--green)', mock: 'var(--text-tertiary)' };

export default function ProgressPage() {
  const [progress, setProgress]       = useState(null);
  const [roadmap, setRoadmap]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  useEffect(() => {
    api.get('/progress')
      .then(({ data }) => setProgress(data.progress))
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoadmap = async () => {
    setRoadmapLoading(true);
    try {
      const { data } = await getLearningRoadmap({
        weakAreas: progress?.weakTopics || [],
      });
      setRoadmap(data.roadmap);
      toast.success('Roadmap generated');
    } catch { toast.error('Failed to generate roadmap'); }
    finally { setRoadmapLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[1,2,3,4].map((i) => <SkeletonStat key={i} />)}
        </div>
      </div>
    );
  }

  const hasGraph = progress?.graphData?.length > 1;

  const chartData = {
    labels: progress?.graphData?.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Overall',
        data: progress?.graphData?.map((d) => d.overallScore) || [],
        borderColor: 'var(--accent)',
        backgroundColor: 'rgba(95,98,232,0.06)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: 'var(--accent)',
      },
      {
        label: 'Technical',
        data: progress?.graphData?.map((d) => d.technicalScore) || [],
        borderColor: 'var(--purple)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: 0.35,
        pointRadius: 2,
        borderDash: [4, 3],
      },
      {
        label: 'Communication',
        data: progress?.graphData?.map((d) => d.communicationScore) || [],
        borderColor: 'var(--green)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: 0.35,
        pointRadius: 2,
        borderDash: [4, 3],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-tertiary)',
          font: { size: 11, family: 'Inter' },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'var(--bg-overlay)',
        borderColor: 'var(--border-strong)',
        borderWidth: 1,
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--text-muted)', font: { size: 11 } },
        grid: { color: 'var(--border)', drawBorder: false },
      },
      y: {
        min: 0, max: 10,
        ticks: { color: 'var(--text-muted)', font: { size: 11 }, stepSize: 2 },
        grid: { color: 'var(--border)', drawBorder: false },
      },
    },
  };

  return (
    <div style={{ maxWidth: 860 }} className="anim-fade-up">

      {/* Header — no subtitle, the stats speak */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 0 }}>Progress</h1>
      </div>

      {/* Stats — 4 cols, varied content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Interviews', value: progress?.totalInterviews || 0 },
          { label: 'Avg score', value: progress?.averageScore ? `${progress.averageScore.toFixed(1)}/10` : '—' },
          { label: 'Weak topics', value: progress?.weakTopics?.length || 0 },
          { label: 'Rounds', value: Object.keys(progress?.roundBreakdown || {}).length },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.571rem', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main layout — chart takes most space, round breakdown is a sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: hasGraph ? '1fr 220px' : '1fr', gap: 14, marginBottom: 14 }}>

        {/* Score chart */}
        {hasGraph && (
          <div className="card" style={{ padding: '18px 20px 14px' }}>
            <div style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              Score over time
            </div>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {/* Round breakdown — vertical list, not a grid */}
        {Object.keys(progress?.roundBreakdown || {}).length > 0 && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              By round
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(progress.roundBreakdown).map(([round, data]) => (
                <div key={round}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.786rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {round}
                    </span>
                    <span style={{ fontSize: '0.786rem', fontWeight: 600, color: 'var(--text-primary)' }} className="mono">
                      {data.avgScore}/10
                    </span>
                  </div>
                  <div className="score-track">
                    <div className="score-fill" style={{
                      width: `${(data.avgScore / 10) * 100}%`,
                      background: ROUND_COLOR[round] || 'var(--accent)',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.714rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {data.count} session{data.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weak topics + roadmap — side by side when roadmap exists */}
      {progress?.weakTopics?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: roadmap ? '280px 1fr' : '1fr', gap: 14, marginBottom: 14 }}>

          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                Weak topics
              </div>
              {!roadmap && (
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={handleRoadmap}
                  disabled={roadmapLoading}
                >
                  {roadmapLoading ? <LoadingSpinner size="sm" /> : 'Get roadmap'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {progress.weakTopics.map((t) => (
                <Badge key={t} variant="red">{t}</Badge>
              ))}
            </div>
          </div>

          {/* Roadmap — appears inline when generated */}
          {roadmap && (
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                  Learning roadmap · {roadmap.total_days} days
                </div>
                <button className="btn btn-ghost btn-xs" onClick={handleRoadmap} disabled={roadmapLoading}>
                  {roadmapLoading ? '…' : 'Regenerate'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roadmap.roadmap?.slice(0, 4).map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    paddingBottom: 10,
                    borderBottom: i < Math.min(roadmap.roadmap.length, 4) - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 'var(--r-xs)',
                      background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.714rem', fontWeight: 600, color: 'var(--text-muted)',
                      flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {item.topic}
                        </span>
                        <Badge variant={item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'yellow' : 'green'}>
                          {item.priority}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.duration} · {item.daily_time_commitment}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Memory — compact, not a full section */}
      {progress?.interviewMemory?.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 12 }}>
            AI memory
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {progress.interviewMemory.slice(-4).reverse().map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                paddingBottom: 8,
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: m.performance === 'strong' ? 'var(--green)' : 'var(--red)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {m.topic}
                  </span>
                  {m.notes && (
                    <p style={{ fontSize: '0.786rem', margin: '2px 0 0', lineHeight: 1.5 }}>{m.notes}</p>
                  )}
                </div>
                <Badge variant={m.performance === 'strong' ? 'green' : 'red'}>{m.performance}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
