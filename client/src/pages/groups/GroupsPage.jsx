import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Lightbulb, ChevronRight, Plus, Search, X, Check } from 'lucide-react';
import api from '../../services/api';
import Avatar from '../../components/Avatar';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const fetchGroups = () => {
    setLoading(true);
    api.get('/messages/groups')
      .then(({ data }) => setGroups(data.groups || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (userSearch.trim().length < 2) {
      setFoundUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/messages/users/lookup?q=${encodeURIComponent(userSearch)}`);
        setFoundUsers(data.users || []);
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [userSearch]);

  const toggleMember = (u) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m._id === u._id) ? prev.filter((m) => m._id !== u._id) : [...prev, u]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/messages/groups', {
        name: groupName,
        description: groupDesc,
        memberIds: selectedMembers.map((m) => m._id),
      });
      setShowCreate(false);
      setGroupName('');
      setGroupDesc('');
      setSelectedMembers([]);
      navigate(`/groups/${data.group._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  const roleIcon = { lead: '👑', mentor: '🎓', member: '👤' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <MessageSquare className="text-emerald-600" size={26} />
            Messaging & Collaboration Groups
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Groups are automatically created when an idea application is accepted, or create a group directly. Share Word, PPT & PDF files in real time.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm self-start">
          <Plus size={16} />
          New Group
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">No collaboration groups yet</p>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Apply to an idea in the Marketplace — once the author accepts you, your team group appears here automatically! Or start a new group now.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Link to="/ideas" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Lightbulb size={16} /> Browse Ideas
            </Link>
            <button onClick={() => setShowCreate(true)} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <Plus size={16} /> Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className="card hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <MessageSquare size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                    {group.name}
                  </h3>
                  {group.idea ? (
                    <span className="badge badge-emerald text-[11px]">💡 Auto-Created Idea Group</span>
                  ) : (
                    <span className="badge badge-slate text-[11px]">💬 Team Group</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {group.idea && (
                    <span className="flex items-center gap-1">
                      <Lightbulb size={12} className="text-amber-500" /> {group.idea.title}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {group.members?.length} members
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  {group.members?.slice(0, 5).map((m) => (
                    <div
                      key={m.user?._id}
                      className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200"
                      title={`${m.user?.fullName} (${m.role})`}
                    >
                      <Avatar user={m.user} size="xs" />
                      <span className="max-w-[80px] truncate">{m.user?.fullName?.split(' ')[0]}</span>
                      <span>{roleIcon[m.role]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Create Messaging Group</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Group Name *</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Solar Microgrid Sprint Team"
                  className="input text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="What is this group collaborating on?"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Members (search by name or email)</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Type at least 2 letters…"
                    className="input pl-9 py-2 text-sm"
                  />
                </div>
                {foundUsers.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-100">
                    {foundUsers.map((u) => {
                      const picked = selectedMembers.some((m) => m._id === u._id);
                      return (
                        <button
                          type="button"
                          key={u._id}
                          onClick={() => toggleMember(u)}
                          className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-slate-50"
                        >
                          <Avatar user={u} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{u.fullName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                          </div>
                          {picked && <Check size={15} className="text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedMembers.map((m) => (
                      <span key={m._id} className="badge badge-emerald">
                        {m.fullName}
                        <button type="button" onClick={() => toggleMember(m)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary text-sm">
                  {creating ? 'Creating…' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
