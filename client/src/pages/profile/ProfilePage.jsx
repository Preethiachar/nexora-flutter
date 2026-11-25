import { useState, useEffect, useRef } from 'react';
import {
  User, Award, Clock, Edit3, Save, X, Camera, FileUp, FileText,
  MapPin, Phone, Globe, GraduationCap, Briefcase, Sparkles, CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [extractBanner, setExtractBanner] = useState(null);
  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '', headline: '', bio: '', skills: '', interests: '',
    phone: '', location: '', linkedIn: '', github: '', portfolioUrl: '',
    education: [], experience: [],
  });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        headline: user.headline || '',
        bio: user.bio || '',
        skills: (user.skills || []).join(', '),
        interests: (user.interests || []).join(', '),
        phone: user.phone || '',
        location: user.location || '',
        linkedIn: user.linkedIn || '',
        github: user.github || '',
        portfolioUrl: user.portfolioUrl || '',
        education: user.education || [],
        experience: user.experience || [],
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractingPdf(true);
    setExtractBanner(null);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const { data } = await api.post('/auth/resume-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      setExtractBanner(data.extracted);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not extract details from PDF');
    } finally {
      setExtractingPdf(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
      });
      updateUser(data.user);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Compute unique Civic Impact Rank & Profile Completeness
  const completenessChecks = [
    Boolean(user?.avatarUrl),
    Boolean(user?.headline),
    Boolean(user?.bio),
    Boolean(user?.skills?.length),
    Boolean(user?.resumeText),
    Boolean(user?.location),
  ];
  const completeness = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 100);
  const civicHours = user?.civicHours || 0;
  const impactTier = civicHours >= 100 ? 'Civic Architect' : civicHours >= 30 ? 'Change Maker' : 'Civic Explorer';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Unique Hero Identity Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-800 text-xs font-bold shadow-sm">
              ✨ {impactTier} · {completeness}% Complete
            </span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Profile Photo with Upload Overlay */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <Avatar user={user} size="xl" className="w-24 h-24 ring-4 ring-white shadow-md" />
              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md ring-2 ring-white"
                title="Upload profile photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{user?.fullName}</h1>
                <span className="badge badge-emerald capitalize">{user?.role}</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{user?.headline || 'Add a headline or upload your PDF resume to auto-fill'}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                {user?.location && <span className="flex items-center gap-1"><MapPin size={13} /> {user.location}</span>}
                {user?.phone && <span className="flex items-center gap-1"><Phone size={13} /> {user.phone}</span>}
                <span>{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5">
                    <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-xs flex items-center gap-1">
                    <X size={14} /> Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Resume Upload & Automatic Detail Extraction Card */}
      <div className="card bg-gradient-to-r from-emerald-50/80 to-sky-50/70 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              Smart PDF Resume Extraction
              <Sparkles size={15} className="text-emerald-600" />
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Upload your PDF resume — Nexora extracts your skills, education, experience, phone & links straight into your profile!
            </p>
            {user?.resumeFileName && (
              <p className="text-xs font-semibold text-emerald-700 mt-1">
                Active Resume: <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="underline">{user.resumeFileName}</a>
              </p>
            )}
          </div>
        </div>
        <div>
          <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} accept=".pdf" className="hidden" />
          <button
            onClick={() => resumeInputRef.current?.click()}
            disabled={extractingPdf}
            className="btn-primary text-xs flex items-center gap-2 whitespace-nowrap"
          >
            <FileUp size={15} />
            {extractingPdf ? 'Extracting PDF…' : 'Upload PDF Resume'}
          </button>
        </div>
      </div>

      {extractBanner && (
        <div className="card border-emerald-300 bg-emerald-50/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle size={17} className="text-emerald-600" />
            Extracted {extractBanner.wordCount} words & enriched your profile!
          </div>
          <p className="text-xs text-slate-600">
            Found {extractBanner.skills?.length || 0} skills, {extractBanner.education?.length || 0} education entries, and {extractBanner.experience?.length || 0} experience lines.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-extrabold text-emerald-600">{civicHours}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Clock size={12} /> Civic Hours</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-extrabold text-amber-600">{user?.badges?.length || 0}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Award size={12} /> Civic Badges</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-extrabold text-sky-600">{user?.skills?.length || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Verified Skills</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-extrabold text-purple-600">{completeness}%</div>
          <div className="text-xs text-slate-500 mt-1">Profile Strength</div>
        </div>
      </div>

      {/* Main Details & Edit Mode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {/* Bio & Contact */}
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User size={17} className="text-emerald-600" /> About & Details
            </h3>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Full Name</label>
                    <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Location</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input text-sm mt-1" placeholder="City, Country" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Headline</label>
                    <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="input text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input text-sm mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input text-sm mt-1 h-24 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Skills (comma-separated)</label>
                  <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="input text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Civic Interests (comma-separated)</label>
                  <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} className="input text-sm mt-1" placeholder="Climate Action, EdTech, Rural Health" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={form.linkedIn} onChange={(e) => setForm({ ...form, linkedIn: e.target.value })} className="input text-xs" placeholder="LinkedIn URL" />
                  <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input text-xs" placeholder="GitHub URL" />
                  <input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} className="input text-xs" placeholder="Portfolio URL" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {user?.bio || 'No bio added yet. Click Edit Profile or upload a PDF resume to auto-populate.'}
                </p>
                {user?.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map((s) => <span key={s} className="badge badge-emerald">{s}</span>)}
                    </div>
                  </div>
                )}
                {user?.interests?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.interests.map((i) => <span key={i} className="badge badge-slate">{i}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extracted / Saved Experience */}
          <div className="card space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={17} className="text-emerald-600" /> Experience & Projects
            </h3>
            {user?.experience?.length > 0 ? (
              <div className="space-y-3">
                {user.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">{exp.title}</p>
                    {(exp.organization || exp.duration) && (
                      <p className="text-xs text-slate-500 mt-0.5">{[exp.organization, exp.duration].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Upload your PDF resume above to automatically extract experience lines.</p>
            )}
          </div>

          {/* Education */}
          <div className="card space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap size={17} className="text-emerald-600" /> Education
            </h3>
            {user?.education?.length > 0 ? (
              <div className="space-y-2.5">
                {user.education.map((ed, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{ed.institution}</p>
                    {ed.year && <span className="badge badge-slate">{ed.year}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Education details will appear here after PDF resume extraction.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar: Badges & Links */}
        <div className="space-y-5">
          <div className="card space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Award size={17} className="text-amber-500" /> Earned Badges
            </h3>
            <div className="space-y-2">
              {(user?.badges || []).map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-xs font-bold text-amber-900">{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Globe size={17} className="text-sky-600" /> Links
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-slate-600"><strong className="text-slate-800">LinkedIn:</strong> {user?.linkedIn || 'Not added'}</p>
              <p className="text-slate-600"><strong className="text-slate-800">GitHub:</strong> {user?.github || 'Not added'}</p>
              <p className="text-slate-600"><strong className="text-slate-800">Portfolio:</strong> {user?.portfolioUrl || 'Not added'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
