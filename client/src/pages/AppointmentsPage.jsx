import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [children, setChildren] = useState([]);
  const [parentStudentId, setParentStudentId] = useState('');
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    const params = {};
    if (user?.role === 'parent') {
      if (!parentStudentId) {
        setRows([]);
        return;
      }
      params.studentId = parentStudentId;
    }
    const r = await api.get('/appointments', { params });
    setRows(r.data);
  }, [user?.role, parentStudentId]);

  useEffect(() => {
    if (user?.role === 'student' || user?.role === 'parent') {
      api.get('/users/doctors').then((r) => setDoctors(r.data));
    }
    if (user?.role === 'parent') {
      api.get('/parent/children').then((r) => {
        setChildren(r.data);
        if (r.data[0]) setParentStudentId(r.data[0]._id);
      });
    } else {
      refresh();
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'parent' && parentStudentId) refresh();
    if (user?.role === 'student') refresh();
  }, [user?.role, parentStudentId, refresh]);

  async function book(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/appointments', {
        doctor: fd.get('doctorId'),
        scheduledAt: fd.get('when'),
        reason: fd.get('reason'),
        patientId: user?.role === 'parent' ? fd.get('patientId') : undefined,
      });
      setMsg('Booked');
      refresh();
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Appointments</h1>
      {msg && <p className="text-sm text-teal-800">{msg}</p>}

      {(user?.role === 'student' || user?.role === 'parent') && (
        <form onSubmit={book} className="bg-white border rounded-xl p-4 grid gap-2 max-w-md text-sm">
          {user?.role === 'parent' && (
            <select name="patientId" required className="border rounded-lg px-3 py-2">
              {children.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select name="doctorId" required className="border rounded-lg px-3 py-2">
            <option value="">Doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} — {d.specialization}
              </option>
            ))}
          </select>
          <input name="when" type="datetime-local" required className="border rounded-lg px-3 py-2" />
          <input name="reason" placeholder="Reason" className="border rounded-lg px-3 py-2" />
          <button type="submit" className="bg-teal-700 text-white rounded-lg py-2">
            Book
          </button>
        </form>
      )}

      {user?.role === 'parent' && children.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">View appointments for</span>
          <select
            className="border rounded-lg px-2 py-1"
            value={parentStudentId}
            onChange={(e) => setParentStudentId(e.target.value)}
          >
            {children.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul className="space-y-2 text-sm">
        {rows.map((a) => (
          <li key={a._id} className="bg-white border rounded-xl p-3 flex justify-between">
            <span>
              {new Date(a.scheduledAt).toLocaleString()} — {a.reason}
            </span>
            <span className="text-slate-500">
              {user?.role === 'doctor' ? a.patient?.name : a.doctor?.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
