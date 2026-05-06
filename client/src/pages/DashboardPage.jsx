import { useAuth } from '../context/AuthContext.jsx';
import StudentDashboard from './dashboards/StudentDashboard.jsx';
import TeacherDashboard from './dashboards/TeacherDashboard.jsx';
import ParentDashboard from './dashboards/ParentDashboard.jsx';
import DoctorDashboard from './dashboards/DoctorDashboard.jsx';
import AdminDashboard from './dashboards/AdminDashboard.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}