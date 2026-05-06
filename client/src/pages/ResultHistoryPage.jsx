import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ResultHistoryPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/quizzes/history').then((res) => setData(res.data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Result History</h1>

      {data.map((d, i) => (
        <div key={i} className="p-3 my-2 border rounded">
          <p className="font-medium">{d.title}</p>
          <p>Score: {d.score}%</p>
          <p>{new Date(d.date).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}