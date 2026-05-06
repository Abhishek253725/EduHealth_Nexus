import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function QuizzesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');
  const [qCount, setQCount] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const q = await api.get('/quizzes');
      setList(q.data);

      const c = await api.get('/courses');
      setCourses(c.data);
    } catch {
      setMsg('Failed to load data');
    }
  }

  async function createQuiz(e) {
    e.preventDefault();
    const fd = new FormData(e.target);

    const questions = [];

    for (let i = 1; i <= qCount; i++) {
      questions.push({
        text: fd.get(`q${i}`),
        options: [
          fd.get(`o${i}1`),
          fd.get(`o${i}2`),
          fd.get(`o${i}3`),
          fd.get(`o${i}4`),
        ],
        correctIndex: Number(fd.get(`correct${i}`)),
      });
    }

    try {
      await api.post('/quizzes', {
        course: fd.get('courseId'),
        title: fd.get('title'),
        questions,
      });

      setMsg('Quiz created');
      e.target.reset();
      setQCount(1);
      loadData();
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Quizzes</h1>
      {msg && <p>{msg}</p>}

      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <form onSubmit={createQuiz} className="p-4 space-y-2 border rounded">
          <select name="courseId" required className="w-full p-2 border">
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          <input
            name="title"
            placeholder="Quiz title"
            required
            className="w-full p-2 border"
          />

          <input
            type="number"
            min="1"
            value={qCount}
            onChange={(e) => setQCount(Number(e.target.value))}
            className="w-full p-2 border"
            placeholder="Number of questions"
          />

          {Array.from({ length: qCount }).map((_, i) => {
            const index = i + 1;

            return (
              <div key={index} className="p-2 border">
                <p>Question {index}</p>

                <input name={`q${index}`} required placeholder="Question" className="w-full p-1 border" />
                <input name={`o${index}1`} required placeholder="Option A" className="w-full p-1 border" />
                <input name={`o${index}2`} required placeholder="Option B" className="w-full p-1 border" />
                <input name={`o${index}3`} required placeholder="Option C" className="w-full p-1 border" />
                <input name={`o${index}4`} required placeholder="Option D" className="w-full p-1 border" />

                <select name={`correct${index}`} className="p-1 border">
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                  <option value="3">Option D</option>
                </select>
              </div>
            );
          })}

          <button className="px-4 py-2 text-white bg-blue-600 rounded">
            Create Quiz
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {list.map((q) => (
          <li key={q._id} className="flex justify-between p-3 border rounded">
            <div>
              <p>{q.title}</p>
              <p className="text-xs">{q.course?.title}</p>
            </div>

            {user?.role === 'student' && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/quiz/${q._id}`)}
                  className="text-green-600"
                >
                  Take Quiz
                </button>

                <button
                  onClick={() => navigate(`/leaderboard/${q._id}`)}
                  className="text-purple-600"
                >
                  Leaderboard
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}