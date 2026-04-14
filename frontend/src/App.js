import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import RegisterPage from './pages/RegisterPage';
import TokenPage from './pages/TokenPage';

// Admin pages
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import QueuePage from './pages/QueuePage';
import SearchPage from './pages/SearchPage';
import VisitPage from './pages/VisitPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import PatientsListPage from './pages/PatientsListPage';

// Loading spinner
const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="font-display text-brand-700 font-semibold">Loading MediQueue...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

// Redirect if already logged in
const PublicAdminRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (admin) return <Navigate to="/admin/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public Patient Routes ── */}
          <Route path="/" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/token" element={<TokenPage />} />

          {/* ── Admin Auth ── */}
          <Route path="/admin/login" element={<PublicAdminRoute><LoginPage /></PublicAdminRoute>} />

          {/* ── Protected Admin Routes ── */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="queue" element={<QueuePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="patients" element={<PatientsListPage />} />
           <Route path="patient/:id" element={<PatientHistoryPage />} />
            <Route path="visit/:id" element={<VisitPage />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
