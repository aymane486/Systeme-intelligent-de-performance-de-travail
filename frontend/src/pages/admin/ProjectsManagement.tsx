import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

type ProjectItem = {
  id: number; name: string; description?: string; startDate?: string;
  endDate?: string; budgetHours?: number; teamId?: number; teamName?: string;
  globalProgress: number; totalTimeSpentMinutes: number;
};
type TeamItem = { id: number; name: string };

const emptyForm = { name: '', description: '', startDate: '', endDate: '', budgetHours: '', teamId: '' as string };

export default function ProjectsManagement() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/projects').then(r => r.data),
      api.get('/users/teams').then(r => r.data),
    ]).then(([p, t]) => { setProjects(p); setTeams(t); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: ProjectItem) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description || '',
      startDate: p.startDate || '', endDate: p.endDate || '',
      budgetHours: p.budgetHours?.toString() || '', teamId: p.teamId?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      budgetHours: form.budgetHours ? Number(form.budgetHours) : null,
      teamId: form.teamId ? Number(form.teamId) : null,
    };
    if (editId) {
      await api.put(`/projects/${editId}`, body);
    } else {
      await api.post('/projects', body);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/projects/${id}`);
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Gestion Projets</h1>
          <p className="page-subtitle">{projects.length} projet{projects.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Equipe</th>
              <th>Progression</th>
              <th>Budget</th>
              <th>Echeance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{p.description}</div>}
                </td>
                <td>{p.teamName || '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className={`progress-fill ${p.globalProgress === 100 ? 'success' : ''}`} style={{ width: `${p.globalProgress}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{p.globalProgress}%</span>
                  </div>
                </td>
                <td>{Math.round((p.totalTimeSpentMinutes || 0) / 60)}h / {p.budgetHours || '?'}h</td>
                <td>{p.endDate || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openEdit(p)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(p.id)}>
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
              <h3>{editId ? 'Modifier' : 'Creer'} un projet</h3>
              <button className="btn btn-outline" style={{ padding: 4 }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom du projet</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date debut</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date fin</label>
                  <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Budget (heures)</label>
                  <input className="form-input" type="number" value={form.budgetHours} onChange={e => setForm({ ...form, budgetHours: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Equipe</label>
                  <select className="form-select" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
                    <option value="">Aucune</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
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
