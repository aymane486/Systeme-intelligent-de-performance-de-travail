import { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserPlus, Pencil, Trash2, X } from 'lucide-react';

type UserItem = {
  id: number; email: string; firstName: string; lastName: string;
  role: string; teamId?: number; teamName?: string;
};
type TeamItem = { id: number; name: string };

const roles = [
  { value: 'COLLABORATEUR', label: 'Collaborateur' },
  { value: 'RESPONSABLE_TECHNIQUE', label: 'Responsable Technique' },
  { value: 'DIRECTION', label: 'Direction' },
  { value: 'ADMIN', label: 'Administrateur' },
];

const emptyForm = { email: '', password: '', firstName: '', lastName: '', role: 'COLLABORATEUR', teamId: '' as string };

export default function UsersManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/users').then(r => r.data),
      api.get('/users/teams').then(r => r.data),
    ]).then(([u, t]) => { setUsers(u); setTeams(t); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u: UserItem) => {
    setEditId(u.id);
    setForm({ email: u.email, password: '', firstName: u.firstName, lastName: u.lastName, role: u.role, teamId: u.teamId?.toString() || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, teamId: form.teamId ? Number(form.teamId) : null };
    if (editId) {
      await api.put(`/users/${editId}`, body);
    } else {
      await api.post('/users', body);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/users/${id}`);
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Gestion Utilisateurs</h1>
          <p className="page-subtitle">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={16} /> Nouvel utilisateur
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Role</th>
              <th>Equipe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'DIRECTION' ? 'badge-info' : u.role === 'RESPONSABLE_TECHNIQUE' ? 'badge-warning' : 'badge-success'}`}>
                    {roles.find(r => r.value === u.role)?.label || u.role}
                  </span>
                </td>
                <td>{u.teamName || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openEdit(u)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(u.id)}>
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
              <h3>{editId ? 'Modifier' : 'Creer'} un utilisateur</h3>
              <button className="btn btn-outline" style={{ padding: 4 }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Prenom</label>
                <input className="form-input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe {editId && '(laisser vide pour ne pas changer)'}</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} {...(!editId && { required: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipe</label>
                <select className="form-select" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
                  <option value="">Aucune</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
