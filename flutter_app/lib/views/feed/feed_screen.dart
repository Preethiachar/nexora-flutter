import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<dynamic> posts = [];
  bool _loading = true;
  final _postCtrl = TextEditingController();
  String _postType = 'general';
  bool _posting = false;

  @override
  void initState() {
    super.initState();
    _fetchFeed();
  }

  Future<void> _fetchFeed() async {
    try {
      final p = await ApiService.fetchFeed();
      setState(() { posts = p; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _createPost() async {
    if (_postCtrl.text.trim().isEmpty) return;
    setState(() => _posting = true);
    try {
      // Posts arrive via socket in production; for now refetch
      await _fetchFeed();
      _postCtrl.clear();
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  static const Map<String, String> typeIcons = {
    'general': '📝',
    'milestone': '🏆',
    'announcement': '📢',
    'volunteer': '🤝',
    'idea-launch': '💡',
  };

  @override
  Widget build(BuildContext context) {
    final currentUser = AuthService.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Civic Feed')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600))
          : RefreshIndicator(
              onRefresh: _fetchFeed,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: posts.length + 1,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (ctx, i) {
                  if (i == 0) return _buildCompose(currentUser);
                  final post = posts[i - 1];
                  return _buildPostCard(post);
                },
              ),
            ),
    );
  }

  Widget _buildCompose(Map<String, dynamic>? user) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: NexoraTheme.emerald50,
                  child: Text((user?['fullName'] ?? '?')[0].toUpperCase(),
                      style: const TextStyle(color: NexoraTheme.emerald600, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _postType,
                    dropdownColor: Colors.white,
                    isDense: true,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: NexoraTheme.slate700)),
                    ),
                    items: typeIcons.entries.map((e) =>
                        DropdownMenuItem(value: e.key, child: Text('${e.value} ${e.key[0].toUpperCase()}${e.key.substring(1)}'))).toList(),
                    onChanged: (val) => setState(() => _postType = val!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _postCtrl,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Share a civic update, milestone, or idea launch…'),
            ),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: _posting ? null : _createPost,
                icon: const Icon(Icons.send, size: 16),
                label: Text(_posting ? 'Posting…' : 'Post'),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPostCard(dynamic post) {
    final typeIcon = typeIcons[post['type']] ?? '📝';
    final likesCount = (post['likes'] as List?)?.length ?? 0;
    final commentsCount = (post['comments'] as List?)?.length ?? 0;
    final author = post['author'] ?? {};
    final tags = (post['tags'] as List?) ?? [];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: NexoraTheme.emerald50,
                  child: Text((author['fullName'] ?? '?')[0].toUpperCase(),
                      style: const TextStyle(color: NexoraTheme.emerald600, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Text(author['fullName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900, fontSize: 14)),
                        const SizedBox(width: 6),
                        Text(typeIcon, style: const TextStyle(fontSize: 14)),
                      ]),
                      Text(author['headline'] ?? author['role'] ?? '',
                          style: const TextStyle(color: NexoraTheme.slate400, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(post['content'] ?? '', style: const TextStyle(color: NexoraTheme.slate700, fontSize: 14, height: 1.5)),
            if (tags.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                children: tags.map((t) => Chip(
                  label: Text('#$t', style: const TextStyle(fontSize: 11, color: NexoraTheme.emerald600)),
                  backgroundColor: NexoraTheme.emerald50,
                  padding: EdgeInsets.zero,
                  side: const BorderSide(color: Color(0xFF047857)),
                )).toList(),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.favorite_border, size: 20, color: NexoraTheme.slate400),
                  onPressed: () => ApiService.likePost(post['_id']).then((_) => _fetchFeed()),
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                ),
                const SizedBox(width: 4),
                Text('$likesCount', style: const TextStyle(color: NexoraTheme.slate400, fontSize: 13)),
                const SizedBox(width: 16),
                const Icon(Icons.comment_outlined, size: 20, color: NexoraTheme.slate400),
                const SizedBox(width: 4),
                Text('$commentsCount', style: const TextStyle(color: NexoraTheme.slate400, fontSize: 13)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
