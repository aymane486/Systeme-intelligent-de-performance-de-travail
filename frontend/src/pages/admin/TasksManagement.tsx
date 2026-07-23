import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

type TaskItem = {
  id: number; name: string; description?: string; status: string;
  progressPercent: number; projectId: number; projectName: string;
  assigneeId?: number; assigneeName?: string; estimatedHours?: number;
  totalTimeSpentMinutes: number; technicalComment?: string;
};
type ProjectItem = { id: number; name: string };
type UserItem = { id: number; firstName: string; lastName: string; role: string };

const statuses = [
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'BLOQUE', label: 'Bloque' },
  { value: 'EN_PAUSE', label: 'En pause' },
  { value: 'TERMINE', label: 'Termine' },
];

const emptyForm = { name: '', description: '', projectId: '' as string, assigneeId: '' as string, estimatedHours: '', status: 'EN_COURS' };

export default function TasksManagement() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/projects').then(r => r.data),
      api.get('/users').then(r => r.data),
    ]).then(([p, u]) => {
      setProjects(p);
      setUsers(u);
      return Promise.all(
        p.map((proj: ProjectItem) => api.get(`/tasks/project/${proj.id}`).then(r => r.data))
      );
    }).then((taskArrays: TaskItem[][]) => {
      setTasks(taskArrays.flat());
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const collaborators = users.filter(u => u.role === 'COLLABORATEUR');

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: TaskItem) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      description: t.description || '',
      projectId: t.projectId.toString(),
      assigneeId: t.assigneeId?.toString() || '',
      estimatedHours: t.estimatedHours?.toString() || '',
      status: t.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name,
      description: form.description,
      projectId: Number(form.projectId),
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      status: form.status,
    };
    if (editId) {
      await api.put('/tasks/progress', {
        taskId: editId,
        progressPercent: tasks.find(t => t.id === editId)?.progressPercent || 0,
        status: form.status,
      });
    } else {
      await api.post('/tasks', body);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tasks/${id}`);
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Gestion Taches</h1>
          <p className="page-subtitle">{tasks.length} tache{tasks.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nouvelle tache
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Tache</th>
              <th>Projet</th>
              <th>Assignee</th>
              <th>Statut</th>
              <th>Progression</th>
              <th>Temps</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{t.name}</div>
                  {t.technicalComment && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{t.technicalComment}</div>}
                </td>
                <td>{t.projectName}</td>
                <td>{t.assigneeName || '-'}</td>
                <td>
                  <span className={`badge ${t.status === 'TERMINE' ? 'badge-success' : t.status === 'BLOQUE' ? 'badge-danger' : t.status === 'EN_PAUSE' ? 'badge-warning' : 'badge-info'}`}>
                    {statuses.find(s => s.value === t.status)?.label || t.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="progress-bar" style={{ width: 60 }}>
                      <div className={`progress-fill ${t.progressPercent === 100 ? 'success' : ''}`} style={{ width: `${t.progressPercent}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{t.progressPercent}%</span>
                  </div>
                </td>
                <td>{Math.round(t.totalTimeSpentMinutes / 60)}h / {t.estimatedHours || '?'}h</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openEdit(t)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(t.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Modifier' : 'Creer'} une tache</h3>
              <button className="btn btn-outline" style={{ padding: 4 }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom de la tache</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Projet</label>
                <select className="form-select" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
                  <option value="">Choisir un projet...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Assignee</label>
                  <select className="form-select" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
                    <option value="">Non assigne</option>
                    {collaborators.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Estimation (heures)</label>
                  <input className="form-input" type="number" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
                </div>
              </div>
              {editId && (
                <div className="form-group">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                {editId ? 'Enregistrer' : 'Creer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
