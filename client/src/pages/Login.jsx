import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Lock, Mail, Shield, Stethoscope, Users, Check } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { id: 'student', label: 'Student', icon: BookOpen, iconClass: 'text-blue-600' },
  { id: 'parent', label: 'Parents', icon: Users, iconClass: 'text-emerald-500' },
  { id: 'teacher', label: 'Teacher', icon: Users, iconClass: 'text-violet-600' },
  { id: 'admin', label: 'Admin', icon: Shield, iconClass: 'text-orange-500' },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, iconClass: 'text-pink-500' },
];

const DEMO_BY_ROLE = {
  student: 'student@eduhealth.test',
  teacher: 'teacher@eduhealth.test',
  parent: 'parent@eduhealth.test',
  doctor: 'doctor@eduhealth.test',
  admin: 'admin@eduhealth.test',
};

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState(DEMO_BY_ROLE.student);
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');

  function selectRole(id) {
    setRole(id);
    setEmail(DEMO_BY_ROLE[id] || '');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      nav('/dashboard', { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 relative overflow-hidden">
      <div className="absolute top-6 left-8 h-16 w-16 opacity-35 hidden md:grid grid-cols-4 gap-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
        ))}
      </div>
      <div className="absolute bottom-10 right-10 h-20 w-20 opacity-30 hidden md:grid grid-cols-4 gap-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
        ))}
      </div>

      <div className="w-full max-w-[620px] rounded-[28px] bg-white/95 shadow-2xl px-6 sm:px-10 py-8 sm:py-10">
        <h1 className="text-center text-[2.7rem] sm:text-6xl font-bold leading-none tracking-tight">
          <span className="text-blue-700">EduHealth</span>{' '}
          <span className="text-emerald-500">Exus</span>
        </h1>
        <p className="text-center text-slate-500 mt-3 text-sm sm:text-base">
          Welcome back! Please login to your account
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <p className="text-center font-semibold text-slate-700 mb-4">Login As</p>
            <div className="grid grid-cols-5 gap-2">
              {ROLES.map(({ id, label, icon: Icon, iconClass }) => {
                const active = role === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectRole(id)}
                    className={`relative rounded-xl border py-3 px-1 flex flex-col items-center gap-1.5 transition ${
                      active
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${iconClass}`} />
                    <span className="text-xs font-medium text-slate-700">{label}</span>
                    {active && (
                      <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {err && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{err}</div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              required
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Remember me
            </label>
            <button type="button" className="text-blue-700 hover:text-blue-800 font-medium">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-white text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 transition"
          >
            LOGIN
          </button>
        </form>

        <p className="text-center mt-7 text-slate-600 text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-700 font-semibold hover:text-blue-800">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
