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
  const [timeframe, setTimeframe] = useState('24h');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [selectedBrowsers, setSelectedBrowsers] = useState([]);
  const [selectedOs, setSelectedOs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleEndRef = useRef(null);

  const fetchLogs = async (silent = false) => {
    if (!currentProject) return;
    if (!silent) setLoading(true);

    try {
      let url = `${API_BASE_URL}/dashboard/logs?apiKey=${currentProject.apiKey}&limit=100`;
      
      if (timeframe) url += `&timeframe=${timeframe}`;
      if (customDates.start) url += `&startDate=${customDates.start}`;
      if (customDates.end) url += `&endDate=${customDates.end}`;
      if (filterLevel) url += `&level=${filterLevel}`;
      if (filterType) url += `&type=${filterType}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedBrowsers.length > 0) {
        url += `&browsers=${encodeURIComponent(selectedBrowsers.join(','))}`;
      }
      if (selectedOs.length > 0) {
        url += `&osList=${encodeURIComponent(selectedOs.join(','))}`;
      }

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
  }, [currentProject, filterLevel, filterType, searchTerm, timeframe, customDates, selectedBrowsers, selectedOs]);

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
  }, [isPlaying, currentProject, filterLevel, filterType, searchTerm, timeframe, customDates, selectedBrowsers, selectedOs]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearScreen = () => {
    setLogs([]);
  };

  const handleCheckboxChange = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const clearFilters = () => {
    setSelectedBrowsers([]);
    setSelectedOs([]);
    setCustomDates({ start: '', end: '' });
    setTimeframe('24h');
    setFilterLevel('');
    setFilterType('');
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

      {/* Main content grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Left Side: Controls & Terminal */}
        <div className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
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

            {/* Keyword Search */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Keyword filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-accent transition-all duration-300"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
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

        {/* Right Side: Sidebar */}
        <div className="lg:col-span-1 glass-card p-5 border-brand-border/40 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-cyan" />
              Filter Stream
            </h3>
            {(timeframe !== '24h' || selectedBrowsers.length > 0 || selectedOs.length > 0 || customDates.start || customDates.end || filterLevel !== '' || filterType !== '') && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-zinc-500 hover:text-brand-cyan font-bold uppercase tracking-wider transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => {
                setTimeframe(e.target.value);
                setCustomDates({ start: '', end: '' }); // Reset custom dates
              }}
              className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-cyan cursor-pointer"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {timeframe === '' && (
            <div className="grid grid-cols-2 gap-2 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-semibold block">Start</span>
                <input
                  type="date"
                  value={customDates.start}
                  onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-zinc-950 border border-brand-border rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-brand-cyan"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-semibold block">End</span>
                <input
                  type="date"
                  value={customDates.end}
                  onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-zinc-950 border border-brand-border rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-brand-cyan"
                />
              </div>
            </div>
          )}

          {/* Level Filter */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              Log Level
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-cyan cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              Log Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-cyan cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="page_view">Page View</option>
              <option value="click">Click</option>
              <option value="error">Error</option>
              <option value="server_log">Server Log</option>
              <option value="db_log">DB Log</option>
            </select>
          </div>

          {/* Browser Filter */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              Browsers / Clients
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {['Chrome', 'Safari', 'Firefox', 'IE', 'MobileApp', 'Backend'].map((browser) => (
                <label key={browser} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={selectedBrowsers.includes(browser)}
                    onChange={() => handleCheckboxChange(browser, selectedBrowsers, setSelectedBrowsers)}
                    className="rounded border-zinc-700 bg-zinc-950 text-brand-cyan focus:ring-brand-cyan/50 h-3.5 w-3.5"
                  />
                  <span>{browser}</span>
                </label>
              ))}
            </div>
          </div>

          {/* OS Filter */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              Operating System
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {['Windows', 'MacOS', 'Linux', 'Android', 'iOS', 'Server'].map((os) => (
                <label key={os} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={selectedOs.includes(os)}
                    onChange={() => handleCheckboxChange(os, selectedOs, setSelectedOs)}
                    className="rounded border-zinc-700 bg-zinc-950 text-brand-cyan focus:ring-brand-cyan/50 h-3.5 w-3.5"
                  />
                  <span>{os}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
