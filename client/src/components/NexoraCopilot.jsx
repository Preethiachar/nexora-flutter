import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Send, X, ArrowUpRight, Bot } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const QUICK_PROMPTS = [
  'Recommend jobs for my skills',
  'Review my profile & PDF resume',
  'How do idea groups & mentors work?',
  'How to share Word or PPT files?',
];

export default function NexoraCopilot({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${user?.fullName?.split(' ')[0] || 'there'}! I'm **Nexora AI**, your side copilot. Ask me to recommend matching opportunities, audit your PDF resume, or guide you through teams & messaging.`,
      actions: [],
    },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!open) return null;

  const sendPrompt = async (text) => {
    const promptText = (text || input).trim();
    if (!promptText || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: promptText }]);
    if (!text) setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/copilot', {
        message: promptText,
        currentPage: location.pathname,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply, actions: data.actions || [] },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I had trouble reaching Nexora AI. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatLine = (text) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={i} className="font-semibold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  };

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nexora AI Copilot</h3>
            <p className="text-[11px] text-emerald-700 font-medium">Live Career & Civic Assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          title="Close Copilot"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            onClick={() => sendPrompt(qp)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
              {m.role === 'assistant' && <Bot size={12} className="text-emerald-600" />}
              <span>{m.role === 'assistant' ? 'Nexora AI' : 'You'}</span>
            </div>
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed max-w-[92%] ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}
            >
              {m.role === 'user' ? m.text : formatLine(m.text)}
            </div>
            {m.actions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.actions.map((act) => (
                  <button
                    key={act.path}
                    onClick={() => navigate(act.path)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  >
                    {act.label}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Nexora AI is thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendPrompt();
        }}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Nexora AI anything…"
          className="input py-2 text-xs flex-1"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
