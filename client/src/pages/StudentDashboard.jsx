import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Student Dashboard</h1>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => navigate('/quizzes')}
          className="px-4 py-2 text-white bg-green-600 rounded"
        >
          📝 Go to Quizzes
        </button>

        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 text-white bg-blue-600 rounded"
        >
          📊 Result History
        </button>
      </div>
    </div>
  );
}