import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import api from '../../api/client.js';

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#94a3b8'];

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [pie, setPie] = useState([
    { name: 'General', value: 40 },
    { name: 'Fever & cold', value: 25 },
    { name: 'Consultation', value: 20 },
    { name: 'Others', value: 15 },
  ]);

  useEffect(() => {
    api.get('/dashboard/me').then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-violet-700">Doctor Dashboard</span>
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Today's appointments", data.stats?.todayCount, '/appointments', 'View today'],
          ['Total patients', data.stats?.totalPatients, '/health-records', 'View all patients'],
          ['Upcoming (scheduled)', data.stats?.upcoming, '/appointments', 'View schedule'],
        ].map(([t, v, to, l]) => (
          <div key={t} className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm text-slate-500">{t}</p>
            <p className="text-2xl font-semibold mt-1">{v ?? 0}</p>
            <Link className="text-sm text-violet-700 font-medium mt-2 inline-block" to={to}>
              {l}
            </Link>
          </div>
        ))}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending reports</p>
          <p className="text-2xl font-semibold mt-1">—</p>
          <Link className="text-sm text-violet-700 font-medium mt-2 inline-block" to="/health-records">
            View reports
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Today&apos;s appointments</h2>
          <ul className="space-y-3 text-sm">
            {(data.todayAppointments || []).map((a) => (
              <li key={a._id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{a.patient?.name}</p>
                  <p className="text-slate-500">{a.reason || 'Visit'}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-600">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      a.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </li>
            ))}
            {!data.todayAppointments?.length && <li className="text-slate-500">No appointments today.</li>}
          </ul>
          <Link to="/appointments" className="mt-4 inline-block text-sm font-medium text-violet-700">
            View all appointments
          </Link>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm h-96">
          <h2 className="font-semibold mb-2">Patient overview</h2>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                {pie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Recent patients</h2>
          <ul className="text-sm space-y-2">
            {(data.recentPatients || []).map((rp, i) => (
              <li key={i} className="flex justify-between">
                <span>{rp.patient?.name}</span>
                <span className="text-slate-500">{new Date(rp.visitDate).toLocaleDateString()}</span>
              </li>
            ))}
            {!data.recentPatients?.length && <li className="text-slate-500">No records yet.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Health reminders</h2>
          <ul className="text-sm space-y-3 text-slate-600">
            <li>Hydration: encourage water intake during exams.</li>
            <li>Sleep: 7–8 hours supports recovery and focus.</li>
            <li>Screen time: suggest breaks every 45 minutes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
