import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

function StatCard({ title, value, hint, to, linkLabel }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {to && (
        <Link className="text-sm text-teal-700 font-medium mt-3 inline-block" to={to}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/me').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return <p className="text-slate-500">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-7 w-7 text-teal-700" />
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Enrolled courses"
          value={data.stats?.enrolledCourses ?? 0}
          to="/courses"
          linkLabel="View all courses"
        />
        <StatCard
          title="Assignments due"
          value={data.stats?.assignmentsDue ?? 0}
          to="/assignments"
          linkLabel="View assignments"
        />
        <StatCard
          title="Quizzes upcoming"
          value={data.stats?.quizUpcoming ?? 0}
          to="/quizzes"
          linkLabel="View quizzes"
        />
        <StatCard
          title="Average score"
          value={`${data.stats?.averageScore ?? 0}%`}
          hint="Across graded work"
          to="/courses"
          linkLabel="View progress"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">My courses</h2>
          <div className="space-y-4">
            {(data.courses || []).map((c) => {
              const sid = user?._id;
              const en = c.enrollments?.find((e) => String(e.student?._id || e.student) === String(sid));
              const pct = en?.progress ?? 0;
              return (
                <div key={c._id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-slate-500">{pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500">Prof. {c.teacher?.name || '—'}</p>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!data.courses?.length && <p className="text-sm text-slate-500">No enrollments yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Health overview
          </h2>
          {data.health ? (
            <ul className="text-sm space-y-2 text-slate-600">
              <li>Latest visit: {new Date(data.health.visitDate || data.health.createdAt).toLocaleDateString()}</li>
              <li>Heart rate: {data.health.heartRate ?? '—'} bpm</li>
              <li>Blood group: {data.health.bloodGroup || '—'}</li>
              <li>Allergies: {data.health.allergies || 'None'}</li>
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No health records yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-1">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Upcoming deadlines
          </h2>
          <ul className="text-sm space-y-2">
            {(data.deadlines || []).map((a) => (
              <li key={a._id} className="flex justify-between gap-2">
                <span>{a.title}</span>
                <span className="text-slate-500 whitespace-nowrap">
                  {new Date(a.dueDate).toLocaleDateString()}
                </span>
              </li>
            ))}
            {!data.deadlines?.length && <li className="text-slate-500">No pending deadlines.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-1">
          <h2 className="font-semibold mb-3">Recent announcements</h2>
          <ul className="text-sm space-y-2 text-slate-600">
            {(data.announcements || []).map((n) => (
              <li key={n._id}>
                <span className="font-medium text-slate-800">{n.title}</span>
                <span className="text-slate-400 text-xs block">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
            {!data.announcements?.length && <li className="text-slate-500">No announcements.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-1">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Next appointment
          </h2>
          {data.nextAppointment ? (
            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-medium text-slate-900">{data.nextAppointment.reason || 'Visit'}</p>
              <p>Dr. {data.nextAppointment.doctor?.name}</p>
              <p>{new Date(data.nextAppointment.scheduledAt).toLocaleString()}</p>
              <Link className="text-teal-700 font-medium text-sm" to="/appointments">
                View all appointments
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No upcoming visits.</p>
          )}
        </div>
      </div>
    </div>
  );
}
