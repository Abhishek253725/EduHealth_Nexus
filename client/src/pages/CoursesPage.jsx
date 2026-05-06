import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const url = user?.role === 'student' ? '/courses/discover' : '/courses';
    api.get(url).then((r) => setCourses(r.data)).catch(() => setCourses([]));
  }, [user?.role]);

  async function enroll(id) {
    try {
      await api.post(`/courses/${id}/enroll`);
      setMsg('Enrolled successfully');
      const r = await api.get('/courses');
      setCourses(r.data);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed');
    }
  }

  async function createCourse(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/courses', {
        title: fd.get('title'),
        description: fd.get('description'),
        subject: fd.get('subject'),
      });
      e.target.reset();
      setMsg('Course created');
      const r = await api.get('/courses');
      setCourses(r.data);
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Courses</h1>
      {msg && <p className="text-sm text-teal-800">{msg}</p>}

      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <form onSubmit={createCourse} className="bg-white border rounded-xl p-4 grid gap-3 sm:grid-cols-2 max-w-3xl">
          <input name="title" required placeholder="Title" className="border rounded-lg px-3 py-2 text-sm" />
          <input name="subject" placeholder="Subject" className="border rounded-lg px-3 py-2 text-sm" />
          <input
            name="description"
            placeholder="Description"
            className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
          />
          <button type="submit" className="bg-blue-700 text-white rounded-lg py-2 text-sm sm:col-span-2">
            Create course
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <div key={c._id} className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold">{c.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{c.subject}</p>
            <p className="text-sm text-slate-600 mt-2">{c.description}</p>
            <p className="text-xs text-slate-500 mt-2">Teacher: {c.teacher?.name || '—'}</p>
            {user?.role === 'student' && (
              <button
                type="button"
                onClick={() => enroll(c._id)}
                className="mt-3 text-sm text-teal-700 font-medium"
              >
                Enroll
              </button>
            )}
          </div>
        ))}
        {!courses.length && <p className="text-slate-500 text-sm">No courses to show.</p>}
      </div>
    </div>
  );
}
