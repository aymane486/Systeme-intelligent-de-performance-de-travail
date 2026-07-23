import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      switch (user.role) {
        case Role.DIRECTION:
          navigate('/direction');
          break;
        case Role.RESPONSABLE_TECHNIQUE:
          navigate('/rt');
          break;
        case Role.ADMIN:
          navigate('/admin');
          break;
        default:
          navigate('/collaborator');
      }
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Direction', email: 'direction@intellcap.com', password: 'direction123' },
    { label: 'Resp. Technique', email: 'rt@intellcap.com', password: 'rt123' },
    { label: 'Collaborateur', email: 'collab1@intellcap.com', password: 'collab123' },
    { label: 'Admin', email: 'admin@intellcap.com', password: 'admin123' },
  ];

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">INTELLCAP</h1>
        <p className="login-subtitle">Solution de Monitoring du Travail</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 8 }}>Comptes de demo:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                className="btn btn-outline"
                style={{ justifyContent: 'center', fontSize: '0.8rem' }}
                onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
              >
                {acc.label} - {acc.email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
