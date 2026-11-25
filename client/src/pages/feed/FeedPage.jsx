import { useState, useEffect } from 'react';
import { Rss, Heart, MessageCircle, Send } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import Avatar from '../../components/Avatar';

const POST_TYPE_ICONS = {
  general: '📝',
  milestone: '🏆',
  announcement: '📢',
  volunteer: '🤝',
  'idea-launch': '💡',
};

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [posting, setPosting] = useState(false);
  const [commentContent, setCommentContent] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    api.get('/feed').then(({ data }) => setPosts(data.posts || [])).finally(() => setLoading(false));

    const socket = getSocket();
    const onPost = (post) => setPosts((prev) => [post, ...prev]);
    socket?.on('new_feed_post', onPost);
    return () => socket?.off('new_feed_post', onPost);
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post('/feed', { content, type: postType });
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await api.post(`/feed/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likes: data.liked ? [...p.likes, user._id] : p.likes.filter((id) => id !== user._id) }
            : p
        )
      );
    } catch { /* ignore */ }
  };

  const handleComment = async (postId) => {
    const c = commentContent[postId];
    if (!c?.trim()) return;
    try {
      const { data } = await api.post(`/feed/${postId}/comment`, { content: c });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: [...p.comments, data.comment] } : p))
      );
      setCommentContent((prev) => ({ ...prev, [postId]: '' }));
    } catch { /* ignore */ }
  };

  const isLiked = (post) => post.likes?.some((id) => id === user?._id || id?._id === user?._id);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Rss className="text-emerald-600" size={26} />
          Civic Feed
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Milestones, announcements, and civic innovations from your network
        </p>
      </div>

      <div className="card">
        <form onSubmit={handlePost} className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="sm" />
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="input py-1.5 text-sm w-auto"
            >
              <option value="general">📝 General</option>
              <option value="milestone">🏆 Milestone</option>
              <option value="announcement">📢 Announcement</option>
              <option value="volunteer">🤝 Volunteer</option>
              <option value="idea-launch">💡 Idea Launch</option>
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a civic update, milestone, or announcement…"
            className="input resize-none h-24 bg-slate-50"
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary flex items-center gap-2 px-5 text-sm" disabled={posting || !content.trim()}>
              <Send size={15} />
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <Rss size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No posts yet. Share the first civic update!</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="card space-y-4">
            <div className="flex items-center gap-3">
              <Avatar user={post.author} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{post.author?.fullName}</span>
                  <span className="badge badge-slate text-xs capitalize">{post.author?.role}</span>
                  <span className="text-base">{POST_TYPE_ICONS[post.type] || '📝'}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed text-sm">{post.content}</p>

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="badge badge-emerald text-xs">#{t}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleLike(post._id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  isLiked(post) ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <Heart size={16} fill={isLiked(post) ? 'currentColor' : 'none'} />
                {post.likes?.length || 0}
              </button>
              <button
                onClick={() => setExpandedComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <MessageCircle size={16} />
                {post.comments?.length || 0}
              </button>
            </div>

            {expandedComments[post._id] && (
              <div className="space-y-3 pt-1">
                {post.comments?.map((c, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Avatar user={c.user} size="xs" />
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <span className="text-xs font-bold text-slate-800">{c.user?.fullName}</span>
                      <p className="text-xs text-slate-600 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={commentContent[post._id] || ''}
                    onChange={(e) => setCommentContent((prev) => ({ ...prev, [post._id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                    placeholder="Add a comment…"
                    className="input text-sm py-2 flex-1"
                  />
                  <button onClick={() => handleComment(post._id)} className="btn-primary px-3">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
