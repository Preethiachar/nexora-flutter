import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Briefcase, Lightbulb, MessageSquare, Zap, Rss, User, LogOut, Search, Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Avatar from './Avatar';
import NexoraCopilot from './NexoraCopilot';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const navItems = [
    { to: '/jobs', icon: Briefcase, label: 'Job Opportunities' },
    { to: '/ideas', icon: Lightbulb, label: 'Idea Marketplace' },
    { to: '/groups', icon: MessageSquare, label: 'Messaging & Groups' },
    { to: '/ats', icon: Zap, label: 'AI ATS Scanner' },
    { to: '/feed', icon: Rss, label: 'Civic Feed' },
    { to: '/profile', icon: User, label: 'My Profile' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&category=all`);
      setSearchResults(data.results);
    } catch {
      /* ignore */
    }
  };

  const roleColor = {
    student: 'text-sky-700 bg-sky-50 border-sky-200',
    mentor: 'text-amber-700 bg-amber-50 border-amber-200',
    recruiter: 'text-purple-700 bg-purple-50 border-purple-200',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Left Navigation Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 flex flex-col bg-white border-r border-slate-200 transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">Nexora</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-slate-400 hover:text-slate-700"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link-active' : 'nav-link')}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <Avatar user={user} size="sm" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</p>
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${roleColor[user?.role] || 'text-slate-600'}`}>
                  {user?.role}
                </span>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, ideas, people, posts…"
              className="input pl-10 py-2 text-sm bg-slate-50"
            />
          </form>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <span>🌱</span>
              <span>{user?.civicHours || 0}h civic hrs</span>
            </div>

            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                copilotOpen
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              <Sparkles size={15} />
              <span>Nexora AI</span>
            </button>
          </div>
        </header>

        {/* Search results overlay */}
        {searchResults && (
          <div className="absolute top-14 left-6 right-6 max-w-2xl z-50 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-900">Search Results</h3>
              <button onClick={() => setSearchResults(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            {searchResults.jobs?.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jobs</p>
                {searchResults.jobs.map((j) => (
                  <div
                    key={j._id}
                    onClick={() => { navigate('/jobs'); setSearchResults(null); }}
                    className="py-2 px-2 rounded-lg hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                    <p className="text-xs text-slate-500">{j.organization} · {j.type}</p>
                  </div>
                ))}
              </div>
            )}
            {searchResults.ideas?.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ideas</p>
                {searchResults.ideas.map((i) => (
                  <div
                    key={i._id}
                    onClick={() => { navigate(`/ideas/${i._id}`); setSearchResults(null); }}
                    className="py-2 px-2 rounded-lg hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <p className="text-sm font-semibold text-slate-900">{i.title}</p>
                    <p className="text-xs text-slate-500">{i.domain}</p>
                  </div>
                ))}
              </div>
            )}
            {searchResults.people?.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">People</p>
                {searchResults.people.map((p) => (
                  <div key={p._id} className="flex items-center gap-2.5 py-2 border-b border-slate-100 last:border-0">
                    <Avatar user={p} size="xs" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.fullName}</p>
                      <p className="text-xs text-slate-500">{p.headline || p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!searchResults.people?.length && !searchResults.ideas?.length && !searchResults.jobs?.length && !searchResults.posts?.length && (
              <p className="text-slate-500 text-sm text-center py-4">No results found for "{searchQuery}"</p>
            )}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Side Copilot */}
      <NexoraCopilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
