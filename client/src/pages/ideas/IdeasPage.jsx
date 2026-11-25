import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Lightbulb, Users, ChevronRight, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

const DOMAIN_COLORS = {
  environment: 'bg-green-50 text-green-700 border-green-200',
  education: 'bg-blue-50 text-blue-700 border-blue-200',
  health: 'bg-red-50 text-red-700 border-red-200',
  governance: 'bg-purple-50 text-purple-700 border-purple-200',
  technology: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'social-impact': 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function IdeasPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [applyingId, setApplyingId] = useState(null);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (domain) params.set('domain', domain);
      const { data } = await api.get(`/marketplace/ideas?${params}`);
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [domain]);

  const handleApply = async (ideaId) => {
    setApplyingId(ideaId);
    try {
      const { data } = await api.post(`/marketplace/ideas/${ideaId}/apply`);
      alert(data.message);
      fetchIdeas();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not apply');
    } finally {
      setApplyingId(null);
    }
  };

  const getAcceptedCount = (members) =>
    members?.filter((m) => m.status === 'accepted').length || 0;

  const isAlreadyApplied = (idea) =>
    idea.members?.some((m) => (m.user?._id || m.user) === user?._id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="text-emerald-600" size={26} />
            Idea Marketplace
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Apply to join civic ideas — once accepted, a Collaboration Group opens automatically in Messaging
          </p>
        </div>
        <Link to="/ideas/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18} />
          New Idea
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchIdeas()}
            placeholder="Search ideas…"
            className="input pl-10 py-2 text-sm"
          />
        </div>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="input py-2 text-sm w-auto"
        >
          <option value="">All Domains</option>
          <option value="environment">🌿 Environment</option>
          <option value="education">📚 Education</option>
          <option value="health">🏥 Health</option>
          <option value="governance">🏛️ Governance</option>
          <option value="technology">💻 Technology</option>
          <option value="social-impact">🤝 Social Impact</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="card text-center py-16">
          <Lightbulb size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No ideas found. Be the first to pitch one!</p>
          <Link to="/ideas/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plus size={16} /> Launch an Idea
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea) => {
            const accepted = getAcceptedCount(idea.members);
            const pendingCount = idea.members?.filter((m) => m.status === 'pending').length || 0;
            const applied = isAlreadyApplied(idea);
            const isAuthor = idea.author?._id === user?._id;
            const isFull = accepted >= idea.teamSlots;

            return (
              <div key={idea._id} className="card hover:border-emerald-300 transition-all flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`badge border ${DOMAIN_COLORS[idea.domain] || DOMAIN_COLORS.other} capitalize`}>
                    {idea.domain?.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isAuthor && pendingCount > 0 && (
                      <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                        {pendingCount} pending
                      </span>
                    )}
                    <span className="badge badge-slate capitalize">{idea.status}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">{idea.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{idea.description}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Avatar user={idea.author} size="xs" />
                  <span className="font-medium text-slate-700">{idea.author?.fullName}</span>
                  {idea.mentor && (
                    <span className="ml-auto badge badge-emerald">🎓 Mentored</span>
                  )}
                </div>

                {idea.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {idea.requiredSkills.slice(0, 4).map((s) => (
                      <span key={s} className="badge badge-slate text-xs">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users size={13} />
                    <span>{accepted}/{idea.teamSlots} slots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/ideas/${idea._id}`}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      {isAuthor && pendingCount > 0 ? 'Review Applicants' : 'View'} <ChevronRight size={13} />
                    </Link>
                    {!isAuthor && (
                      <button
                        onClick={() => handleApply(idea._id)}
                        disabled={applied || isFull || applyingId === idea._id}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                          applied
                            ? 'bg-slate-100 text-slate-500 cursor-default'
                            : isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {applyingId === idea._id ? '…' : applied ? 'Applied' : isFull ? 'Full' : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
