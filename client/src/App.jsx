import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import JobsPage from './pages/jobs/JobsPage';
import IdeasPage from './pages/ideas/IdeasPage';
import IdeaDetailPage from './pages/ideas/IdeaDetailPage';
import CreateIdeaPage from './pages/ideas/CreateIdeaPage';
import GroupsPage from './pages/groups/GroupsPage';
import GroupChatPage from './pages/groups/GroupChatPage';
import ATSPage from './pages/ats/ATSPage';
import FeedPage from './pages/feed/FeedPage';
import ProfilePage from './pages/profile/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/jobs" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/jobs" replace />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="ideas" element={<IdeasPage />} />
            <Route path="ideas/new" element={<CreateIdeaPage />} />
            <Route path="ideas/:id" element={<IdeaDetailPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:id" element={<GroupChatPage />} />
            <Route path="ats" element={<ATSPage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
