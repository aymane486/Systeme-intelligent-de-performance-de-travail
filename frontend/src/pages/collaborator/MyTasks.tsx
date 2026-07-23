import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/task.service';
import { TaskStatus } from '../../types';
import type { Task } from '../../types';

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.EN_COURS);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (user) {
      taskService.getByUser(user.userId).then(setTasks);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!editingTask) return;
    await taskService.updateProgress(editingTask.id, progress, status, comment);
    setEditingTask(null);
    if (user) {
      const updated = await taskService.getByUser(user.userId);
      setTasks(updated);
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setProgress(task.progressPercent);
    setStatus(task.status);
    setComment(task.technicalComment || '');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mes Taches</h1>
        <p className="page-subtitle">Declarez votre avancement et signalez les blocages</p>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Projet</th>
              <th>Tache</th>
              <th>Statut</th>
              <th>Progression</th>
              <th>Estime</th>
              <th>Passe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.projectName}</td>
                <td>
                  <div>{task.name}</div>
                  {task.technicalComment && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>
                      {task.technicalComment}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${task.status === TaskStatus.TERMINE ? 'badge-success' : task.status === TaskStatus.BLOQUE ? 'badge-danger' : 'badge-info'}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className={`progress-fill ${task.progressPercent === 100 ? 'success' : ''}`} style={{ width: `${task.progressPercent}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{task.progressPercent}%</span>
                  </div>
                </td>
                <td>{task.estimatedHours}h</td>
                <td>{Math.round(task.totalTimeSpentMinutes / 60)}h</td>
                <td>
                  {task.status !== TaskStatus.TERMINE && (
                    <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => openEdit(task)}>
                      Mettre a jour
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Mettre a jour: {editingTask.name}</h3>

            <div className="form-group">
              <label className="form-label">Progression (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ textAlign: 'center', fontWeight: 600 }}>{progress}%</div>
            </div>

            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value={TaskStatus.EN_COURS}>En cours</option>
                <option value={TaskStatus.BLOQUE}>Bloque</option>
                <option value={TaskStatus.EN_PAUSE}>En pause</option>
                <option value={TaskStatus.TERMINE}>Termine</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Commentaire technique</label>
              <textarea
                className="form-input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Details techniques, blocages..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditingTask(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
