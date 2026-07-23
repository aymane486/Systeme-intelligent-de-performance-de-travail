import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react';

type TeamItem = {
  id: number; name: string; memberCount: number;
  responsableId?: number; responsableName?: string;
};
type UserItem = { id: number; firstName: string; lastName: string; role: string };

const emptyForm = { name: '', responsableId: '' as string };

export default function TeamsManagement() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/team').then(r => r.data),
      api.get('/users').then(r => r.data),
    ]).then(([t, u]) => { setTeams(t); setUsers(u); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const rtUsers = users.filter(u => u.role === 'RESPONSABLE_TECHNIQUE' || u.role === 'ADMIN');

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: TeamItem) => {
    setEditId(t.id);
    setForm({ name: t.name, responsableId: t.responsableId?.toString() || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { name: form.name, responsableId: form.responsableId ? Number(form.responsableId) : null };
    if (editId) {
      await api.put(`/team/${editId}`, body);
    } else {
      await api.post('/team', body);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/team/${id}`);
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Gestion Equipes</h1>
          <p className="page-subtitle">{teams.length} equipe{teams.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nouvelle equipe
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Responsable</th>
              <th>Membres</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td>{t.responsableName || '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} />
                    {t.memberCount} membre{t.memberCount !== 1 ? 's' : ''}
                  </div>
                </td>
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
              <h3>{editId ? 'Modifier' : 'Creer'} une equipe</h3>
              <button className="btn btn-outline" style={{ padding: 4 }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom de l'equipe</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Responsable technique</label>
                <select className="form-select" value={form.responsableId} onChange={e => setForm({ ...form, responsableId: e.target.value })}>
                  <option value="">Aucun</option>
                  {rtUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
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
