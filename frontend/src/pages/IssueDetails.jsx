import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Activity,
  Globe,
  Monitor,
  Compass,
  CornerDownRight
} from 'lucide-react';

export default function IssueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_BASE_URL } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedStack, setCopiedStack] = useState(false);

  const fetchIssueDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/issues/${id}`, {
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching issue details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/issues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        // Refresh details
        await fetchIssueDetails();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyStackToClipboard = () => {
    if (!data?.issue?.stack) return;
    navigator.clipboard.writeText(data.issue.stack);
    setCopiedStack(true);
    setTimeout(() => setCopiedStack(false), 2000);
  };

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

  // Helper to convert metadata Map objects to sorted arrays with percentages
  const getDistributionArray = (metadataMap) => {
    if (!metadataMap) return [];
    const entries = Object.entries(metadataMap);
    const total = entries.reduce((acc, [_, count]) => acc + count, 0);
    if (total === 0) return [];
    
    return entries
      .map(([name, count]) => ({
        name: name.replace(/_/g, '.'),
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-500 text-sm font-semibold">Resolving issue traces...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.issue) {
    return (
      <div className="glass-card p-8 text-center max-w-md mx-auto">
        <h3 className="font-bold text-lg text-red-400 mb-2">Issue Not Found</h3>
        <p className="text-zinc-400 text-sm mb-4">The requested error timeline could not be resolved.</p>
        <button onClick={() => navigate('/issues')} className="text-brand-accent font-semibold text-sm flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Feed
        </button>
      </div>
    );
  }

  const { issue, occurrences, breadcrumbs } = data;

  const browserDist = getDistributionArray(issue.metadata?.browsers);
  const osDist = getDistributionArray(issue.metadata?.os);
  const urlDist = getDistributionArray(issue.metadata?.urls);

  return (
    <div className="space-y-6">
      {/* Header breadcrumb bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/issues')}
          className="p-2 rounded-lg bg-zinc-900 border border-brand-border text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          Back to Feed
        </span>
      </div>

      {/* Main Issue Title & Status Actions */}
      <div className="glass-card p-6 border-brand-border/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
              issue.status === 'unresolved' ? 'badge-unresolved' :
              issue.status === 'resolved' ? 'badge-resolved' : 'badge-ignored'
            }`}>
              {issue.status}
            </span>
            <span className="font-mono text-xs text-zinc-500">Hash: {issue.hash}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-zinc-100 break-words">
            {issue.message}
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Triggered at <span className="text-zinc-300 font-semibold">{issue.path || 'Global Scope'}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {issue.status === 'unresolved' ? (
            <>
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('resolved')}
                className="bg-brand-green hover:bg-brand-green/90 text-zinc-950 font-semibold px-4 py-2 rounded-lg text-xs tracking-wide uppercase transition-colors"
              >
                Resolve
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('ignored')}
                className="bg-zinc-900 border border-brand-border hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 font-semibold px-4 py-2 rounded-lg text-xs tracking-wide uppercase transition-colors"
              >
                Ignore
              </button>
            </>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => handleUpdateStatus('unresolved')}
              className="bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold px-4 py-2 rounded-lg text-xs tracking-wide uppercase transition-colors"
            >
              Reopen Issue
            </button>
          )}
        </div>
      </div>

      {/* Grid: Details, Environments & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Stats & Stack Trace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Frequencies cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 border-brand-border/40 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Occurrences</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{issue.count}</span>
            </div>
            <div className="glass-card p-4 border-brand-border/40 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">First Seen</span>
              <span className="text-xs font-bold text-zinc-300 mt-2.5 block truncate">{formatDate(issue.firstSeen)}</span>
            </div>
            <div className="glass-card p-4 border-brand-border/40 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Last Seen</span>
              <span className="text-xs font-bold text-zinc-300 mt-2.5 block truncate">{formatDate(issue.lastSeen)}</span>
            </div>
          </div>

          {/* Stack trace */}
          <div className="glass-card p-6 border-brand-border/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-brand-accent" />
                <h3 className="font-bold text-base">Execution Stack Trace</h3>
              </div>
              {issue.stack && (
                <button
                  onClick={copyStackToClipboard}
                  className="flex items-center gap-1 text-xs text-brand-accent hover:text-brand-accent/80 font-bold bg-brand-accent/10 px-2.5 py-1.5 rounded-lg border border-brand-accent/20 transition-colors"
                >
                  {copiedStack ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Stack
                    </>
                  )}
                </button>
              )}
            </div>

            {issue.stack ? (
              <pre className="terminal-console text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre select-all text-red-300 bg-red-950/10 border-red-500/10">
                {issue.stack}
              </pre>
            ) : (
              <div className="terminal-console text-xs flex items-center justify-center p-8 text-zinc-600">
                No error stack trace was provided in metadata.
              </div>
            )}
          </div>

          {/* Environment Distribution Stats */}
          <div className="glass-card p-6 border-brand-border/40">
            <h3 className="font-bold text-base mb-4">Environment Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Browsers distribution */}
              <div>
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-brand-accent" /> Browsers
                </span>
                {browserDist.length > 0 ? (
                  <div className="space-y-3">
                    {browserDist.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-semibold">{item.name}</span>
                          <span className="text-zinc-500">{item.percentage}% ({item.count})</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand-accent h-full rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600">No browser data enqueued.</span>
                )}
              </div>

              {/* OS distribution */}
              <div>
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-1.5">
                  <Monitor className="h-4 w-4 text-brand-purple" /> Operating Systems
                </span>
                {osDist.length > 0 ? (
                  <div className="space-y-3">
                    {osDist.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-semibold">{item.name}</span>
                          <span className="text-zinc-500">{item.percentage}% ({item.count})</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand-purple h-full rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600">No OS data enqueued.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Click-to-Error Timeline */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-brand-border/40">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4.5 w-4.5 text-brand-red animate-pulse" />
              <h3 className="font-bold text-base">Click-to-Error Timeline</h3>
            </div>
            <p className="text-zinc-500 text-xs mb-6">User breadcrumbs preceding the crash event</p>

            {breadcrumbs && breadcrumbs.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-border">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  const isRoute = crumb.type === 'route_change';
                  const isCrash = crumb.type === 'crash';

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                        isCrash ? 'bg-brand-red border-brand-red ring-4 ring-brand-red/10 animate-bounce' :
                        isRoute ? 'bg-brand-purple border-brand-purple' : 
                        'bg-zinc-900 border-zinc-700'
                      }`}>
                        {isRoute && <span className="h-1 w-1 bg-white rounded-full"></span>}
                      </span>

                      {/* Content card */}
                      <div className={`p-3 rounded-lg border text-xs ${
                        isCrash ? 'bg-red-500/5 border-red-500/10 text-red-300' :
                        isRoute ? 'bg-purple-500/5 border-purple-500/10 text-purple-300' :
                        'bg-zinc-950 border-brand-border/60 text-zinc-300'
                      }`}>
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                            {crumb.type}
                          </span>
                          <span className="text-[9px] text-zinc-600">
                            {new Date(crumb.timestamp).toLocaleTimeString(undefined, { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="font-mono leading-relaxed break-words">{crumb.message}</p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Final Terminal crash banner if the SDK did not record a crash crumb natively */}
                {!breadcrumbs.some(c => c.type === 'crash') && (
                  <div className="relative">
                    <span className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full bg-brand-red border-2 border-brand-red ring-4 ring-brand-red/10 animate-pulse"></span>
                    <div className="p-3 rounded-lg border bg-red-500/5 border-red-500/20 text-xs text-red-300">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">crash</span>
                        <span className="text-[9px] text-red-500/60">Final Event</span>
                      </div>
                      <p className="font-mono font-bold">{issue.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-600 border border-brand-border border-dashed rounded-lg bg-zinc-950/20">
                <Terminal className="h-8 w-8 mx-auto text-zinc-700 mb-2" />
                <span className="text-xs">No breadcrumbs timeline captured for this crash.</span>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-xs mx-auto">
                  Ensure the JS SDK is fully initialized on click events to collect interaction trail.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
