import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import api from '../../api/client.js';

const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#64748b'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data));
  }, []);

  if (!stats) return <p className="text-slate-500">Loading…</p>;

  const roles = stats.roles || {};
  const pieData = ['student', 'teacher', 'parent', 'doctor', 'admin'].map((r) => ({
    name: r,
    value: roles[r] || 0,
  }));

  const growth = Array.from({ length: 12 }).map((_, i) => ({
    day: `D${i + 1}`,
    users: Math.round(50 + i * 8 + Math.random() * 10),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          ['Total users', stats.usersTotal, '/users', 'View all users'],
          ['Students', roles.student || 0, '/users', 'View students'],
          ['Teachers', roles.teacher || 0, '/users', 'View teachers'],
          ['Parents', roles.parent || 0, '/users', 'View parents'],
          ['Doctors', roles.doctor || 0, '/users', 'View doctors'],
          ['Courses', stats.courses, '/courses', 'View courses'],
        ].map(([label, val, to, link]) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-semibold mt-1">{val ?? 0}</p>
            <Link className="text-xs text-teal-700 font-medium mt-2 inline-block" to={to}>
              {link}
            </Link>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-xl border p-5 shadow-sm lg:col-span-1">
          <h2 className="font-semibold mb-2">User distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm lg:col-span-1">
          <h2 className="font-semibold mb-3">System overview</h2>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex justify-between">
              Appointments <span className="text-emerald-600">↑ {stats.appointments}</span>
            </li>
            <li className="flex justify-between">
              Assignments <span className="text-emerald-600">↑ {stats.assignments}</span>
            </li>
            <li className="flex justify-between">
              Quizzes <span className="text-emerald-600">↑ {stats.quizzes}</span>
            </li>
            <li className="flex justify-between">
              Notifications <span className="text-emerald-600">↑ {stats.notifications}</span>
            </li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm lg:col-span-1 h-72">
          <h2 className="font-semibold mb-2">User growth (sample)</h2>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={growth}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#0f766e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="font-semibold mb-3">Recent users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2">Name</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentUsers || []).map((u) => (
              <tr key={u._id} className="border-b border-slate-100">
                <td className="py-2">{u.name}</td>
                <td className="capitalize">{u.role}</td>
                <td className="text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
