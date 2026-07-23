import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield } from 'lucide-react';

type LogEntry = {
  id: number; userEmail: string; userName: string;
  action: string; endpoint: string; method: string; timestamp: string;
};

const actionColor = (action: string) => {
  switch (action) {
    case 'Consultation': return 'badge-info';
    case 'Creation': return 'badge-success';
    case 'Modification': return 'badge-warning';
    case 'Suppression': return 'badge-danger';
    default: return '';
  }
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit').then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Shield size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Tracabilite
        </h1>
        <p className="page-subtitle">Log de qui a consulte quelle donnee et quand</p>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Endpoint</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{log.userName || log.userEmail}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{log.userEmail}</div>
                </td>
                <td>
                  <span className={`badge ${actionColor(log.action)}`}>{log.action}</span>
                </td>
                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--text-light)', marginRight: 4 }}>{log.method}</span>
                  {log.endpoint}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>Aucun log pour le moment</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
