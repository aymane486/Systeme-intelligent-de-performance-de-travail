import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import CollaboratorDashboard from './pages/collaborator/CollaboratorDashboard';
import MyTasks from './pages/collaborator/MyTasks';
import History from './pages/collaborator/History';
import Transparency from './pages/collaborator/Transparency';
import DirectionDashboard from './pages/direction/DirectionDashboard';
import RTDashboard from './pages/rt/RTDashboard';
import MyTeam from './pages/rt/MyTeam';
import ProjectsList from './pages/ProjectsList';
import UsersManagement from './pages/admin/UsersManagement';
import ProjectsManagement from './pages/admin/ProjectsManagement';
import TeamsManagement from './pages/admin/TeamsManagement';
import TasksManagement from './pages/admin/TasksManagement';
import AuditLogs from './pages/admin/AuditLogs';
import './App.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case Role.DIRECTION: return '/direction';
      case Role.RESPONSABLE_TECHNIQUE: return '/rt';
      case Role.ADMIN: return '/admin';
      default: return '/collaborator';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <Login />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Collaborateur */}
        <Route path="/collaborator" element={<CollaboratorDashboard />} />
        <Route path="/collaborator/tasks" element={<MyTasks />} />
        <Route path="/collaborator/history" element={<History />} />
        <Route path="/collaborator/transparency" element={<Transparency />} />

        {/* Direction */}
        <Route path="/direction" element={
          <ProtectedRoute roles={[Role.DIRECTION, Role.ADMIN]}><DirectionDashboard /></ProtectedRoute>
        } />
        <Route path="/direction/projects" element={
          <ProtectedRoute roles={[Role.DIRECTION, Role.ADMIN]}><ProjectsList /></ProtectedRoute>
        } />

        {/* Responsable Technique */}
        <Route path="/rt" element={
          <ProtectedRoute roles={[Role.RESPONSABLE_TECHNIQUE, Role.ADMIN]}><RTDashboard /></ProtectedRoute>
        } />
        <Route path="/rt/projects" element={
          <ProtectedRoute roles={[Role.RESPONSABLE_TECHNIQUE, Role.ADMIN]}><ProjectsList /></ProtectedRoute>
        } />
        <Route path="/rt/team" element={
          <ProtectedRoute roles={[Role.RESPONSABLE_TECHNIQUE, Role.ADMIN]}><MyTeam /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={[Role.ADMIN]}><DirectionDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/projects" element={
          <ProtectedRoute roles={[Role.ADMIN]}><ProjectsManagement /></ProtectedRoute>
        } />
        <Route path="/admin/teams" element={
          <ProtectedRoute roles={[Role.ADMIN]}><TeamsManagement /></ProtectedRoute>
        } />
        <Route path="/admin/tasks" element={
          <ProtectedRoute roles={[Role.ADMIN]}><TasksManagement /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={[Role.ADMIN]}><UsersManagement /></ProtectedRoute>
        } />
        <Route path="/admin/audit" element={
          <ProtectedRoute roles={[Role.ADMIN]}><AuditLogs /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
