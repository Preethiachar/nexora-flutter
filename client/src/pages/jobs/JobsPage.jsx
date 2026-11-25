import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, MapPin, Search, Plus, CheckCircle, Sparkles, X, Zap, Building2, Clock
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

const TYPE_STYLES = {
  internship: 'bg-sky-50 text-sky-700 border-sky-200',
  'full-time': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'part-time': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  fellowship: 'bg-amber-50 text-amber-700 border-amber-200',
  volunteer: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function JobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');
  const [newJob, setNewJob] = useState({
    title: '',
    organization: '',
    description: '',
    location: 'Remote',
    isRemote: true,
    type: 'internship',
    domain: 'technology',
    compensation: 'Paid / Stipend',
    requiredSkills: '',
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (remoteOnly) params.set('remote', 'true');
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [typeFilter, remoteOnly]);

  const showNotice = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;
    setApplyingId(applyModalJob._id);
    try {
      const { data } = await api.post(`/jobs/${applyModalJob._id}/apply`, { coverNote });
      showNotice(`Applied to ${applyModalJob.title}! ATS Profile Match: ${data.matchScore}%`);
      setApplyModalJob(null);
      setCoverNote('');
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit application');
    } finally {
      setApplyingId(null);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', {
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setNewJob({
        title: '', organization: '', description: '', location: 'Remote',
        isRemote: true, type: 'internship', domain: 'technology',
        compensation: 'Paid / Stipend', requiredSkills: '',
      });
      showNotice('Job opportunity published!');
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post opportunity');
    }
  };

  const hasApplied = (job) =>
    job.applicants?.some((a) => (a.user?._id || a.user) === user?._id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Briefcase className="text-emerald-600" size={26} />
            Job Opportunities
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Civic internships, fellowships, and impact roles tailored to your skills & PDF resume
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/ats')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Zap size={16} className="text-emerald-600" />
            AI ATS Check
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Post Opportunity
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle size={18} className="text-emerald-600" />
          {toast}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            placeholder="Search roles, organizations, or skills…"
            className="input pl-10 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'internship', 'full-time', 'fellowship', 'volunteer'].map((t) => (
            <button
              key={t || 'all'}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                typeFilter === t
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t || 'All Types'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Remote only
        </label>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={44} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No matching opportunities found.</p>
          <p className="text-slate-400 text-sm mt-1">Try clearing filters or post a new civic opportunity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const applied = hasApplied(job);
            const myApp = job.applicants?.find((a) => (a.user?._id || a.user) === user?._id);

            return (
              <div key={job._id} className="card hover:border-emerald-300 transition-all flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-snug">{job.title}</h3>
                        <p className="text-xs font-medium text-slate-500">{job.organization}</p>
                      </div>
                    </div>
                    <span className={`badge border capitalize ${TYPE_STYLES[job.type] || 'badge-slate'}`}>
                      {job.type}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      {job.compensation}
                    </span>
                  </div>

                  {job.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((skill) => (
                        <span key={skill} className="badge badge-slate text-[11px]">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Avatar user={job.postedBy} size="xs" />
                    <span className="text-xs text-slate-500">{job.postedBy?.fullName || 'Partner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/ats', { state: { jobDescription: `${job.title}\n${job.description}\nSkills: ${(job.requiredSkills || []).join(', ')}` } })}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={13} /> ATS Fit
                    </button>
                    {applied ? (
                      <span className="badge badge-emerald">
                        ✓ Applied {myApp?.matchScore ? `(${myApp.matchScore}%)` : ''}
                      </span>
                    ) : (
                      <button
                        onClick={() => setApplyModalJob(job)}
                        className="btn-primary text-xs py-1.5 px-3.5"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Apply to {applyModalJob.title}</h3>
                <p className="text-xs text-slate-500">{applyModalJob.organization}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Short Note / Why you're a great fit
                </label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Share relevant experience or civic projects…"
                  className="input h-28 resize-none text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Your profile skills & extracted PDF resume will be included automatically.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setApplyModalJob(null)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={Boolean(applyingId)} className="btn-primary text-sm">
                  {applyingId ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Post a Job / Opportunity</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title *</label>
                <input
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Civic Data Intern"
                  className="input text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization *</label>
                  <input
                    value={newJob.organization}
                    onChange={(e) => setNewJob({ ...newJob, organization: e.target.value })}
                    placeholder="e.g. GreenFuture NGO"
                    className="input text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="internship">Internship</option>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stipend / Salary</label>
                  <input
                    value={newJob.compensation}
                    onChange={(e) => setNewJob({ ...newJob, compensation: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required Skills (comma-separated)</label>
                <input
                  value={newJob.requiredSkills}
                  onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                  placeholder="React, Python, GIS, Research"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Describe responsibilities, civic impact, and qualifications…"
                  className="input h-28 resize-none text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm">
                  Publish Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
