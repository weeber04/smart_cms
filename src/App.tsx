// SIMPLEST FIX - App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { SignInPage } from './components/AdminComponent/SignInPage';
import { Dashboard } from './components/AdminComponent/Dashboard';
import { DoctorPortal } from './components/DoctorComponent/DoctorPortal';
import { ReceptionistPortal } from './components/ReceptionistComponent/ReceptionistPortal';

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* ALWAYS show SignInPage on /signin route */}
        <Route path="/signin" element={<SignInPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            {!user ? (
              <Navigate to="/signin" replace />
            ) : user.role === 'Admin' || user.role === 'admin' ? (
              <Navigate to="/dashboard" replace />
            ) : user.role === 'Doctor' || user.role === 'doctor' ? (
              <Navigate to="/doctor" replace />
            ) : user.role === 'Receptionist' || user.role === 'receptionist' ? (
              <Navigate to="/receptionist" replace />
            ) : (
              <Navigate to="/signin" replace />
            )}
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole={['Admin', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/doctor/*" element={
          <ProtectedRoute requiredRole={['Doctor', 'doctor']}>
            <DoctorPortal />
          </ProtectedRoute>
        } />

        <Route path="/receptionist/*" element={
          <ProtectedRoute requiredRole={['Receptionist', 'receptionist']}>
            <ReceptionistPortal />
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}