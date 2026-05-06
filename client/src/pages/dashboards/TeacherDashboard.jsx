import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client.js';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/me').then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="text-slate-500">Loading…</p>;

  const chartData = (data.courses || []).map((c) => {
    const en = c.enrollments || [];
    let sum = 0;
    let n = 0;
    en.forEach((e) => {
      if (e.averageScore != null) {
        sum += e.averageScore;
        n += 1;
      }
    });
    const avg = n ? Math.round(sum / n) : 0;
    return { name: (c.subject || c.title).slice(0, 12), avg };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total courses', data.stats?.courses, '/courses', 'View all'],
          ['Total students', data.stats?.students, '/courses', 'View students'],
          ['Assignments', data.stats?.assignments, '/assignments', 'View all'],
          ['Avg. class performance', `${chartData.length ? Math.round(chartData.reduce((a, b) => a + b.avg, 0) / chartData.length) : 0}%`, '/dashboard', 'View analytics'],
        ].map(([label, val, to, link]) => (
          <div key={label} className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold mt-1">{val ?? 0}</p>
            <Link className="text-sm text-blue-700 font-medium mt-2 inline-block" to={to}>
              {link}
            </Link>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-4">My courses</h2>
          <ul className="space-y-3">
            {(data.courses || []).map((c) => (
              <li key={c._id} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-slate-500">{c.enrollments?.length || 0} students</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Active</span>
              </li>
            ))}
            {!data.courses?.length && <p className="text-slate-500">No courses yet.</p>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm h-80">
          <h2 className="font-semibold mb-4">Student performance overview</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData.length ? chartData : [{ name: '—', avg: 0 }]}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avg" fill="#2563eb" radius={[4, 4, 0, 0]} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Recent assignments</h2>
          <ul className="text-sm space-y-2">
            {(data.recentAssignments || []).slice(0, 5).map((a) => (
              <li key={a._id} className="flex justify-between gap-2">
                <span>{a.title}</span>
                <span className="text-slate-500">{new Date(a.dueDate).toLocaleDateString()}</span>
              </li>
            ))}
            {!data.recentAssignments?.length && <li className="text-slate-500">No assignments.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Recent announcements</h2>
          <ul className="text-sm space-y-2 text-slate-600">
            {(data.announcements || []).map((n) => (
              <li key={n._id}>
                <span className="font-medium text-slate-800">{n.title}</span>
                <span className="text-xs text-slate-400 block">{new Date(n.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {!data.announcements?.length && <li className="text-slate-500">No announcements.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
