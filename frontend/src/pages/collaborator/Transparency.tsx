import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

type TaskView = {
  taskId: number;
  taskName: string;
  projectName: string;
  status: string;
  progressPercent: number;
  timeSpentMinutes: number;
  estimatedHours?: number;
};

type TransparencyData = {
  firstName: string;
  lastName: string;
  teamName: string;
  rtName: string;
  totalTimeSpentMinutes: number;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  tasks: TaskView[];
  recentSessions: { id: number; taskName: string; projectName: string; startTime: string; endTime: string; totalMinutes: number }[];
};

const statusLabels: Record<string, string> = {
  EN_COURS: 'En cours', BLOQUE: 'Bloque', TERMINE: 'Termine', EN_PAUSE: 'En pause',
};
const statusBadge: Record<string, string> = {
  EN_COURS: 'badge-info', BLOQUE: 'badge-danger', TERMINE: 'badge-success', EN_PAUSE: 'badge-warning',
};

export default function Transparency() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transparency/my-view').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;
  if (!data) return <div>Erreur de chargement</div>;

  const totalH = Math.round(data.totalTimeSpentMinutes / 60 * 10) / 10;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Eye size={24} style={{ marginRight: 8 }} /> Transparence
        </h1>
        <p className="page-subtitle">Ce que votre RT et la Direction voient sur vous</p>
      </div>

      <div className="card" style={{ marginBottom: 24, background: 'var(--bg-secondary, #f0f4f8)', border: '1px dashed var(--border)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>
          Cette page affiche exactement les memes donnees que celles visibles par votre Responsable Technique ({data.rtName}) et la Direction.
          Aucune autre information vous concernant n'est collectee. Equipe: <strong>{data.teamName}</strong>.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Clock size={14} style={{ marginRight: 4 }} /> Temps total</div>
          <div className="stat-value">{totalH}h</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><CheckCircle size={14} style={{ marginRight: 4 }} /> Taches</div>
          <div className="stat-value">{data.completedTasks}/{data.totalTasks}</div>
          <div className="stat-sub">terminees</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><AlertTriangle size={14} style={{ marginRight: 4, color: 'var(--danger)' }} /> Blocages</div>
          <div className="stat-value" style={{ color: data.blockedTasks > 0 ? 'var(--danger)' : 'inherit' }}>{data.blockedTasks}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Vos taches (vues par le RT et la Direction)</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Projet</th>
              <th>Tache</th>
              <th>Statut</th>
              <th>Progression</th>
              <th>Temps passe</th>
              <th>Estime</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((t) => (
              <tr key={t.taskId}>
                <td>{t.projectName}</td>
                <td style={{ fontWeight: 500 }}>{t.taskName}</td>
                <td><span className={`badge ${statusBadge[t.status] || ''}`}>{statusLabels[t.status] || t.status}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className={`progress-fill ${t.progressPercent >= 80 ? 'success' : t.progressPercent >= 40 ? '' : 'warning'}`} style={{ width: `${t.progressPercent}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{t.progressPercent}%</span>
                  </div>
                </td>
                <td>{Math.round(t.timeSpentMinutes / 60)}h</td>
                <td>{t.estimatedHours ? `${t.estimatedHours}h` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card-title">Dernieres sessions (vues par le RT)</h2>
        {data.recentSessions.length === 0 ? (
          <p style={{ color: 'var(--text-light)' }}>Aucune session enregistree.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Projet</th>
                <th>Tache</th>
                <th>Duree</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSessions.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.startTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                  <td>{s.projectName}</td>
                  <td style={{ fontWeight: 500 }}>{s.taskName}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {s.totalMinutes ? `${Math.floor(s.totalMinutes / 60)}h${(s.totalMinutes % 60).toString().padStart(2, '0')}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
