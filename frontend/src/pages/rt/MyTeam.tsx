import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import type { TeamMember } from '../../types';
import { Users, Key, Clock, CheckCircle } from 'lucide-react';

function TimeSince({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime).getTime();
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{elapsed}</span>;
}

const statusLabels: Record<string, string> = {
  EN_COURS: 'En cours',
  BLOQUE: 'Bloqué',
  TERMINE: 'Terminé',
  EN_PAUSE: 'En pause',
};

const statusBadgeClass: Record<string, string> = {
  EN_COURS: 'badge-info',
  BLOQUE: 'badge-danger',
  TERMINE: 'badge-success',
  EN_PAUSE: 'badge-warning',
};

export default function MyTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    dashboardService.getTeamMembers()
      .then(setMembers)
      .finally(() => setLoading(false));

    const id = setInterval(() => {
      dashboardService.getTeamMembers().then(setMembers);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const activeCount = members.filter(m => m.keyActive).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mon Equipe</h1>
        <p className="page-subtitle">{members.length} collaborateur{members.length > 1 ? 's' : ''} — {activeCount} actif{activeCount > 1 ? 's' : ''} en ce moment</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {members.map((member) => (
          <div
            key={member.userId}
            className="card"
            style={{
              border: member.keyActive ? '1px solid var(--success)' : '1px solid var(--border)',
              cursor: 'pointer',
            }}
            onClick={() => setExpandedUser(expandedUser === member.userId ? null : member.userId)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: member.keyActive ? 'var(--success)' : '#6c757d',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '1rem',
                }}>
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{member.firstName} {member.lastName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{member.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {member.keyActive && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Key size={14} style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500 }}>
                        {member.keyPaused ? 'En pause' : 'Cle active'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {member.currentProjectName} — {member.currentTaskName}
                    </div>
                    {member.keyStartTime && !member.keyPaused && (
                      <TimeSince startTime={member.keyStartTime} />
                    )}
                  </div>
                )}
                {!member.keyActive && (
                  <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>Inactif</span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{member.tasks.length}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>taches</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {member.tasks.filter(t => t.status === 'TERMINE').length}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>terminees</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {Math.round(member.tasks.reduce((sum, t) => sum + t.timeSpentMinutes, 0) / 60)}h
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>temps total</div>
                  </div>
                </div>
              </div>
            </div>

            {expandedUser === member.userId && member.tasks.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>Tache</th>
                      <th>Statut</th>
                      <th>Progression</th>
                      <th>Temps passe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {member.tasks.map((task) => (
                      <tr key={task.taskId}>
                        <td>{task.projectName}</td>
                        <td style={{ fontWeight: 500 }}>{task.taskName}</td>
                        <td>
                          <span className={`badge ${statusBadgeClass[task.status] || ''}`}>
                            {statusLabels[task.status] || task.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div
                                className={`progress-fill ${task.progressPercent >= 80 ? 'success' : task.progressPercent >= 40 ? '' : 'warning'}`}
                                style={{ width: `${task.progressPercent}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem' }}>{task.progressPercent}%</span>
                          </div>
                        </td>
                        <td>{Math.round(task.timeSpentMinutes / 60)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>Aucun membre dans votre equipe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
