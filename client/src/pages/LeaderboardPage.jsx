import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function LeaderboardPage() {
  const { id } = useParams();
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get(`/quizzes/leaderboard/${id}`)
      .then((res) => setData(res.data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Leaderboard</h1>

      {data.map((u, i) => (
        <p key={i} className="p-2 my-1 border rounded">
          {i + 1}. {u.name} - {u.score}%
        </p>
      ))}
    </div>
  );
}