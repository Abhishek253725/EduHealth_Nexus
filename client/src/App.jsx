import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './layouts/AppShell.jsx';

// AUTH
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// MAIN PAGES
import DashboardPage from './pages/DashboardPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import QuizzesPage from './pages/QuizzesPage.jsx';
import QuizAttemptPage from './pages/QuizAttemptPage.jsx';

// EXTRA FEATURES
import ResultHistoryPage from './pages/ResultHistoryPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';

// OTHER MODULES
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import HealthRecordsPage from './pages/HealthRecordsPage.jsx';
import ChildProgressPage from './pages/ChildProgressPage.jsx';
import UsersAdminPage from './pages/UsersAdminPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

// =======================
// HOME REDIRECT
// =======================
function HomeRedirect() {
  const { token, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (token) return <Navigate to="/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

// =======================
// APP ROUTES
// =======================
export default function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED ROUTES */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* MAIN */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />

        {/* QUIZ SYSTEM */}
        <Route path="/quiz/:id" element={<QuizAttemptPage />} />
        <Route path="/history" element={<ResultHistoryPage />} />
        <Route path="/leaderboard/:id" element={<LeaderboardPage />} />

        {/* OTHER */}
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/health" element={<HealthRecordsPage />} />
        <Route path="/health-records" element={<HealthRecordsPage />} />
        <Route path="/child-progress" element={<ChildProgressPage />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersAdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}