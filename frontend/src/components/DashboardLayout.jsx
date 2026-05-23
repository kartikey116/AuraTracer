import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Terminal, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  Plus, 
  Layers, 
  User, 
  ChevronDown, 
  Globe, 
  PlusCircle, 
  X,
  Check,
  HelpCircle
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { 
    user, 
    projects, 
    currentProject, 
    selectProject, 
    createProject, 
    logout 
  } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjOrigins, setNewProjOrigins] = useState('*');
  const [creating, setCreating] = useState(false);

  const navigation = [
    { name: 'Setup Guide', href: '/setup', icon: HelpCircle },
    { name: 'Overview', href: '/', icon: Activity },
    { name: 'Issues Feed', href: '/issues', icon: AlertTriangle },
    { name: 'Live Logs', href: '/logs', icon: Terminal },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setCreating(true);
    const success = await createProject(newProjName, newProjOrigins);
    setCreating(false);
    if (success) {
      setNewProjName('');
      setNewProjOrigins('*');
      setModalOpen(false);
    }
  };

  // If loading or not authenticated, render nothing (handled by app routing)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-darkest text-zinc-100 flex">
      {/* SIDEBAR */}
      <aside className="w-64 h-screen sticky top-0 border-r border-brand-border bg-brand-dark bg-opacity-40 flex flex-col justify-between shrink-0">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Logo Section */}
          <div className="p-6 border-b border-brand-border flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-accent to-brand-purple flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                AURATRACE
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">OBSERVABILITY</p>
            </div>
          </div>

          {/* Project Selector Dropdown */}
          <div className="px-4 py-4 border-b border-brand-border relative">
            <label className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase block mb-1.5 px-1">
              Active Project
            </label>
            {projects.length > 0 ? (
              <div>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-zinc-900 border border-brand-border rounded-lg px-3 py-2 text-sm font-medium hover:border-zinc-700 transition-colors"
                >
                  <span className="truncate">{currentProject?.name || 'Select Project'}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-4 right-4 mt-1 bg-zinc-900 border border-brand-border rounded-lg shadow-2xl py-1.5 z-50">
                    <div className="max-h-48 overflow-y-auto">
                      {projects.map((proj) => (
                        <button
                          key={proj._id}
                          onClick={() => {
                            selectProject(proj);
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-brand-dark text-left"
                        >
                          <span className="truncate">{proj.name}</span>
                          {currentProject?._id === proj._id && (
                            <Check className="h-3.5 w-3.5 text-brand-accent" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-brand-border mt-1 pt-1.5 px-1">
                      <button
                        onClick={() => {
                          setModalOpen(true);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-brand-accent hover:bg-brand-dark rounded-md text-left font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create New Project
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-brand-accent/15 border border-brand-accent/30 text-brand-accent rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-accent/20 transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                Add Project
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navigation.map((item) => {
              const active = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={projects.length > 0 ? item.href : '#'}
                  onClick={(e) => {
                    if (projects.length === 0) {
                      e.preventDefault();
                      setModalOpen(true);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-brand-accent/10 border border-brand-accent/20 text-brand-accent'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <item.icon className={`h-4.5 w-4.5 ${active ? 'text-brand-accent' : 'text-zinc-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-brand-border flex items-center justify-between gap-3 bg-brand-dark bg-opacity-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
              <User className="h-4 w-4 text-zinc-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-zinc-800 hover:text-red-400 text-zinc-500 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {projects.length > 0 ? (
          <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="glass-card max-w-md w-full p-8 text-center border-dashed border-2 border-brand-border">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-6 text-brand-accent animate-pulse">
                <Layers className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Projects Detected</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Observability details require a registered project. Set up your first project container to begin collecting telemetry logs.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Initialize Project
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-dark border border-brand-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h3 className="font-bold text-lg">Initialize New Project</h3>
              <button 
                onClick={() => {
                  if (projects.length > 0) setModalOpen(false);
                }}
                disabled={projects.length === 0}
                className="p-1 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-semibold tracking-wide uppercase block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My SaaS Production"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-zinc-900 border border-brand-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold tracking-wide uppercase block mb-1">
                  Allowed Origins (CORS)
                </label>
                <input
                  type="text"
                  placeholder="e.g. *, http://localhost:3000, https://myapp.com"
                  value={newProjOrigins}
                  onChange={(e) => setNewProjOrigins(e.target.value)}
                  className="w-full bg-zinc-900 border border-brand-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors text-zinc-300"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Use comma separated list or `*` to allow all origins.
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                {projects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-zinc-900 border border-brand-border text-zinc-400 hover:text-zinc-200 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-brand-accent hover:bg-brand-accent/90 text-white py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Initialize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
