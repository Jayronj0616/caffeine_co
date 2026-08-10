import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { getAllProfiles, adminUpdateProfile } from '../../lib/api/auth';

const EditModal = ({ user, onClose, onSaved }) => {
    const [username, setUsername] = useState(user.username || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [role, setRole] = useState(user.role);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await adminUpdateProfile({ id: user.id, username, phone, role });
            onSaved();
        } catch (err) {
            setError(err.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 rounded bg-[var(--adm-bg)] border border-[var(--adm-border)] text-[var(--adm-text)] focus:outline-none focus:border-[var(--adm-copper)]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-md w-full max-w-sm p-6">
                <h3 className="font-display font-bold text-xl mb-4">Edit Account</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[var(--adm-text-dim)] mb-1">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--adm-text-dim)] mb-1">Phone</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--adm-text-dim)] mb-1">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className={inputClass}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {error && <p className="text-sm" style={{ color: 'var(--adm-danger)' }}>{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-[var(--adm-copper)] text-[#1C1613] py-2 rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-[var(--adm-border)] text-[var(--adm-text)] rounded hover:bg-[var(--adm-surface-hi)]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Accounts = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = () => {
        setLoading(true);
        getAllProfiles()
            .then(setUsers)
            .catch((error) => console.error('Error fetching accounts:', error))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSaved = () => {
        setEditingUser(null);
        fetchUsers();
    };

    return (
        <div>
            <h2 className="font-display font-bold text-3xl mb-1">Accounts</h2>
            <p className="text-sm text-[var(--adm-text-dim)] mb-8">Everyone with a login.</p>
            {loading ? (
                <p className="text-[var(--adm-text-dim)] font-data text-sm">Loading accounts...</p>
            ) : users.length === 0 ? (
                <p className="text-[var(--adm-text-dim)] font-data text-sm">No accounts found.</p>
            ) : (
                <div className="bg-[var(--adm-surface)] rounded-md border border-[var(--adm-border)] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--adm-border)] text-left text-[11px] uppercase tracking-[0.15em] text-[var(--adm-text-dim)]">
                                <th className="px-4 py-3">Username</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-[var(--adm-border)] last:border-0 hover:bg-[var(--adm-surface-hi)] transition-colors">
                                    <td className="px-4 py-3 font-semibold text-[var(--adm-text)]">{u.username}</td>
                                    <td className="px-4 py-3 font-data text-[var(--adm-text-dim)]">{u.phone || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-[var(--adm-copper)]/15 text-[var(--adm-copper)]' : 'bg-[var(--adm-patina)]/15 text-[var(--adm-patina)]'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-data text-[var(--adm-text-dim)]">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        {u.role !== 'admin' && (
                                            <button
                                                onClick={() => setEditingUser(u)}
                                                className="p-2 rounded hover:bg-[var(--adm-surface-hi)] text-[var(--adm-text)]"
                                                aria-label="Edit account"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingUser && (
                <EditModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default Accounts;
