import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, User, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state && location.state.from) || '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, remember);
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-eli-navy">
      <div className="eli-card w-full max-w-md p-6 space-y-4">
        <h2 className="text-2xl font-bold text-eli-gold text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-eli-muted mb-1" htmlFor="email">
              <User className="inline w-4 h-4 mr-1" /> Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-eli-border/40 border border-eli-border rounded text-eli-text-white focus:outline-none focus:ring-2 focus:ring-eli-gold/50"
            />
          </div>
          <div>
            <label className="block text-eli-muted mb-1" htmlFor="password">
              <Lock className="inline w-4 h-4 mr-1" /> Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-eli-border/40 border border-eli-border rounded text-eli-text-white focus:outline-none focus:ring-2 focus:ring-eli-gold/50"
            />
          </div>
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-eli-gold bg-eli-border border-eli-border rounded focus:ring-eli-gold"
            />
            <label htmlFor="remember" className="ml-2 text-eli-muted text-sm">
              Remember me
            </label>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold py-2 rounded transition-colors shadow-lg shadow-eli-gold/20"
          >
            <ArrowRight className="w-4 h-4" /> Sign In
          </button>
        </form>
        <p className="text-center text-eli-muted text-sm">
          Don’t have an account?{' '}
          <a href="/signup" className="text-eli-gold hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
