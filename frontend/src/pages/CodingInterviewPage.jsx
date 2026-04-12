import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getInterview, submitCodingSolution } from '../services/interviewService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import ScoreBar from '../components/common/ScoreBar';
import toast from 'react-hot-toast';

const STARTER_PROBLEMS = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'easy',
    starterCode: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Your solution here\n}',
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    difficulty: 'easy',
    starterCode: '/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // Your solution here\n}',
  },
];

export default function CodingInterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    getInterview(id)
      .then(({ data }) => {
        setInterview(data.interview);
        const problems = data.interview.codingProblems?.length > 0
          ? data.interview.codingProblems
          : STARTER_PROBLEMS;
        setCode(problems[0]?.starterCode || '// Write your solution here');
      })
      .catch(() => toast.error('Failed to load interview'))
      .finally(() => setLoading(false));
  }, [id]);

  const problems = interview?.codingProblems?.length > 0 ? interview.codingProblems : STARTER_PROBLEMS;
  const problem = problems[currentProblem];

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error('Write your solution first');
    setSubmitting(true);
    try {
      const { data } = await submitCodingSolution(id, {
        problemIndex: currentProblem,
        solution: code,
        language,
      });
      setEvaluation(data.evaluation);
      toast.success(`Score: ${data.evaluation.score}/10`);
    } catch { toast.error('Failed to evaluate solution'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading coding interview..." />;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left: Problem */}
      <div className="w-96 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            {problems.map((_, i) => (
              <button key={i} onClick={() => { setCurrentProblem(i); setCode(problems[i]?.starterCode || ''); setEvaluation(null); }}
                className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${i === currentProblem ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <h3 className="font-bold text-white text-lg">{problem?.title}</h3>
          <Badge variant={problem?.difficulty === 'hard' ? 'red' : problem?.difficulty === 'medium' ? 'yellow' : 'green'} className="mt-2">
            {problem?.difficulty}
          </Badge>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">{problem?.description}</p>
        </div>

        {evaluation && (
          <div className="card space-y-3">
            <h3 className="font-semibold text-white">AI Evaluation</h3>
            <ScoreBar label="Score" score={evaluation.score} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-800/50 rounded p-2">
                <p className="text-slate-400 text-xs">Time Complexity</p>
                <p className="text-white font-mono">{evaluation.timeComplexity}</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <p className="text-slate-400 text-xs">Space Complexity</p>
                <p className="text-white font-mono">{evaluation.spaceComplexity}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">{evaluation.feedback}</p>
            {evaluation.improvements && (
              <p className="text-sm text-yellow-400">💡 {evaluation.improvements}</p>
            )}
          </div>
        )}

        <button onClick={() => navigate(`/reports/${id}`)} className="btn-secondary">
          ← Back to Report
        </button>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <select className="input w-auto" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {['javascript', 'python', 'java', 'cpp', 'typescript'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
            {submitting ? <LoadingSpinner size="sm" text="Evaluating..." /> : '▶ Submit Solution'}
          </button>
        </div>

        <div className="flex-1 rounded-xl overflow-hidden border border-slate-700">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
            }}
          />
        </div>
      </div>
    </div>
  );
}
