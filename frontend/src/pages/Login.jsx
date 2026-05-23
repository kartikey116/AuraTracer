import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Layers, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-brand-darkest text-zinc-100 flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-brand-darkest to-brand-darkest pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-accent to-brand-purple items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Welcome Back
          </h2>
          <p className="text-zinc-500 text-sm mt-2">Log in to manage your project telemetry</p>
        </div>

        <div className="glass-card p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2 mb-5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-2.5 rounded-lg text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-accent hover:text-brand-accent/80 font-medium transition-colors">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
