import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import ProgressPage from './pages/ProgressPage';
import CodingInterviewPage from './pages/CodingInterviewPage';
import CandidateRankingPage from './pages/CandidateRankingPage';
import IntelligencePage from './pages/IntelligencePage';
import AICoachPage from './pages/AICoachPage';

export default function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/interview/setup" element={<InterviewSetupPage />} />
              <Route path="/interview/:id" element={<InterviewPage />} />
              <Route path="/interview/:id/coding" element={<CodingInterviewPage />} />
              <Route path="/resume" element={<ResumeUploadPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/recruiter" element={<RecruiterDashboardPage />} />
              <Route path="/recruiter/ranking" element={<CandidateRankingPage />} />
              <Route path="/intelligence" element={<IntelligencePage />} />
              <Route path="/coach" element={<AICoachPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </InterviewProvider>
    </AuthProvider>
  );
}
