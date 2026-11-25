import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle, XCircle,
  GraduationCap, ExternalLink, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

export default function IdeaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIdea = async () => {
    const { data } = await api.get(`/marketplace/ideas/${id}`);
    setIdea(data.idea);
  };

  useEffect(() => {
    fetchIdea().finally(() => setLoading(false));
    api.get('/marketplace/mentors').then(({ data }) => setMentors(data.mentors || []));
  }, [id]);

  const handleMemberAction = async (memberId, action) => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/marketplace/ideas/${id}/accept-member`, { memberId, action });
      await fetchIdea();
      if (action === 'accept' && data.group?._id) {
        if (window.confirm('Applicant accepted and added to the Collaboration Group! Open Group Chat now?')) {
          navigate(`/groups/${data.group._id}`);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/marketplace/ideas/${id}/apply`);
      alert(data.message);
      await fetchIdea();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not apply');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignMentor = async (mentorId) => {
    setActionLoading(true);
    try {
      await api.post(`/marketplace/ideas/${id}/mentor`, { mentorId });
      await fetchIdea();
      setShowMentorModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign mentor');
    } finally {
      setActionLoading(false);
    }
  };

  const isAuthor = idea?.author?._id === user?._id;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  if (!idea) return <div className="text-center text-slate-500">Idea not found</div>;

  const pendingMembers = idea.members?.filter((m) => m.status === 'pending') || [];
  const acceptedMembers = idea.members?.filter((m) => m.status === 'accepted') || [];
  const alreadyApplied = idea.members?.some((m) => (m.user?._id || m.user) === user?._id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-emerald capitalize">{idea.domain?.replace('-', ' ')}</span>
          <span className="badge badge-slate capitalize">{idea.status}</span>
        </div>
      </div>

      <div className="card space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{idea.title}</h1>
        <p className="text-slate-600 leading-relaxed">{idea.description}</p>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <Avatar user={idea.author} size="md" />
          <div>
            <p className="font-semibold text-slate-900">{idea.author?.fullName}</p>
            <p className="text-xs text-slate-500">{idea.author?.headline || 'Civic Innovator'} · {idea.author?.civicHours}h civic</p>
          </div>
          {isAuthor && <span className="ml-auto badge badge-emerald">👑 Author</span>}
        </div>

        {idea.requiredSkills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {idea.requiredSkills.map((s) => <span key={s} className="badge badge-slate">{s}</span>)}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-600 pt-2 border-t border-slate-100">
          <Users size={16} className="text-emerald-600" />
          <span>{acceptedMembers.length} / {idea.teamSlots} team slots filled</span>
          {idea.groupId && (
            <Link to={`/groups/${idea.groupId}`} className="ml-auto btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5">
              <ExternalLink size={13} /> Open Group Chat
            </Link>
          )}
          {!isAuthor && !alreadyApplied && (
            <button onClick={handleApply} disabled={actionLoading} className="ml-auto btn-primary text-xs py-1.5 px-4">
              Apply to Join
            </button>
          )}
        </div>
      </div>

      {/* Mentor section */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="text-amber-500" size={18} />
            Project Mentor
          </h3>
          {isAuthor && (
            <button onClick={() => setShowMentorModal(true)} className="btn-secondary text-xs py-1.5 px-3">
              {idea.mentor ? 'Change Mentor' : 'Assign Mentor'}
            </button>
          )}
        </div>
        {idea.mentor ? (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <Avatar user={idea.mentor} size="md" />
            <div>
              <p className="font-bold text-slate-900">{idea.mentor?.fullName}</p>
              <p className="text-xs text-slate-600">{idea.mentor?.headline || 'Industry Expert'}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {idea.mentor?.skills?.slice(0, 3).map((s) => (
                  <span key={s} className="badge bg-white text-slate-700 border border-amber-200 text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No mentor assigned yet. {isAuthor ? 'Click "Assign Mentor" to choose a certified mentor.' : ''}
          </p>
        )}
      </div>

      {/* Pending Applications */}
      {isAuthor && pendingMembers.length > 0 && (
        <div className="card space-y-3 border-amber-200 bg-amber-50/30">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-emerald-600" size={18} />
            Pending Applications ({pendingMembers.length})
          </h3>
          <p className="text-xs text-slate-500">
            Accepting an applicant automatically creates/updates your Collaboration Group in Messaging.
          </p>
          {pendingMembers.map((m) => (
            <div key={m.user?._id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200">
              <Avatar user={m.user} size="sm" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{m.user?.fullName}</p>
                <p className="text-xs text-slate-500">{m.user?.headline}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMemberAction(m.user?._id, 'accept')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1"
                >
                  <CheckCircle size={14} /> Accept
                </button>
                <button
                  onClick={() => handleMemberAction(m.user?._id, 'reject')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold flex items-center gap-1"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {acceptedMembers.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-bold text-slate-900">Accepted Team Members ({acceptedMembers.length})</h3>
          {acceptedMembers.map((m) => (
            <div key={m.user?._id} className="flex items-center gap-3">
              <Avatar user={m.user} size="sm" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{m.user?.fullName}</p>
                <p className="text-xs text-slate-500">{m.user?.headline}</p>
              </div>
              <span className="ml-auto badge badge-emerald capitalize">{m.role}</span>
            </div>
          ))}
        </div>
      )}

      {showMentorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">Select Verified Mentor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mentors guide milestones and join your group chat</p>
              </div>
              <button onClick={() => setShowMentorModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {mentors.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No mentors registered yet.</p>
              ) : mentors.map((mentor) => (
                <div key={mentor._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Avatar user={mentor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{mentor.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{mentor.headline || 'Industry Expert'}</p>
                  </div>
                  <button
                    onClick={() => handleAssignMentor(mentor._id)}
                    disabled={actionLoading || idea.mentor?._id === mentor._id}
                    className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                  >
                    {idea.mentor?._id === mentor._id ? '✓ Assigned' : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
