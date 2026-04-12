import React, { createContext, useContext, useState, useCallback } from 'react';
import { getInterview, submitAnswer, completeInterview } from '../services/interviewService';
import toast from 'react-hot-toast';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [currentInterview, setCurrentInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);

  const loadInterview = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await getInterview(id);
      setCurrentInterview(data.interview);
      setCurrentQuestionIndex(0);
      setAnswers({});
    } catch (err) {
      toast.error('Failed to load interview');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitCurrentAnswer = useCallback(async (answer) => {
    if (!currentInterview) return null;
    const question = currentInterview.questions[currentQuestionIndex];
    setLoading(true);
    try {
      const { data } = await submitAnswer(currentInterview._id, {
        questionId: question._id,
        answer,
      });
      setAnswers((prev) => ({ ...prev, [question._id]: { answer, evaluation: data.evaluation } }));
      return data;
    } catch (err) {
      toast.error('Failed to submit answer');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentInterview, currentQuestionIndex]);

  const finishInterview = useCallback(async (duration) => {
    if (!currentInterview) return null;
    setLoading(true);
    try {
      const { data } = await completeInterview(currentInterview._id, { duration });
      setCurrentInterview(data.interview);
      return data.interview;
    } catch (err) {
      toast.error('Failed to complete interview');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentInterview]);

  const nextQuestion = () => {
    if (currentInterview && currentQuestionIndex < currentInterview.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1);
  };

  const reset = () => {
    setCurrentInterview(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setRealtimeFeedback(null);
  };

  return (
    <InterviewContext.Provider
      value={{
        currentInterview,
        currentQuestionIndex,
        answers,
        loading,
        isRecording,
        realtimeFeedback,
        setIsRecording,
        setRealtimeFeedback,
        loadInterview,
        submitCurrentAnswer,
        finishInterview,
        nextQuestion,
        prevQuestion,
        reset,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
};
