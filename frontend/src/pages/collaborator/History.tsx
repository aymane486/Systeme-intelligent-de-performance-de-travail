import { useState, useEffect } from 'react';
import { keyService } from '../../services/key.service';
import type { TimeEntry } from '../../types';
import { Clock, Calendar } from 'lucide-react';

export default function History() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keyService.getHistory().then(setEntries).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const totalMinutes = entries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mon Historique</h1>
        <p className="page-subtitle">{entries.length} session{entries.length > 1 ? 's' : ''} — {totalHours}h au total</p>
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
          <Clock size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>Aucune session enregistree. Activez votre cle pour commencer.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Projet</th>
                <th>Tache</th>
                <th>Debut</th>
                <th>Fin</th>
                <th>Duree</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} style={{ color: 'var(--text-light)' }} />
                      {formatDate(entry.startTime)}
                    </div>
                  </td>
                  <td>{entry.projectName}</td>
                  <td style={{ fontWeight: 500 }}>{entry.taskName}</td>
                  <td>{formatTime(entry.startTime)}</td>
                  <td>{entry.endTime ? formatTime(entry.endTime) : '-'}</td>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {entry.totalMinutes ? formatDuration(entry.totalMinutes) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
