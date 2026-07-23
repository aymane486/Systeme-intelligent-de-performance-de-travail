import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { LayoutDashboard, FolderKanban, Key, Users, LogOut, Settings, Clock, Eye, ListTodo, Shield } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case Role.DIRECTION:
        return [
          { to: '/direction', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
          { to: '/direction/projects', icon: <FolderKanban size={18} />, label: 'Projets' },
        ];
      case Role.RESPONSABLE_TECHNIQUE:
        return [
          { to: '/rt', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
          { to: '/rt/projects', icon: <FolderKanban size={18} />, label: 'Projets' },
          { to: '/rt/team', icon: <Users size={18} />, label: 'Mon Equipe' },
        ];
      case Role.ADMIN:
        return [
          { to: '/admin', icon: <Settings size={18} />, label: 'Administration' },
          { to: '/admin/projects', icon: <FolderKanban size={18} />, label: 'Projets' },
          { to: '/admin/tasks', icon: <ListTodo size={18} />, label: 'Taches' },
          { to: '/admin/teams', icon: <Users size={18} />, label: 'Equipes' },
          { to: '/admin/users', icon: <Users size={18} />, label: 'Utilisateurs' },
          { to: '/admin/audit', icon: <Shield size={18} />, label: 'Tracabilite' },
        ];
      default:
        return [
          { to: '/collaborator', icon: <Key size={18} />, label: 'Ma Cle' },
          { to: '/collaborator/tasks', icon: <FolderKanban size={18} />, label: 'Mes Taches' },
          { to: '/collaborator/history', icon: <Clock size={18} />, label: 'Historique' },
          { to: '/collaborator/transparency', icon: <Eye size={18} />, label: 'Transparence' },
        ];
    }
  };

  const getRoleLabel = (role?: Role) => {
    switch (role) {
      case Role.DIRECTION: return 'Direction';
      case Role.RESPONSABLE_TECHNIQUE: return 'Responsable Technique';
      case Role.ADMIN: return 'Administrateur';
      default: return 'Collaborateur';
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">INTELLCAP</div>
        <div className="sidebar-subtitle">Cle Digitale Virtuelle</div>

        <nav className="sidebar-nav">
          {getNavLinks().map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
          <div className="sidebar-user-role">{getRoleLabel(user?.role)}</div>
          <button className="btn btn-outline" style={{ marginTop: 12, width: '100%', color: '#cbd5e1', borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={16} /> Deconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
