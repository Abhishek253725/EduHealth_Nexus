import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users').then((r) => setUsers(r.data));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Users</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
