import React, { useEffect, useState } from 'react';
import { listUsers, createUser, updateUser, deleteUser } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types/auth';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Create form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [saving, setSaving] = useState(false);

  const load = () => listUsers().then(setUsers).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setCreating(true);
    try {
      await createUser(newUsername.trim(), newPassword, newRole);
      setInfo(`User "${newUsername.trim()}" created successfully.`);
      setNewUsername(''); setNewPassword(''); setNewRole('user');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: UserProfile) => {
    setEditing(u);
    setEditUsername(u.username);
    setEditPassword('');
    setEditRole(u.role);
    setError(''); setInfo('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setError(''); setSaving(true);
    try {
      await updateUser(editing.id, editUsername.trim(), editPassword, editRole);
      setInfo(`User "${editUsername.trim()}" updated.`);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: UserProfile) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteUser(u.id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-wrap">
      <h2 className="admin-title">👤 User Management</h2>

      {error && <div className="adm-error">{error}</div>}
      {info  && <div className="adm-info">{info}</div>}

      {/* Create User */}
      <div className="adm-card">
        <h3>Add New User</h3>
        <form className="adm-form" onSubmit={handleCreate}>
          <input
            required placeholder="Username"
            value={newUsername} onChange={e => setNewUsername(e.target.value)}
          />
          <input
            required type="password" placeholder="Password" minLength={6}
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
          />
          <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'user')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={creating} className="adm-btn primary">
            {creating ? 'Creating…' : '+ Add User'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="adm-card">
        <h3>All Users</h3>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td className="adm-actions">
                  <button className="adm-btn secondary" onClick={() => openEdit(u)}>✏ Edit</button>
                  {u.id !== profile?.id && (
                    <button className="adm-btn danger" onClick={() => handleDelete(u)}>🗑 Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>No users yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <label>Username</label>
              <input
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                placeholder="Username"
              />
              <label>New Password <span className="hint">(leave blank to keep current)</span></label>
              <input
                type="password"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                placeholder="New password"
                minLength={6}
              />
              <label>Role</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'user')}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="adm-btn primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
