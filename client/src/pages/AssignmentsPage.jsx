import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AssignmentsPage() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const a = await api.get('/assignments');
      setList(a.data);

      const c = await api.get('/courses');
      setCourses(c.data);
    } catch {
      setMsg('Failed to load');
    }
  }

  async function createAssignment(e) {
    e.preventDefault();
    const fd = new FormData(e.target);

    try {
      let fileUrl = '';

      const file = fd.get('file');

      // upload file first
      if (file && file.size > 0) {
        setUploading(true);

        const uploadData = new FormData();
        uploadData.append('file', file);

        const uploadRes = await api.post('/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        fileUrl = uploadRes.data.url;
        setUploading(false);
      }

      await api.post('/assignments', {
        course: fd.get('courseId'),
        title: fd.get('title'),
        description: fd.get('description'),
        dueDate: fd.get('dueDate'),
        fileUrl,
      });

      setMsg('Assignment created successfully');
      e.target.reset();
      loadData();
    } catch (ex) {
      setUploading(false);
      setMsg(ex.response?.data?.message || 'Failed');
    }
  }

  async function submit(id) {
    try {
      await api.post(`/assignments/${id}/submit`, {
        text: 'Submitted from student dashboard',
      });

      setMsg('Assignment submitted');
      loadData();
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Assignments</h1>

      {msg && <p className="text-sm text-teal-700">{msg}</p>}

      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <form
          onSubmit={createAssignment}
          className="grid max-w-xl gap-3 p-4 bg-white border rounded-xl"
        >
          <select name="courseId" required className="p-2 border rounded">
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          <input
            name="title"
            placeholder="Assignment title"
            required
            className="p-2 border rounded"
          />

          <input
            name="description"
            placeholder="Description"
            className="p-2 border rounded"
          />

          <input
            name="dueDate"
            type="datetime-local"
            required
            className="p-2 border rounded"
          />

          {/* ✅ upload assignment file */}
          <input type="file" name="file" className="p-2 border rounded" />

          <button
            type="submit"
            className="py-2 text-white bg-blue-700 rounded"
          >
            {uploading ? 'Uploading...' : 'Create Assignment'}
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {list.map((a) => (
          <li
            key={a._id}
            className="flex justify-between p-4 bg-white border rounded-xl"
          >
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-slate-500">{a.course?.title}</p>
              <p className="text-xs text-slate-500">
                Due {new Date(a.dueDate).toLocaleString()}
              </p>

              {/* ✅ student can download/view */}
              {a.fileUrl && (
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 underline"
                >
                  Download Assignment
                </a>
              )}
            </div>

            {user?.role === 'student' && (
              <button
                onClick={() => submit(a._id)}
                className="font-medium text-teal-700"
              >
                Submit
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}