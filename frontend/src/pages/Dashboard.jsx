import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AnalyticsChart from '../components/AnalyticsChart';
import { 
  Activity, 
  AlertOctagon, 
  Users, 
  Percent, 
  Calendar, 
  Copy, 
  Check, 
  Code,
  ArrowRight,
  Shield,
  Eye,
  Zap,
  HelpCircle,
  Lock,
  Layers
} from 'lucide-react';

export default function Dashboard() {
  const { currentProject, API_BASE_URL } = useAuth();
  const [timeframe, setTimeframe] = useState('24h');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveMode, setLiveMode] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [countdown, setCountdown] = useState(5);

  const fetchStats = async (silent = false) => {
    if (!currentProject) return;
    if (!silent) setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/stats?apiKey=${currentProject.apiKey}&timeframe=${timeframe}`,
        {
          credentials: 'include'
        }
      );
      const json = await response.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Regular fetch on project/timeframe change
  useEffect(() => {
    fetchStats(false);
  }, [currentProject, timeframe]);

  // Live polling effect
  useEffect(() => {
    if (!liveMode || !currentProject) return;

    setCountdown(refreshInterval / 1000);

    const intervalId = setInterval(() => {
      fetchStats(true);
      setCountdown(refreshInterval / 1000);
    }, refreshInterval);

    // Countdown visual interval
    const countdownId = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : refreshInterval / 1000));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [liveMode, currentProject, refreshInterval, timeframe]);

  const statCards = [
    {
      name: 'Total Requests',
      value: stats?.summary?.totalLogs ?? 0,
      icon: Activity,
      color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20'
    },
    {
      name: 'Total Errors',
      value: stats?.summary?.totalErrors ?? 0,
      icon: AlertOctagon,
      color: 'text-brand-red bg-brand-red/10 border-brand-red/20'
    },
    {
      name: 'Error Rate',
      value: stats?.summary?.errorRate !== undefined ? `${stats.summary.errorRate}%` : '0%',
      icon: Percent,
      color: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20'
    },
    {
      name: 'Active Sessions',
      value: stats?.summary?.activeSessions ?? 0,
      icon: Users,
      color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            Analytics Overview
            {liveMode && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Live ({countdown}s)
              </span>
            )}
          </h2>
          <p className="text-zinc-400 text-sm">
            Monitor real-time logs and error trends for{' '}
            <span className="font-semibold text-zinc-300">{currentProject?.name}</span>
          </p>
        </div>

        {/* Controls: Live toggle & Timeframe */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live mode toggle */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-brand-border px-3 py-1.5 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-400">
              <input
                type="checkbox"
                checked={liveMode}
                onChange={(e) => setLiveMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-accent peer-checked:after:bg-white"></div>
              <span>Live Updates</span>
            </label>
            {liveMode && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-zinc-950 border border-brand-border rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none font-bold text-[10px] cursor-pointer"
              >
                <option value="3000">3s</option>
                <option value="5000">5s</option>
                <option value="10000">10s</option>
                <option value="30000">30s</option>
              </select>
            )}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-brand-border p-1 rounded-lg">
            {['24h', '7d', '30d'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  timeframe === t
                    ? 'bg-brand-accent text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card p-6 flex items-center justify-between border-brand-border/40 hover:border-zinc-800">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                {card.name}
              </span>
              <p className="text-2xl font-bold font-sans">
                {loading ? (
                  <span className="inline-block h-6 w-16 bg-zinc-800 animate-pulse rounded"></span>
                ) : (
                  card.value
                )}
              </p>
            </div>
            <div className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="glass-card p-6 border-brand-border/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg">Event & Error Trends</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Ingested requests parsed over time</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
              Logs
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-brand-red"></span>
              Errors
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center bg-zinc-900 bg-opacity-20 border border-brand-border/50 border-dashed rounded-lg">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-zinc-500 text-xs font-semibold">Loading graph statistics...</p>
            </div>
          </div>
        ) : (
          <AnalyticsChart data={stats?.chart || []} />
        )}
      </div>
    </div>
  );
}
