import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'admin' }
];

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    grade: '',
    classSection: '',
    specialization: '',
  });
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        grade: form.grade,
        classSection: form.classSection,
        specialization: form.specialization,
      };
      const { data } = await api.post('/auth/register', payload);
      login(data.token, data.user);
      nav('/dashboard', { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-slate-500 text-sm mt-1">Join EduHealth Nexus</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {form.role === 'student' && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700">Grade</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Section</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.classSection}
                  onChange={(e) => setForm({ ...form, classSection: e.target.value })}
                />
              </div>
            </>
          )}
          {form.role === 'doctor' && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Specialization</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-teal-700 text-white font-medium hover:bg-teal-800"
            >
              Register
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="text-teal-700 font-medium" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
