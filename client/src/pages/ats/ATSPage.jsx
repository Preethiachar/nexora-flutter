import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Zap, FileText, Target, TrendingUp, AlertCircle, CheckCircle, XCircle, FileUp } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ATSPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [jobDescription, setJobDescription] = useState(location.state?.jobDescription || '');
  const [pdfFile, setPdfFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pdfInputRef = useRef(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      return setError('Please paste the job description.');
    }
    if (!pdfFile && !resumeText.trim()) {
      return setError('Upload a PDF resume or paste your resume text.');
    }

    setError('');
    setLoading(true);
    try {
      if (pdfFile) {
        const fd = new FormData();
        fd.append('resume', pdfFile);
        fd.append('jobDescription', jobDescription);
        const { data } = await api.post('/ai/resume-ats-pdf', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setResumeText(data.extractedText || '');
        setResult(data.result);
      } else {
        const { data } = await api.post('/ai/resume-ats', { resumeText, jobDescription });
        setResult(data.result);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const scoreRingOffset = (score) => {
    const circumference = 2 * Math.PI * 45;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="text-emerald-600" size={26} />
          AI ATS Resume Scanner
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a PDF resume or paste text to compare against any civic job description
        </p>
      </div>

      <form onSubmit={handleScan} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-emerald-600" />
              Your Resume (PDF or Text)
            </label>
            <input
              type="file"
              ref={pdfInputRef}
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              accept=".pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <FileUp size={14} className="text-emerald-600" />
              {pdfFile ? pdfFile.name : 'Upload PDF'}
            </button>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => { setResumeText(e.target.value); setPdfFile(null); }}
            placeholder="Upload a PDF above or paste your resume text here…"
            className="input h-56 resize-none font-mono text-xs bg-slate-50"
          />
          <p className="text-xs text-slate-400">
            {pdfFile ? `Selected PDF: ${pdfFile.name} (will auto-extract on scan)` : 'Supports direct PDF extraction or pasted resume text'}
          </p>
        </div>

        <div className="card space-y-3">
          <label className="block font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Target size={16} className="text-emerald-600" />
            Job / Internship Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job or internship description here…"
            className="input h-56 resize-none font-mono text-xs bg-slate-50"
            required
          />
          <p className="text-xs text-slate-400">Works with NGO roles, fellowships, and tech internships</p>
        </div>

        {error && (
          <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="md:col-span-2">
          <button type="submit" className="btn-primary px-8 py-2.5" disabled={loading}>
            {loading ? 'Extracting & Analyzing…' : '⚡ Scan Resume'}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-5">
          <div className="card flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
              <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
                <circle cx="65" cy="65" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="65"
                  cy="65"
                  r="45"
                  fill="none"
                  stroke={result.matchScore >= 75 ? '#059669' : result.matchScore >= 50 ? '#d97706' : '#dc2626'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={scoreRingOffset(result.matchScore)}
                  style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold ${scoreColor(result.matchScore)}`}>
                  {result.matchScore}%
                </span>
                <span className="text-xs text-slate-400">match</span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {result.matchScore >= 75 ? '🌟 Strong Match' : result.matchScore >= 50 ? '⚡ Good Match' : '🔧 Needs Work'}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">{result.careerAdvice}</p>
              <div className="flex gap-4 mt-4 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle size={16} /> {result.matchedKeywords.length} matched
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <XCircle size={16} /> {result.missingKeywords.length} missing
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-emerald-700 flex items-center gap-2 mb-3 text-sm">
                <CheckCircle size={16} /> Matched Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedKeywords.map((kw) => (
                  <span key={kw} className="badge badge-emerald">{kw}</span>
                ))}
                {result.matchedKeywords.length === 0 && (
                  <p className="text-slate-400 text-sm">No keyword matches found.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-red-600 flex items-center gap-2 mb-3 text-sm">
                <XCircle size={16} /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.slice(0, 15).map((kw) => (
                  <span key={kw} className="badge bg-red-50 text-red-700 border border-red-200">{kw}</span>
                ))}
                {result.missingKeywords.length === 0 && (
                  <p className="text-emerald-700 text-sm">🎉 You have all required keywords!</p>
                )}
              </div>
            </div>
          </div>

          {result.improvements?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-sm">
                <TrendingUp size={16} className="text-amber-600" />
                Improvement Suggestions
              </h3>
              <div className="space-y-2.5">
                {result.improvements.map((imp, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="badge badge-slate flex-shrink-0">{imp.keyword}</span>
                    <p className="text-sm text-slate-600">{imp.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
