import { useState } from 'react';
import api from '../api/client.js';

export default function ChildProgressPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  async function link(e) {
    e.preventDefault();
    try {
      await api.post('/parent/link-child', { email });
      setMsg('Linked successfully. Return to dashboard.');
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-bold">Link your child</h1>
      <p className="text-sm text-slate-600">
        Enter the student&apos;s registered email. They must already have a student account.
      </p>
      <form onSubmit={link} className="bg-white border rounded-xl p-4 space-y-3">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="student@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <button type="submit" className="w-full bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium">
          Link child
        </button>
      </form>
      {msg && <p className="text-sm text-teal-800">{msg}</p>}
    </div>
  );
}
