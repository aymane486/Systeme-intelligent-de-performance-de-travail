import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardStats, ActiveCollaborator, AIPrediction, WorkloadItem } from '../../types';
import { Users, FolderKanban, AlertTriangle, Clock, CheckCircle, Activity, Brain, TrendingUp, Zap, BarChart3, FileSpreadsheet, FileText } from 'lucide-react';
import api from '../../services/api';

function TimeSince({ startTime, paused }: { startTime: string; paused: boolean }) {
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
    if (!paused) {
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [startTime, paused]);

  return <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{elapsed}</span>;
}

export default function RTDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeCollabs, setActiveCollabs] = useState<ActiveCollaborator[]>([]);
  const [ai, setAi] = useState<AIPrediction | null>(null);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTab, setAiTab] = useState<'risks' | 'bottlenecks' | 'recommendations'>('risks');

  const loadData = () => {
    Promise.all([
      dashboardService.getRTDashboard(),
      dashboardService.getActiveCollaborators(),
      dashboardService.getAIPredictions(),
      dashboardService.getWorkload(),
    ]).then(([s, collabs, aiData, wl]) => {
      setStats(s);
      setActiveCollabs(collabs);
      setAi(aiData);
      setWorkload(wl);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const id = setInterval(() => {
      dashboardService.getActiveCollaborators().then(setActiveCollabs);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;
  if (!stats) return <div>Erreur de chargement</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard Responsable Technique</h1>
          <p className="page-subtitle">Vue detaillee de vos equipes et taches</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={async () => {
            const res = await api.get('/export/excel', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'rapport-intellcap.xlsx'; a.click();
            URL.revokeObjectURL(url);
          }}>
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button className="btn btn-outline" onClick={async () => {
            const res = await api.get('/export/pdf', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'rapport-intellcap.pdf'; a.click();
            URL.revokeObjectURL(url);
          }}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><FolderKanban size={14} style={{ marginRight: 4 }} /> Mes projets</div>
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-sub">{stats.activeProjects} actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><CheckCircle size={14} style={{ marginRight: 4 }} /> Taches</div>
          <div className="stat-value">{stats.completedTasks}/{stats.totalTasks}</div>
          <div className="stat-sub">terminees</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><AlertTriangle size={14} style={{ marginRight: 4, color: 'var(--danger)' }} /> Blocages</div>
          <div className="stat-value" style={{ color: stats.blockedTasks > 0 ? 'var(--danger)' : 'inherit' }}>
            {stats.blockedTasks}
          </div>
          <div className="stat-sub">taches bloquees</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Clock size={14} style={{ marginRight: 4 }} /> Temps total</div>
          <div className="stat-value">{Math.round(stats.totalTimeSpentMinutes / 60)}h</div>
          <div className="stat-sub">sur {stats.budgetHoursTotal}h budgetees</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">
          <Activity size={18} style={{ marginRight: 8, color: 'var(--success)' }} />
          Activite en temps reel
          <span style={{
            marginLeft: 12,
            fontSize: '0.75rem',
            padding: '2px 10px',
            borderRadius: 12,
            background: activeCollabs.length > 0 ? 'var(--success)' : '#888',
            color: '#fff',
            fontWeight: 500,
          }}>
            {activeCollabs.length} actif{activeCollabs.length !== 1 ? 's' : ''}
          </span>
        </h2>
        {activeCollabs.length === 0 ? (
          <p style={{ color: '#888', padding: '16px 0' }}>Aucun collaborateur n'a la cle active en ce moment.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Projet</th>
                <th>Tache</th>
                <th>Duree</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {activeCollabs.map((c) => (
                <tr key={c.userId}>
                  <td style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</td>
                  <td>{c.projectName}</td>
                  <td>{c.taskName}</td>
                  <td><TimeSince startTime={c.startTime} paused={c.paused} /></td>
                  <td>
                    <span className={`badge ${c.paused ? 'warning' : 'success'}`}>
                      {c.paused ? 'En pause' : 'En cours'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Projets de mon equipe</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Projet</th>
              <th>Progression</th>
              <th>Budget</th>
              <th>Echeance</th>
            </tr>
          </thead>
          <tbody>
            {stats.projects.map((project) => {
              const timeUsedH = Math.round(project.totalTimeSpentMinutes / 60);
              return (
                <tr key={project.id}>
                  <td style={{ fontWeight: 500 }}>{project.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 100 }}>
                        <div className={`progress-fill ${project.globalProgress === 100 ? 'success' : project.globalProgress >= 60 ? '' : 'warning'}`} style={{ width: `${project.globalProgress}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>{project.globalProgress}%</span>
                    </div>
                  </td>
                  <td>{timeUsedH}h / {project.budgetHours || '?'}h</td>
                  <td>{project.endDate || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {workload.length > 0 && (() => {
        const maxMin = Math.max(...workload.map(w => w.totalMinutes), 1);
        return (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
              Repartition de charge
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {workload.map((w) => {
                const hours = Math.round(w.totalMinutes / 60 * 10) / 10;
                const pct = Math.round((w.totalMinutes / maxMin) * 100);
                return (
                  <div key={w.userId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {w.firstName} {w.lastName}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {hours}h — {w.activeTasks} active{w.activeTasks !== 1 ? 's' : ''}, {w.completedTasks} terminee{w.completedTasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 20 }}>
                      <div
                        className={`progress-fill ${hours > 40 ? 'danger' : hours > 30 ? 'warning' : ''}`}
                        style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                      />
                      <span style={{
                        position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                        fontSize: '0.7rem', fontWeight: 600, color: pct > 20 ? '#fff' : 'var(--text)',
                      }}>
                        {hours}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {ai && (() => {
        const totalIssues = ai.delayRisks.length + ai.bottlenecks.length + ai.recommendations.length;
        const riskColor = (level: number) =>
          level >= 3 ? '#dc3545' : level === 2 ? '#fd7e14' : '#ffc107';
        const severityColor = (s: string) =>
          s === 'CRITIQUE' ? '#dc3545' : '#fd7e14';
        const priorityColor = (p: string) =>
          p === 'HAUTE' ? '#dc3545' : p === 'MOYENNE' ? '#fd7e14' : '#28a745';

        return (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--primary)', borderRadius: 12 }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={22} style={{ color: 'var(--primary)' }} />
              Moteur IA — Analyse Predictive
              {totalIssues > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: '0.75rem', padding: '2px 10px',
                  borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 500,
                }}>
                  {totalIssues} signal{totalIssues > 1 ? 'aux' : ''}
                </span>
              )}
              <span style={{
                marginLeft: 'auto', fontSize: '0.7rem', padding: '3px 10px',
                borderRadius: 8, background: ai.modelName === 'Random Forest Classifier' ? '#6f42c120' : '#6c757d20',
                color: ai.modelName === 'Random Forest Classifier' ? '#6f42c1' : '#6c757d',
                fontWeight: 500,
              }}>
                {ai.modelName}{ai.modelAccuracy ? ` (${ai.modelAccuracy})` : ''}
              </span>
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                className={`btn ${aiTab === 'risks' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem' }}
                onClick={() => setAiTab('risks')}
              >
                <TrendingUp size={14} /> Risques de retard ({ai.delayRisks.length})
              </button>
              <button
                className={`btn ${aiTab === 'bottlenecks' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem' }}
                onClick={() => setAiTab('bottlenecks')}
              >
                <Zap size={14} /> Goulots ({ai.bottlenecks.length})
              </button>
              <button
                className={`btn ${aiTab === 'recommendations' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem' }}
                onClick={() => setAiTab('recommendations')}
              >
                <Users size={14} /> Recommandations ({ai.recommendations.length})
              </button>
            </div>

            {aiTab === 'risks' && (
              ai.delayRisks.length === 0 ? (
                <p style={{ color: '#28a745', padding: '16px 0' }}>Aucun risque de retard detecte. Tous les projets sont dans les temps.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Risque</th>
                      <th>Projet / Tache</th>
                      <th>Assigne</th>
                      <th>Progression</th>
                      <th>Temps</th>
                      <th>Probabilite ML</th>
                      <th>Projection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ai.delayRisks.map((risk, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 8,
                            fontSize: '0.75rem', fontWeight: 600,
                            background: riskColor(risk.riskLevel) + '20', color: riskColor(risk.riskLevel),
                          }}>
                            {risk.riskLabel}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{risk.projectName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{risk.taskName}</div>
                        </td>
                        <td>{risk.assigneeName}</td>
                        <td>{risk.progressPercent}%</td>
                        <td>{risk.consumedHours}h / {risk.estimatedHours}h</td>
                        <td>
                          {risk.mlProbability >= 0 ? (
                            <span style={{
                              fontWeight: 600, color: riskColor(risk.riskLevel),
                            }}>
                              {risk.mlProbability}%
                            </span>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ color: riskColor(risk.riskLevel), fontWeight: 600 }}>
                          {risk.predictedTotalHours}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {aiTab === 'bottlenecks' && (
              ai.bottlenecks.length === 0 ? (
                <p style={{ color: '#28a745', padding: '16px 0' }}>Aucun goulot d'etranglement detecte.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ai.bottlenecks.map((b, i) => (
                    <div key={i} style={{
                      padding: 16, borderRadius: 8,
                      border: `1px solid ${severityColor(b.severity)}40`,
                      background: severityColor(b.severity) + '08',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Zap size={16} style={{ color: severityColor(b.severity) }} />
                        <strong>{b.entityName}</strong>
                        <span style={{
                          fontSize: '0.7rem', padding: '1px 8px', borderRadius: 8,
                          background: severityColor(b.severity), color: '#fff',
                        }}>
                          {b.severity}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {aiTab === 'recommendations' && (
              ai.recommendations.length === 0 ? (
                <p style={{ color: '#28a745', padding: '16px 0' }}>Aucune recommandation pour le moment. Tout est optimal.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ai.recommendations.map((r, i) => (
                    <div key={i} style={{
                      padding: 16, borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary, #f8f9fa)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: '0.7rem', padding: '1px 8px', borderRadius: 8,
                          background: priorityColor(r.priority), color: '#fff',
                        }}>
                          {r.priority}
                        </span>
                        <strong>{r.title}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        );
      })()}

      {stats.activeAlerts.length > 0 && (
        <div className="card">
          <h2 className="card-title">Alertes</h2>
          <div className="alert-list">
            {stats.activeAlerts.map((alert) => (
              <div key={alert.id} className="alert-item">
                <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
                <div className="alert-text">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
