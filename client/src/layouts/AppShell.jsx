import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  HelpCircle,
  CalendarCheck,
  HeartPulse,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  Stethoscope,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const themes = {
  admin: {
    sidebar: 'bg-slate-900',
    active: 'bg-teal-600/30 text-white',
    accent: 'text-teal-300',
  },
  doctor: {
    sidebar: 'bg-violet-950',
    active: 'bg-violet-600/40 text-white',
    accent: 'text-violet-200',
  },
  teacher: {
    sidebar: 'bg-blue-950',
    active: 'bg-blue-600/35 text-white',
    accent: 'text-blue-200',
  },
  parent: {
    sidebar: 'bg-emerald-950',
    active: 'bg-emerald-600/35 text-white',
    accent: 'text-emerald-200',
  },
  student: {
    sidebar: 'bg-teal-950',
    active: 'bg-teal-600/35 text-white',
    accent: 'text-teal-200',
  },
};

function navForRole(role) {
  const c = (to, icon, label) => ({ to, icon, label });

  if (role === 'admin') {
    return [
      c('/dashboard', LayoutDashboard, 'Dashboard'),
      c('/users', Users, 'Users'),
      c('/courses', BookOpen, 'Courses'),
      c('/appointments', CalendarCheck, 'Appointments'),
      c('/messages', MessageSquare, 'Messages'),
      c('/settings', Settings, 'Settings'),
    ];
  }

  if (role === 'doctor') {
    return [
      c('/dashboard', LayoutDashboard, 'Dashboard'),
      c('/appointments', CalendarCheck, 'Appointments'),
      c('/health-records', HeartPulse, 'Medical Records'),
      c('/messages', MessageSquare, 'Messages'),
      c('/settings', Settings, 'Settings'),
    ];
  }

  if (role === 'teacher') {
    return [
      c('/dashboard', LayoutDashboard, 'Dashboard'),
      c('/courses', BookOpen, 'My Courses'),
      c('/assignments', ClipboardList, 'Assignments'),
      c('/quizzes', HelpCircle, 'Quizzes'),
      c('/messages', MessageSquare, 'Messages'),
      c('/settings', Settings, 'Settings'),
    ];
  }

  if (role === 'parent') {
    return [
      c('/dashboard', LayoutDashboard, 'Dashboard'),
      c('/child-progress', BarChart3, 'Academic Progress'),
      c('/appointments', CalendarCheck, 'Appointments'),
      c('/messages', MessageSquare, 'Messages'),
      c('/settings', Settings, 'Settings'),
    ];
  }

  return [
    c('/dashboard', LayoutDashboard, 'Dashboard'),
    c('/courses', BookOpen, 'My Courses'),
    c('/assignments', ClipboardList, 'Assignments'),
    c('/quizzes', HelpCircle, 'Quizzes'),
    c('/appointments', CalendarCheck, 'Appointments'),
    c('/health-records', HeartPulse, 'Health Records'),
    c('/messages', MessageSquare, 'Messages'),
    c('/settings', Settings, 'Settings'),
  ];
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const theme = themes[user?.role] || themes.student;
  const nav = navForRole(user?.role);

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    loadNotifications();
  }

  async function readAll() {
    await api.patch('/notifications/read-all');
    loadNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`w-64 shrink-0 ${theme.sidebar} text-slate-100 flex flex-col`}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">EduHealth Nexus</p>
              <p className={`text-xs ${theme.accent}`}>Education + Care</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center justify-center rounded-full h-11 w-11 bg-white/15">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm">{user?.name}</p>
              <p className="text-xs capitalize text-slate-300">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive ? theme.active : 'hover:bg-white/10'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center w-full gap-3 px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <header className="relative flex items-center justify-between px-6 bg-white border-b h-14">
          <p className="text-sm text-slate-500">
            Signed in as {user?.email}
          </p>

          <div className="relative flex items-center gap-4">
            <button onClick={() => setOpen(!open)} className="relative">
              <Bell className="w-5 h-5 cursor-pointer" />

              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full px-1.5">
                  {unreadCount}
                </span>
              )}
            </button>

            <Shield className="w-5 h-5 opacity-40" />

            {open && (
              <div className="absolute right-0 z-50 bg-white border shadow-lg top-10 w-80 rounded-xl">
                <div className="flex justify-between p-3 border-b">
                  <p className="font-semibold">Notifications</p>
                  <button
                    onClick={readAll}
                    className="text-xs text-blue-600"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="overflow-auto max-h-96">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => markRead(n._id)}
                        className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${
                          !n.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-slate-500">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}