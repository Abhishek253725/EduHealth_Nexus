import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function HealthRecordsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const params = {};
    if (user?.role === 'parent') {
      const id = new URLSearchParams(window.location.search).get('studentId');
      if (id) params.studentId = id;
    }
    api.get('/health-records', { params }).then((r) => setRows(r.data));
  }, [user]);

  async function addRecord(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/health-records', {
        patient: fd.get('patientId'),
        heartRate: Number(fd.get('hr')) || undefined,
        bloodPressure: fd.get('bp'),
        bloodGroup: fd.get('bg'),
        allergies: fd.get('al'),
        notes: fd.get('notes'),
      });
      setMsg('Saved');
      const r = await api.get('/health-records');
      setRows(r.data);
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Health records</h1>
      {msg && <p className="text-sm text-teal-800">{msg}</p>}

      {user?.role === 'doctor' && (
        <form onSubmit={addRecord} className="bg-white border rounded-xl p-4 grid gap-2 max-w-lg text-sm">
          <input name="patientId" required placeholder="Patient user ID" className="border rounded-lg px-3 py-2" />
          <input name="hr" type="number" placeholder="Heart rate" className="border rounded-lg px-3 py-2" />
          <input name="bp" placeholder="Blood pressure" className="border rounded-lg px-3 py-2" />
          <input name="bg" placeholder="Blood group" className="border rounded-lg px-3 py-2" />
          <input name="al" placeholder="Allergies" className="border rounded-lg px-3 py-2" />
          <textarea name="notes" placeholder="Notes" className="border rounded-lg px-3 py-2" rows={3} />
          <button type="submit" className="bg-violet-700 text-white rounded-lg py-2">
            Save record
          </button>
        </form>
      )}

      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r._id} className="bg-white border rounded-xl p-3">
            <p className="font-medium">{r.patient?.name}</p>
            <p className="text-slate-500">
              {new Date(r.visitDate).toLocaleDateString()} — HR {r.heartRate ?? '—'} | {r.bloodGroup || '—'}
            </p>
            <p className="text-slate-600 mt-1">{r.notes}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
