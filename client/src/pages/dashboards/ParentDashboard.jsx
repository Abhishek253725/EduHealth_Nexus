import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(null);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get('/parent/children').then((r) => {
      setChildren(r.data);
      if (r.data[0]) setSelected(r.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) {
      setProgress(null);
      return;
    }
    Promise.all([
      api.get(`/parent/student-progress/${selected}`),
      api.get(`/parent/notifications/${selected}`),
    ]).then(([p, n]) => {
      setProgress(p.data);
      setNotifs(n.data.slice(0, 6));
    });
  }, [selected]);

  const child = children.find((c) => c._id === selected);
  const scores = progress?.stats?.subjectScores || {};
  const fb = progress?.recentFeedback?.[0];

  const overall =
    progress?.stats?.averageScore != null
      ? progress.stats.averageScore >= 85
        ? 'A'
        : progress.stats.averageScore >= 70
          ? 'B'
          : 'C'
      : '—';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Parent Dashboard</h1>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm text-slate-600">My child</label>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          value={selected || ''}
          onChange={(e) => setSelected(e.target.value || null)}
        >
          <option value="">Select child</option>
          {children.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} — Class {c.grade || '?'}
              {c.classSection ? ` - ${c.classSection}` : ''}
            </option>
          ))}
        </select>
        <Link to="/child-progress" className="text-sm text-emerald-800 font-medium">
          Link another child
        </Link>
      </div>

      {!selected && (
        <p className="text-slate-500 text-sm">
          Link a student from <Link className="underline" to="/child-progress">Academic Progress</Link> using their
          email.
        </p>
      )}

      {selected && progress && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <p className="text-sm text-slate-500">Overall performance</p>
              <p className="text-3xl font-bold text-emerald-800">{overall}</p>
              <p className="text-xs text-slate-500 mt-1">Based on scores</p>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <p className="text-sm text-slate-500">Attendance</p>
              <p className="text-3xl font-bold">{progress.stats.attendancePct ?? '—'}%</p>
              <p className="text-xs text-slate-500 mt-1">Recorded sessions</p>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <p className="text-sm text-slate-500">Assignments completed</p>
              <p className="text-3xl font-bold">{progress.stats.assignmentCompletion ?? 0}%</p>
              <p className="text-xs text-slate-500 mt-1">This period</p>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <p className="text-sm text-slate-500">Average score</p>
              <p className="text-3xl font-bold">{progress.stats.averageScore ?? 0}%</p>
              <p className="text-xs text-slate-500 mt-1">Assignments & quizzes</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <h2 className="font-semibold mb-4">Subject-wise performance</h2>
              <div className="space-y-3">
                {Object.entries(scores).map(([sub, pct]) => (
                  <div key={sub}>
                    <div className="flex justify-between text-sm">
                      <span>{sub}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 mt-1">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                {!Object.keys(scores).length && <p className="text-slate-500 text-sm">No graded work yet.</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <h2 className="font-semibold mb-3">Recent teacher feedback</h2>
              {fb ? (
                <blockquote className="text-slate-700 text-sm border-l-4 border-emerald-600 pl-4 italic">
                  “{fb.message}”
                  <footer className="mt-3 not-italic text-xs text-slate-500">
                    — {fb.teacher?.name}, {new Date(fb.createdAt).toLocaleDateString()}
                  </footer>
                </blockquote>
              ) : (
                <p className="text-sm text-slate-500">No feedback yet.</p>
              )}
              <Link className="text-sm text-emerald-800 font-medium mt-4 inline-block" to="/child-progress">
                View all feedback
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <h2 className="font-semibold mb-3">Recent notifications (student)</h2>
              <ul className="text-sm space-y-2">
                {notifs.map((n) => (
                  <li key={n._id} className="flex justify-between gap-2">
                    <span>{n.title}</span>
                    <span className="text-slate-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {!notifs.length && <li className="text-slate-500">No notifications.</li>}
              </ul>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <h2 className="font-semibold mb-3">Child profile</h2>
              <p className="text-sm text-slate-600">
                {child?.name} · Grade {child?.grade} {child?.classSection}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
