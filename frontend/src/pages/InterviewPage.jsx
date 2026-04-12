import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useTimer } from '../hooks/useTimer';
import { useSocket } from '../hooks/useSocket';
import { askFollowUp } from '../services/interviewService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ScoreBar from '../components/common/ScoreBar';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentInterview, currentQuestionIndex, answers, loading, loadInterview,
    submitCurrentAnswer, finishInterview, nextQuestion, prevQuestion } = useInterview();
  const timer = useTimer();
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastEval, setLastEval] = useState(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  const [followUp, setFollowUp] = useState('');
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const feedbackTimeout = useRef(null);

  const { sendTranscriptChunk } = useSocket(id, {
    onRealtimeFeedback: (fb) => {
      setRealtimeFeedback(fb);
      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = setTimeout(() => setRealtimeFeedback(null), 5000);
    },
  });

  const { isRecording, transcript, startRecording, stopRecording, resetRecording } = useVoiceRecorder({
    onChunk: (chunk) => sendTranscriptChunk(chunk),
  });

  useEffect(() => {
    loadInterview(id);
    timer.start();
    return () => timer.stop();
  }, [id]);

  useEffect(() => {
    if (transcript) setAnswerText(transcript);
  }, [transcript]);

  const currentQuestion = currentInterview?.questions?.[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] : null;

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return toast.error('Please provide an answer');
    if (isRecording) stopRecording();
    setSubmitting(true);
    const result = await submitCurrentAnswer(answerText);
    if (result) {
      setLastEval(result.evaluation);
      toast.success(`Score: ${result.evaluation.score}/10`);
    }
    setSubmitting(false);
  };

  const handleNext = () => {
    setAnswerText('');
    setLastEval(null);
    setFollowUpResponse('');
    resetRecording();
    nextQuestion();
  };

  const handleComplete = async () => {
    setCompleting(true);
    timer.stop();
    const interview = await finishInterview(timer.seconds);
    if (interview) {
      toast.success('Interview completed! Generating scorecard...');
      navigate(`/reports/${interview._id}`);
    }
    setCompleting(false);
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || !currentQuestion) return;
    setFollowUpLoading(true);
    try {
      const { data } = await askFollowUp(id, { questionId: currentQuestion._id, followUp });
      setFollowUpResponse(data.response);
      setFollowUp('');
    } catch { toast.error('Failed to get response'); }
    finally { setFollowUpLoading(false); }
  };

  if (loading && !currentInterview) return <LoadingSpinner fullScreen text="Loading interview..." />;
  if (!currentInterview) return null;

  const totalQ = currentInterview.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQ) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="card flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white">{currentInterview.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="blue">{currentInterview.round}</Badge>
            <Badge variant={currentInterview.difficulty === 'hard' ? 'red' : currentInterview.difficulty === 'medium' ? 'yellow' : 'green'}>
              {currentInterview.difficulty}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-white">{timer.formatted}</p>
          <p className="text-xs text-slate-400">Q {currentQuestionIndex + 1} / {totalQ}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="score-bar-track">
        <div className="score-bar-fill bg-primary-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Real-time feedback */}
      {realtimeFeedback && (
        <div className={`p-3 rounded-lg border text-sm font-medium animate-pulse ${
          realtimeFeedback.type === 'good' ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
        }`}>
          💬 {realtimeFeedback.feedback}
        </div>
      )}

      {/* Question */}
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            {currentQuestionIndex + 1}
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-lg leading-relaxed">{currentQuestion?.text}</p>
            {currentQuestion?.category && (
              <Badge variant="slate" className="mt-2">{currentQuestion.category}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <label className="label mb-0">Your Answer</label>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRecording ? 'bg-red-600 hover:bg-red-700 text-white recording-pulse' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {isRecording ? '⏹ Stop Recording' : '🎤 Record Answer'}
          </button>
        </div>

        <textarea
          className="input min-h-[140px] resize-none"
          placeholder="Type your answer or use voice recording..."
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          disabled={!!currentAnswer}
        />

        {!currentAnswer && (
          <button onClick={handleSubmitAnswer} className="btn-primary w-full" disabled={submitting || !answerText.trim()}>
            {submitting ? <LoadingSpinner size="sm" text="Evaluating..." /> : '✅ Submit Answer'}
          </button>
        )}
      </div>

      {/* AI Evaluation */}
      {(lastEval || currentAnswer?.evaluation) && (
        <div className="card space-y-4 border-primary-600/30">
          <h3 className="font-semibold text-white">🤖 AI Evaluation</h3>
          <ScoreBar label="Answer Score" score={(lastEval || currentAnswer.evaluation).score} />
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-300">{(lastEval || currentAnswer.evaluation).feedback}</p>
          </div>
          {(lastEval || currentAnswer.evaluation).betterAnswer && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-primary-400 hover:text-primary-300">
                💡 See model answer
              </summary>
              <div className="mt-2 bg-primary-900/20 border border-primary-700/30 rounded-lg p-4">
                <p className="text-sm text-slate-300">{(lastEval || currentAnswer.evaluation).betterAnswer}</p>
              </div>
            </details>
          )}
          {(lastEval || currentAnswer.evaluation).fillerWordCount > 0 && (
            <p className="text-sm text-yellow-400">
              ⚠️ Filler words detected: {(lastEval || currentAnswer.evaluation).fillerWords?.join(', ')}
            </p>
          )}

          {/* Follow-up */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400 mb-2">Ask a follow-up question:</p>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder='e.g. "Where did I go wrong?"'
                value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()} />
              <button onClick={handleFollowUp} className="btn-secondary" disabled={followUpLoading}>
                {followUpLoading ? '...' : 'Ask'}
              </button>
            </div>
            {followUpResponse && (
              <div className="mt-3 bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300">
                {followUpResponse}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevQuestion} className="btn-secondary" disabled={currentQuestionIndex === 0}>
          ← Previous
        </button>
        <div className="flex gap-3">
          {currentQuestionIndex < totalQ - 1 ? (
            <button onClick={handleNext} className="btn-primary" disabled={!currentAnswer && !lastEval}>
              Next →
            </button>
          ) : (
            <button onClick={handleComplete} className="btn-primary bg-green-600 hover:bg-green-700" disabled={completing}>
              {completing ? <LoadingSpinner size="sm" text="Generating report..." /> : '🏁 Complete Interview'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
