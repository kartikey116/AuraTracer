import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Key, 
  Globe, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Trash2, 
  AlertTriangle,
  Save
} from 'lucide-react';

export default function Settings() {
  const { currentProject, fetchProjects, selectProject, API_BASE_URL } = useAuth();
  const navigate = useNavigate();

  const [projName, setProjName] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);
  
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Sync state with active project
  useEffect(() => {
    if (currentProject) {
      setProjName(currentProject.name);
      setAllowedOrigins(currentProject.allowedOrigins.join(', '));
      setUpdateMsg(null);
    }
  }, [currentProject]);

  const handleCopyKey = () => {
    if (!currentProject) return;
    navigator.clipboard.writeText(currentProject.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !currentProject) return;

    setUpdating(true);
    setUpdateMsg(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${currentProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projName,
          allowedOrigins: allowedOrigins
        }),
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        // Refresh project list and reselect
        const list = await fetchProjects();
        const updated = list.find(p => p._id === currentProject._id);
        if (updated) {
          selectProject(updated);
        }
        setUpdateMsg({ type: 'success', text: 'Project credentials updated successfully.' });
      } else {
        setUpdateMsg({ type: 'error', text: json.error || 'Failed to update settings.' });
      }
    } catch (err) {
      setUpdateMsg({ type: 'error', text: 'Server error updating project settings.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async (e) => {
    e.preventDefault();
    if (deleteConfirm !== currentProject?.name || !currentProject) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${currentProject._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        // Reload project list
        await fetchProjects();
        setDeleteConfirm('');
        navigate('/');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Project Settings</h2>
        <p className="text-zinc-400 text-sm">
          Configure security, CORS domains, and API credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Settings Form */}
          <div className="glass-card p-6 border-brand-border/40">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="h-4.5 w-4.5 text-brand-accent" />
              <h3 className="font-bold text-base">General Configuration</h3>
            </div>

            {updateMsg && (
              <div className={`mb-5 p-3 rounded-lg border text-sm ${
                updateMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {updateMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-zinc-950 border border-brand-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                  Allowed CORS Origins
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={allowedOrigins}
                    onChange={(e) => setAllowedOrigins(e.target.value)}
                    className="w-full bg-zinc-950 border border-brand-border rounded-lg pl-10 pr-3.5 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors text-zinc-300 font-mono"
                  />
                  <Globe className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block leading-relaxed">
                  Allowed CORS domains (comma-separated). Use `*` to bypass restriction. Example: `http://localhost:3000, https://app.example.com`
                </span>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-2 px-5 rounded-lg text-xs tracking-wide uppercase shadow-lg shadow-indigo-500/15 transition-all duration-200 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {updating ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Credentials Display */}
          <div className="glass-card p-6 border-brand-border/40">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4.5 w-4.5 text-brand-purple" />
              <h3 className="font-bold text-base">API Credentials</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Use this secret key to authorize client SDK trackers or pipeline server logs. Keep it confidential.
            </p>

            <div className="flex items-center gap-3 bg-zinc-950 border border-brand-border rounded-lg p-3 relative font-mono text-xs">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={currentProject?.apiKey || ''}
                className="bg-transparent border-none focus:outline-none flex-1 text-zinc-300 font-semibold tracking-wide pr-20 select-all"
              />
              <div className="absolute right-3 top-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all"
                  title={showKey ? 'Hide API Key' : 'Reveal API Key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center gap-1.5 bg-zinc-900 border border-brand-border text-brand-accent hover:text-brand-accent/95 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Key
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Danger Zone */}
        <div>
          <div className="glass-card p-6 border-brand-red/20 bg-brand-red/[0.02]">
            <div className="flex items-center gap-2 text-brand-red mb-3">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <h3 className="font-bold text-base">Danger Zone</h3>
            </div>
            <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
              Revoking this project deletes all enqueued logs, issue streams, and CORS permissions. This action is permanent and cannot be undone.
            </p>

            <form onSubmit={handleDeleteProject} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">
                  Type <span className="text-zinc-300 font-mono">"{currentProject?.name}"</span> to confirm
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentProject?.name}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full bg-zinc-950 border border-brand-red/10 focus:border-brand-red/40 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={deleting || deleteConfirm !== currentProject?.name}
                className="w-full flex items-center justify-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-30 disabled:cursor-not-allowed font-semibold py-2 px-4 rounded-lg text-xs tracking-wide uppercase transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? 'Revoking Project...' : 'Revoke Project'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
