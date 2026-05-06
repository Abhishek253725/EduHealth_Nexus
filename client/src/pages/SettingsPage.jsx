import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SettingsPage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    darkMode: false,
  });

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      await api.patch('/users/profile', {
        name: form.name,
        email: form.email,
        notifications: form.notifications,
        darkMode: form.darkMode,
      });

      setMsg('Profile updated successfully');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    if (!form.currentPassword || !form.newPassword) {
      setMsg('Please fill all password fields');
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMsg('New password and confirm password do not match');
      setLoading(false);
      return;
    }

    try {
      await api.patch('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMsg('Password changed successfully');

      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setMsg(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {msg && (
        <div className="p-3 text-sm text-green-700 rounded-lg bg-green-50">
          {msg}
        </div>
      )}

      {/* Profile */}
      <form
        onSubmit={saveProfile}
        className="max-w-2xl p-6 space-y-4 bg-white border shadow-sm rounded-2xl"
      >
        <h2 className="text-xl font-semibold">Profile Settings</h2>

        <div>
          <label className="text-sm text-slate-600">Display name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 mt-1 border rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 mt-1 border rounded-lg"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="notifications"
              checked={form.notifications}
              onChange={handleChange}
            />
            Enable notifications
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="darkMode"
              checked={form.darkMode}
              onChange={handleChange}
            />
            Dark mode
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 text-white bg-blue-700 rounded-xl"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Password */}
      <form
        onSubmit={changePassword}
        className="max-w-2xl p-6 space-y-4 bg-white border shadow-sm rounded-2xl"
      >
        <h2 className="text-xl font-semibold">Change Password</h2>

        <input
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          placeholder="Current password"
          className="w-full px-4 py-3 border rounded-lg"
        />

        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="New password"
          className="w-full px-4 py-3 border rounded-lg"
        />

        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm new password"
          className="w-full px-4 py-3 border rounded-lg"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 text-white bg-slate-900 rounded-xl"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>

      {/* Account info */}
      <div className="max-w-2xl p-6 bg-white border shadow-sm rounded-2xl">
        <h2 className="mb-4 text-xl font-semibold">Account Info</h2>
        <p className="text-sm text-slate-600">Role: {user?.role}</p>
        <p className="text-sm text-slate-600">User ID: {user?._id}</p>
      </div>
    </div>
  );
}