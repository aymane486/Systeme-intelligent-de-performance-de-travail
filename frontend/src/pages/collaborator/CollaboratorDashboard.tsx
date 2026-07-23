import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { keyService } from '../../services/key.service';
import { taskService } from '../../services/task.service';
import { TaskStatus } from '../../types';
import type { Task, KeyStatus } from '../../types';
import { Key, Pause, Play, Square } from 'lucide-react';

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ active: false });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (keyStatus.active && keyStatus.startTime && !keyStatus.paused) {
      const start = new Date(keyStatus.startTime).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [keyStatus.active, keyStatus.paused, keyStatus.startTime]);

  const loadData = async () => {
    if (!user) return;
    const [status, userTasks] = await Promise.all([
      keyService.getStatus(),
      taskService.getByUser(user.userId),
    ]);
    setKeyStatus(status);
    setTasks(userTasks);
    if (status.taskId) setSelectedTaskId(status.taskId);
  };

  const handleActivate = async () => {
    if (!selectedTaskId) return;
    await keyService.activate(selectedTaskId);
    await loadData();
  };

  const handleDeactivate = async () => {
    await keyService.deactivate();
    setElapsed(0);
    await loadData();
  };

  const handlePause = async () => {
    await keyService.pause();
    await loadData();
  };

  const handleResume = async () => {
    await keyService.resume();
    await loadData();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTasks = tasks.filter(t => t.status !== TaskStatus.TERMINE);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ma Cle Digitale</h1>
        <p className="page-subtitle">Activez votre cle pour commencer a travailler sur une tache</p>
      </div>

      <div className={`key-widget ${keyStatus.active ? 'active' : ''}`}>
        <div
          className={`key-icon ${keyStatus.active ? 'active' : 'inactive'}`}
          onClick={keyStatus.active ? handleDeactivate : handleActivate}
        >
          <Key size={36} />
        </div>

        <div className="key-status">
          {keyStatus.active
            ? keyStatus.paused ? 'En pause' : 'Cle active'
            : 'Cle inactive'}
        </div>

        {keyStatus.active && (
          <div className="key-timer">{formatTime(elapsed)}</div>
        )}

        {!keyStatus.active && (
          <div style={{ marginTop: 16 }}>
            <select
              className="form-select"
              style={{ maxWidth: 300, margin: '0 auto' }}
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(Number(e.target.value))}
            >
              <option value="">Choisir une tache...</option>
              {activeTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.projectName} - {task.name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-success btn-lg" onClick={handleActivate} disabled={!selectedTaskId}>
                <Play size={18} /> Activer la cle
              </button>
            </div>
          </div>
        )}

        {keyStatus.active && (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
            {keyStatus.paused ? (
              <button className="btn btn-primary" onClick={handleResume}>
                <Play size={16} /> Reprendre
              </button>
            ) : (
              <button className="btn btn-outline" onClick={handlePause}>
                <Pause size={16} /> Pause
              </button>
            )}
            <button className="btn btn-danger" onClick={handleDeactivate}>
              <Square size={16} /> Desactiver
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Mes taches en cours</h2>
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
            {activeTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.projectName}</td>
                <td>{task.name}</td>
                <td>
                  <span className={`badge ${task.status === TaskStatus.BLOQUE ? 'badge-danger' : task.status === TaskStatus.EN_PAUSE ? 'badge-warning' : 'badge-info'}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 100 }}>
                      <div className={`progress-fill ${task.progressPercent >= 80 ? 'success' : task.progressPercent >= 40 ? '' : 'warning'}`} style={{ width: `${task.progressPercent}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{task.progressPercent}%</span>
                  </div>
                </td>
                <td>{Math.round(task.totalTimeSpentMinutes / 60)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
