import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Paperclip, Download, FileText, Presentation, File,
  Users, Clock, FolderOpen, UserPlus, X, Search
} from 'lucide-react';
import api from '../../services/api';
import { getSocket, joinGroup, leaveGroup, emitTyping } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

const FILE_BADGES = {
  pdf: { label: 'PDF', icon: FileText, color: 'text-red-600', bg: 'bg-red-50 border-red-200', tagBg: 'bg-red-100 text-red-700' },
  word: { label: 'WORD', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', tagBg: 'bg-blue-100 text-blue-700' },
  ppt: { label: 'PPT', icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', tagBg: 'bg-orange-100 text-orange-700' },
  other: { label: 'FILE', icon: File, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', tagBg: 'bg-slate-200 text-slate-700' },
};

export default function GroupChatPage() {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(null);
  const [showFilesDrawer, setShowFilesDrawer] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const messagesEndRef = useRef(null);
  const anyDocInputRef = useRef(null);
  const wordInputRef = useRef(null);
  const pptInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      const { data } = await api.get(`/messages/groups/${groupId}/files`);
      setSharedFiles(data.files || []);
    } catch { /* ignore */ }
  }, [groupId]);

  useEffect(() => {
    const fetchData = async () => {
      const [groupRes, msgRes] = await Promise.all([
        api.get(`/messages/groups/${groupId}`),
        api.get(`/messages/groups/${groupId}/messages`),
      ]);
      setGroup(groupRes.data.group);
      setMessages(msgRes.data.messages || []);
      loadFiles();
    };
    fetchData();

    joinGroup(groupId);
    const socket = getSocket();

    const onNewMsg = (msg) => {
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      if (msg.fileUrl) loadFiles();
    };
    const onTyping = (data) => {
      if (data.userId !== user?._id) {
        setTyping(data.userName);
        setTimeout(() => setTyping(null), 2000);
      }
    };

    socket?.on('new_message', onNewMsg);
    socket?.on('user_typing', onTyping);

    return () => {
      leaveGroup(groupId);
      socket?.off('new_message', onNewMsg);
      socket?.off('user_typing', onTyping);
    };
  }, [groupId, loadFiles, user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (memberQuery.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await api.get(`/messages/users/lookup?q=${encodeURIComponent(memberQuery)}`);
      setMemberResults(data.users || []);
    }, 250);
    return () => clearTimeout(t);
  }, [memberQuery]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/messages/groups/${groupId}/send`, { content });
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowShareMenu(false);
    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    try {
      await api.post(`/messages/groups/${groupId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadFiles();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed (allowed: Word, PPT, PDF up to 15 MB)');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const { data } = await api.post(`/messages/groups/${groupId}/members`, { userId });
      setGroup(data.group);
      setShowAddMember(false);
      setMemberQuery('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const renderFileMsg = (msg) => {
    const fi = FILE_BADGES[msg.fileType] || FILE_BADGES.other;
    const Icon = fi.icon;
    return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${fi.bg} max-w-xs shadow-sm`}>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
          <Icon size={20} className={fi.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{msg.fileName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fi.tagBg}`}>{fi.label}</span>
            <span className="text-xs text-slate-500">{msg.fileSize}</span>
          </div>
        </div>
        <a
          href={msg.fileUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="p-2 rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Download / Open"
        >
          <Download size={16} />
        </a>
      </div>
    );
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] -m-6 bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-slate-200">
        <Link to="/groups" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-900 truncate">{group.name}</h2>
          <p className="text-xs text-slate-500">
            {group.members?.length} members · Word (.docx), PowerPoint (.pptx) & PDF sharing enabled
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex -space-x-2 mr-1">
            {group.members?.slice(0, 4).map((m) => (
              <Avatar key={m.user?._id} user={m.user} size="xs" className="ring-2 ring-white" />
            ))}
          </div>

          <button
            onClick={() => setShowAddMember(true)}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <UserPlus size={14} /> Add
          </button>

          <button
            onClick={() => setShowFilesDrawer(!showFilesDrawer)}
            className={`text-xs py-1.5 px-3 rounded-xl border font-medium flex items-center gap-1.5 transition-colors ${
              showFilesDrawer
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FolderOpen size={14} />
            Files ({sharedFiles.length})
          </button>
        </div>
      </div>

      {/* Body + Optional Shared Files Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Users size={40} className="mx-auto mb-3 text-slate-300" />
                <p>No messages yet. Start collaborating and sharing Word, PPT, or PDF files!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMine = (msg.sender?._id || msg.sender) === user?._id;
              return (
                <div key={msg._id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <Avatar user={msg.sender} size="sm" />
                  <div className={`max-w-md space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`flex items-center gap-2 text-xs text-slate-400 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <span className="font-semibold text-slate-600">{msg.sender?.fullName}</span>
                      <Clock size={11} />
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {msg.fileUrl ? (
                      renderFileMsg(msg)
                    ) : (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="text-xs text-slate-500 italic">{typing} is typing…</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {uploading && (
            <div className="px-6 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-700">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-emerald-600" />
              Uploading document…
            </div>
          )}

          {/* Hidden specialized file inputs */}
          <input type="file" ref={anyDocInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" />
          <input type="file" ref={wordInputRef} onChange={handleFileUpload} accept=".doc,.docx" className="hidden" />
          <input type="file" ref={pptInputRef} onChange={handleFileUpload} accept=".ppt,.pptx" className="hidden" />
          <input type="file" ref={pdfInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />

          {/* Quick Share Bar + Message Input */}
          <div className="bg-white border-t border-slate-200 px-6 py-3 space-y-2 relative">
            {/* Explicit Word / PPT / PDF quick-share buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Share Docs:</span>
              <button
                type="button"
                onClick={() => wordInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <FileText size={13} /> Word (.doc/.docx)
              </button>
              <button
                type="button"
                onClick={() => pptInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <Presentation size={13} /> PowerPoint (.ppt/.pptx)
              </button>
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <FileText size={13} /> PDF (.pdf)
              </button>
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => anyDocInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                title="Attach any Word, PowerPoint, or PDF file"
              >
                <Paperclip size={19} />
              </button>
              <input
                type="text"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  emitTyping(groupId, user?._id, user?.fullName);
                }}
                placeholder="Write a message or share Word, PPT, PDF files…"
                className="input py-2.5 text-sm flex-1 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!content.trim() || sending}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>

        {/* Shared Files Drawer */}
        {showFilesDrawer && (
          <div className="w-72 border-l border-slate-200 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Shared Word / PPT / PDF</h3>
              <button onClick={() => setShowFilesDrawer(false)} className="text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {sharedFiles.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No documents shared yet.</p>
              ) : (
                sharedFiles.map((f) => {
                  const fi = FILE_BADGES[f.fileType] || FILE_BADGES.other;
                  const Icon = fi.icon;
                  return (
                    <a
                      key={f._id}
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-colors"
                    >
                      <Icon size={18} className={fi.color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{f.fileName}</p>
                        <p className="text-[11px] text-slate-500">
                          {fi.label} · {f.fileSize} · {f.sender?.fullName?.split(' ')[0]}
                        </p>
                      </div>
                      <Download size={14} className="text-emerald-600" />
                    </a>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Add Member to Group</h3>
              <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="input pl-9 py-2 text-sm"
              />
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
              {memberResults.map((u) => (
                <div key={u._id} className="flex items-center gap-2.5 py-2">
                  <Avatar user={u} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{u.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddMember(u._id)}
                    className="btn-primary text-xs py-1 px-2.5"
                  >
                    Add
                  </button>
                </div>
              ))}
              {memberQuery.length >= 2 && memberResults.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No matching users found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
