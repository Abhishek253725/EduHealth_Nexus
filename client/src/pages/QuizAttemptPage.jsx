import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function QuizAttemptPage() {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  // LOAD QUIZ
  useEffect(() => {
    loadQuiz();
  }, []);

  async function loadQuiz() {
    const res = await api.get(`/quizzes/${id}`);
    setQuiz(res.data);
    setAnswers(new Array(res.data.questions.length).fill(null));
  }

  // TIMER
  useEffect(() => {
    if (score !== null) return;

    if (timeLeft <= 0) {
      submitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  function selectOption(qIndex, optionIndex) {
    const updated = [...answers];
    updated[qIndex] = optionIndex;
    setAnswers(updated);
  }

  async function submitQuiz() {
    if (score !== null) return;

    const res = await api.post(`/quizzes/${id}/attempt`, { answers });

    setScore(res.data.score);
    setMsg('Quiz submitted successfully');

    const resultArr = quiz.questions.map((q, i) => ({
      correct: q.correctIndex === answers[i],
      correctIndex: q.correctIndex,
    }));

    setResult(resultArr);
  }

  if (!quiz) return <p>Loading...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">{quiz.title}</h1>

      <p className="font-semibold text-red-600">
        ⏱ Time Left: {timeLeft}s
      </p>

      {quiz.questions.map((q, i) => (
        <div key={i} className="p-3 border rounded">
          <p className="font-medium">{q.text}</p>

          {q.options.map((opt, j) => (
            <label key={j} className="block">
              <input
                type="radio"
                name={`q-${i}`}
                checked={answers[i] === j}
                onChange={() => selectOption(i, j)}
                disabled={score !== null}
              />
              {opt}
            </label>
          ))}

          {score !== null && result[i] && (
            <p className={result[i].correct ? 'text-green-600' : 'text-red-600'}>
              {result[i].correct
                ? '✔ Correct'
                : `❌ Wrong (Correct: ${q.options[result[i].correctIndex]})`}
            </p>
          )}
        </div>
      ))}

      <button
        onClick={submitQuiz}
        disabled={score !== null}
        className="px-4 py-2 text-white bg-blue-600 rounded"
      >
        Submit
      </button>

      {score !== null && (
        <p className="font-bold text-green-700">
          🎯 Your Score: {score}%
        </p>
      )}

      {msg && <p>{msg}</p>}
    </div>
  );
}