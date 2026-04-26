import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import KYCForm from './pages/merchant/KYCForm';
import Dashboard from './pages/reviewer/Dashboard';
import SubmissionDetail from './pages/reviewer/SubmissionDetail';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role: 'merchant' | 'reviewer' }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'merchant' ? '/merchant' : '/reviewer'} /> : <Login />} />
        
        <Route path="/merchant" element={
          <ProtectedRoute role="merchant">
            <KYCForm />
          </ProtectedRoute>
        } />
        
        <Route path="/reviewer" element={
          <ProtectedRoute role="reviewer">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/reviewer/submission/:id" element={
          <ProtectedRoute role="reviewer">
            <SubmissionDetail />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
