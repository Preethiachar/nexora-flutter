import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Plus, X, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const DOMAINS = ['environment', 'education', 'health', 'governance', 'technology', 'social-impact', 'other'];

export default function CreateIdeaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', domain: '', teamSlots: 4,
    requiredSkills: [], tags: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm((f) => ({ ...f, requiredSkills: [...f.requiredSkills, s] }));
    }
    setSkillInput('');
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.domain) return setError('Please select a domain.');
    setLoading(true);
    setError('');
    try {
      await api.post('/marketplace/ideas', form);
      navigate('/ideas');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="text-emerald-600" size={26} />
            Launch a Civic Idea
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Pitch your idea to find collaborators and mentors</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Idea Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Community Solar Microgrids for Rural Schools"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your civic idea, the problem it solves, and the impact you envision…"
            className="input h-32 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Domain *</label>
            <select
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="input"
            >
              <option value="">Select domain…</option>
              {DOMAINS.map((d) => <option key={d} value={d} className="capitalize">{d.replace('-', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team Slots</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.teamSlots}
              onChange={(e) => setForm({ ...form, teamSlots: parseInt(e.target.value) })}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Skills</label>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="e.g. React, GIS, Community Organizing"
              className="input flex-1"
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-3">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.requiredSkills.map((s) => (
              <span key={s} className="badge badge-emerald">
                {s}
                <button type="button" onClick={() => setForm((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((x) => x !== s) }))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="e.g. sustainability, youth, urban"
              className="input flex-1"
            />
            <button type="button" onClick={addTag} className="btn-secondary px-3">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.tags.map((t) => (
              <span key={t} className="badge badge-slate">
                #{t}
                <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? 'Launching…' : '🚀 Launch Idea'}
        </button>
      </form>
    </div>
  );
}
