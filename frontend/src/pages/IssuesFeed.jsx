import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  Clock, 
  Hash, 
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export default function IssuesFeed() {
  const { currentProject, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [statusTab, setStatusTab] = useState('unresolved');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIssues = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/issues?apiKey=${currentProject.apiKey}&status=${statusTab}&sortBy=${sortBy}`,
        {
          credentials: 'include'
        }
      );
      const json = await response.json();
      if (json.success) {
        setIssues(json.data);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [currentProject, statusTab, sortBy]);

  const filteredIssues = issues.filter(issue => 
    issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (issue.path && issue.path.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Smart Issues Feed</h2>
        <p className="text-zinc-400 text-sm">
          Aggregated and deduplicated application errors
        </p>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-dark p-4 rounded-xl border border-brand-border/60">
        {/* Status Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-brand-border">
          {['unresolved', 'resolved', 'ignored'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusTab === tab
                  ? 'bg-brand-accent text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-brand-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-accent w-48 focus:w-60 transition-all duration-300"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-brand-border px-3 py-1.5 rounded-lg text-xs">
            <span className="text-zinc-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-zinc-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="lastSeen">Last Seen</option>
              <option value="count">Frequency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-5 animate-pulse border-brand-border/40">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1 mr-4">
                  <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                  <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-zinc-800 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredIssues.length > 0 ? (
        <div className="space-y-3">
          {filteredIssues.map((issue) => (
            <div
              key={issue._id}
              onClick={() => navigate(`/issues/${issue._id}`)}
              className="glass-card p-5 border-brand-border/40 hover:border-zinc-700 hover:shadow-indigo-500/5 hover:-translate-y-0.5 cursor-pointer flex items-center justify-between gap-4 transition-all duration-200"
            >
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-unresolved bg-red-500/5 text-red-500 border-red-500/10 font-mono text-[10px]">
                    MD5:{issue.hash.substring(0, 8)}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium truncate">
                    {issue.path || 'Global Scope'}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-100 text-sm truncate font-mono">
                  {issue.message}
                </h4>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-600" />
                    Last seen: {formatDate(issue.lastSeen)}
                  </span>
                </div>
              </div>

              {/* Stats badges & Arrow */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex gap-4 text-center">
                  <div className="px-3 py-1.5 bg-zinc-950 border border-brand-border/60 rounded-lg min-w-16">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                      Events
                    </span>
                    <span className="text-sm font-extrabold text-zinc-200 font-sans block">
                      {issue.count}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center border-dashed border-2 border-brand-border/60">
          <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-lg mb-1">Zero issues found</h3>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            {searchTerm 
              ? 'No issues match your current search parameters.' 
              : `Awesome! There are no ${statusTab} issues logged for this project.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
