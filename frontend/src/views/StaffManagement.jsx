import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import api from '../api';
import Modal from '../components/Modal';

export default function StaffManagement() {
  const { showToast, showConfirm } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('Server');
  const [pin, setPin] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch staff list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim() || pin.length !== 4) {
      showToast('Please fill out all fields correctly. PIN must be 4 digits.', 'error');
      return;
    }

    try {
      await api.post('/users', { name, employeeId, role, pin });
      showToast(`Staff member "${name}" registered successfully.`, 'success');
      setShowAddModal(false);
      clearForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to register staff.', 'error');
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setName(user.name);
    setEmployeeId(user.employeeId);
    setRole(user.role);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    try {
      await api.put(`/users/${selectedUser.id}`, { name, employeeId, role });
      showToast('Staff properties updated successfully.', 'success');
      setShowEditModal(false);
      clearForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update staff.', 'error');
    }
  };

  const handleResetClick = (user) => {
    setSelectedUser(user);
    setPin('');
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      showToast('PIN must be exactly 4 digits.', 'error');
      return;
    }

    try {
      await api.put(`/users/${selectedUser.id}/reset-pin`, { pin });
      showToast(`Secure PIN for ${selectedUser.name} reset successfully.`, 'success');
      setShowResetModal(false);
      clearForm();
    } catch (err) {
      console.error(err);
      showToast('Failed to reset PIN.', 'error');
    }
  };

  const handleDeleteClick = async (user) => {
    const confirmed = await showConfirm(
      'Delete Staff Account',
      `Are you sure you want to completely remove "${user.name}" (${user.role}) from the POS database?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${user.id}`);
      showToast('Staff member deleted successfully.', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete staff member.', 'error');
    }
  };

  const clearForm = () => {
    setSelectedUser(null);
    setName('');
    setEmployeeId('');
    setRole('Server');
    setPin('');
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden">
      <header className="h-20 bg-surface flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display shrink-0">
        <div>
          <h2 className="text-xl font-bold text-on-surface leading-tight">Staff Management</h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">
            Manage System Access & User Roles
          </p>
        </div>
        <button
          onClick={() => {
            clearForm();
            setShowAddModal(true);
          }}
          className="h-12 px-5 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-sm"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Register Staff
        </button>
      </header>

      <div className="flex-grow p-container_margin overflow-y-auto custom-scrollbar pb-20 bg-surface-container-lowest/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary animate-spin">
              <span className="material-symbols-outlined text-xl font-bold">sync</span>
            </div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Loading staff records...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Auto Email</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs font-semibold text-on-surface-variant">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-surface-container-lowest/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{userItem.employeeId}</td>
                    <td className="px-6 py-4 font-bold text-on-surface">{userItem.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        userItem.role === 'Manager' ? 'bg-status-danger/10 text-status-danger' :
                        userItem.role === 'Chef' ? 'bg-status-warning/10 text-status-warning' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-outline">{userItem.email}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleResetClick(userItem)}
                        className="px-3 py-1.5 border border-outline-variant/35 text-[10px] uppercase font-bold tracking-wider rounded-lg text-primary hover:bg-primary/5 active:scale-95 transition-all"
                        title="Reset PIN"
                      >
                        Reset PIN
                      </button>
                      <button
                        onClick={() => handleEditClick(userItem)}
                        className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-all"
                        title="Edit Info"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(userItem)}
                        className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        title="Delete Staf"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant bg-surface rounded-3xl border border-dashed border-outline-variant/40 min-h-[50vh]">
            <span className="material-symbols-outlined text-[48px] opacity-35 mb-3">group</span>
            <p className="text-sm font-bold uppercase tracking-wider">No staff members registered</p>
            <p className="text-xs max-w-xs mt-1.5 leading-relaxed">Create system accounts for waiters, managers, and kitchen staff to start using the system.</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Staff Member" maxWidth="max-w-sm">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Staff Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Andi Pratama"
              required
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Employee ID</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. 104"
              required
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
            >
              <option value="Server">Server / Waiter (FOH)</option>
              <option value="Chef">Chef / Cook (BOH)</option>
              <option value="Manager">Manager (Supervisory)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Secure PIN (4 Digits)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. 1234"
              required
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md mt-6 text-xs uppercase tracking-wider"
          >
            Authorize & Save
          </button>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Staff Properties" maxWidth="max-w-sm">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Staff Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Andi Pratama"
              required
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Employee ID</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. 104"
              required
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
            >
              <option value="Server">Server / Waiter (FOH)</option>
              <option value="Chef">Chef / Cook (BOH)</option>
              <option value="Manager">Manager (Supervisory)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md mt-6 text-xs uppercase tracking-wider"
          >
            Apply Changes
          </button>
        </form>
      </Modal>

      {/* Reset PIN Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Security PIN" maxWidth="max-w-sm">
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Specify a new 4-digit PIN for <strong>{selectedUser?.name}</strong>. They will need this new PIN for their next terminal authorization login.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">New PIN (4 Digits)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. 9999"
              required
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md mt-6 text-xs uppercase tracking-wider"
          >
            Reset PIN Hash
          </button>
        </form>
      </Modal>
    </div>
  );
}
