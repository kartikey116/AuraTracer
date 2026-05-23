import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Play, 
  Pause, 
  ArrowDown, 
  Layers 
} from 'lucide-react';

export default function LiveLogs() {
  const { currentProject, API_BASE_URL } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleEndRef = useRef(null);

  const fetchLogs = async (silent = false) => {
    if (!currentProject) return;
    if (!silent) setLoading(true);

    try {
      let url = `${API_BASE_URL}/dashboard/logs?apiKey=${currentProject.apiKey}&limit=100`;
      if (filterLevel) url += `&level=${filterLevel}`;
      if (filterType) url += `&type=${filterType}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch on filters change
  useEffect(() => {
    fetchLogs();
  }, [currentProject, filterLevel, filterType, searchTerm]);

  // Polling fetch for live updates
  useEffect(() => {
    let intervalId = null;
    if (isPlaying && currentProject) {
      intervalId = setInterval(() => {
        fetchLogs(true);
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, currentProject, filterLevel, filterType, searchTerm]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearScreen = () => {
    setLogs([]);
  };

  const getLogColorClass = (type, level) => {
    if (level === 'fatal' || level === 'error' || type === 'error') {
      return 'text-red-400 font-bold';
    }
    if (level === 'warn') {
      return 'text-yellow-400';
    }
    switch (type) {
      case 'page_view':
        return 'text-emerald-400';
      case 'click':
        return 'text-cyan-400';
      case 'server_log':
        return 'text-zinc-300';
      case 'db_log':
        return 'text-purple-400';
      default:
        return 'text-zinc-400';
    }
  };

  const formatLogTimestamp = (dateStr) => {
    const d = new Date(dateStr);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Live Logs</h2>
          <p className="text-zinc-400 text-sm">
            Stream raw logs from enqueued client SDK interactions or servers
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-brand-dark border border-brand-border/60 rounded-xl shrink-0">
        
        {/* Play/Pause & Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
              isPlaying 
                ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Live: ON
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Live: PAUSED
              </>
            )}
          </button>

          <button
            onClick={clearScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-brand-border text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all"
            title="Clear Console"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoScroll
                ? 'bg-zinc-950 border-brand-accent/30 text-brand-accent'
                : 'bg-zinc-950 border-brand-border text-zinc-500'
            }`}
          >
            <ArrowDown className={`h-3.5 w-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
            Auto-Scroll
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          {/* Keyword Search */}
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Keyword filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-40 bg-zinc-950 border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-accent focus:w-56 transition-all duration-300"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-zinc-950 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-accent cursor-pointer"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="fatal">Fatal</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-950 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-accent cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="page_view">Page View</option>
            <option value="click">Click</option>
            <option value="error">Error</option>
            <option value="server_log">Server Log</option>
            <option value="db_log">DB Log</option>
          </select>
        </div>
      </div>

      {/* Terminal logs viewer */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border border-brand-border rounded-xl shadow-inner relative overflow-hidden">
        <div className="bg-brand-dark border-b border-brand-border px-4 py-2 shrink-0 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80"></span>
            <span className="ml-2 font-mono text-[9px] text-zinc-400">bash - telemetry@auratrace</span>
          </div>
          <span className="font-mono text-zinc-600">
            {logs.length} Lines Displayed
          </span>
        </div>

        {/* Inner console box */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 select-text">
          {loading ? (
            <div className="h-full flex items-center justify-center text-zinc-600 space-y-2 flex-col">
              <div className="h-6 w-6 border-2 border-zinc-700 border-t-zinc-500 rounded-full animate-spin"></div>
              <span>Connecting log stream...</span>
            </div>
          ) : logs.length > 0 ? (
            logs.slice().reverse().map((log) => (
              <div key={log._id} className="hover:bg-zinc-900 py-0.5 px-1 rounded flex items-start gap-3 transition-colors">
                <span className="text-zinc-600 shrink-0 select-none">
                  [{formatLogTimestamp(log.timestamp)}]
                </span>
                <span className={`uppercase text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 mt-0.5 select-none ${
                  log.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  log.type === 'page_view' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  log.type === 'click' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                  'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {log.type}
                </span>
                <span className={`break-all ${getLogColorClass(log.type, log.level)}`}>
                  {log.message}
                </span>
                {log.path && (
                  <span className="text-[10px] text-zinc-600 italic truncate shrink-0 ml-auto select-none">
                    path: {log.path}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 italic select-none">
              Console idle. No telemetry logs enqueued.
            </div>
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
}
