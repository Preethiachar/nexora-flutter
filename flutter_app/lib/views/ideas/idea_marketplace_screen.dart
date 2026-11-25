import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class IdeaMarketplaceScreen extends StatefulWidget {
  const IdeaMarketplaceScreen({super.key});

  @override
  State<IdeaMarketplaceScreen> createState() => _IdeaMarketplaceScreenState();
}

class _IdeaMarketplaceScreenState extends State<IdeaMarketplaceScreen> {
  List<dynamic> ideas = [];
  bool _loading = true;
  String _searchQuery = '';
  String? _selectedDomain;

  @override
  void initState() {
    super.initState();
    _fetchIdeas();
  }

  Future<void> _fetchIdeas() async {
    setState(() => _loading = true);
    try {
      final fetched = await ApiService.fetchIdeas(
        domain: _selectedDomain,
        search: _searchQuery.isEmpty ? null : _searchQuery,
      );
      setState(() { ideas = fetched; });
    } catch (e) {/* ignore */} finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  static const Map<String, String> domainEmojis = {
    'environment': '🌿', 'education': '📚', 'health': '🏥',
    'governance': '🏛️', 'technology': '💻', 'social-impact': '🤝', 'other': '🔵',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Idea Marketplace'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: NexoraTheme.emerald600),
            onPressed: () => context.go('/ideas/new'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search + filter
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (val) { _searchQuery = val; _fetchIdeas(); },
                    decoration: const InputDecoration(
                      hintText: 'Search ideas…',
                      prefixIcon: Icon(Icons.search, color: NexoraTheme.slate400),
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String?>(
                  icon: const Icon(Icons.tune, color: NexoraTheme.slate400),
                  color: Colors.white,
                  onSelected: (val) { setState(() => _selectedDomain = val); _fetchIdeas(); },
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: null, child: Text('All Domains')),
                    ...domainEmojis.entries.map((e) =>
                        PopupMenuItem(value: e.key, child: Text('${e.value} ${e.key}'))),
                  ],
                ),
              ],
            ),
          ),

          // Ideas list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600))
                : ideas.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.lightbulb_outline, size: 56, color: NexoraTheme.slate700),
                            const SizedBox(height: 12),
                            const Text('No ideas found', style: TextStyle(color: NexoraTheme.slate700, fontSize: 18, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 20),
                            ElevatedButton.icon(
                              onPressed: () => context.go('/ideas/new'),
                              icon: const Icon(Icons.add),
                              label: const Text('Launch an Idea'),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchIdeas,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: ideas.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (ctx, i) {
                            final idea = ideas[i];
                            final domain = idea['domain'] ?? 'other';
                            final emoji = domainEmojis[domain] ?? '🔵';
                            final acceptedCount = (idea['members'] as List?)
                                ?.where((m) => m['status'] == 'accepted')
                                .length ?? 0;
                            final skills = (idea['requiredSkills'] as List?) ?? [];

                            return Card(
                              child: InkWell(
                                onTap: () => context.go('/ideas/${idea['_id']}'),
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Chip(
                                            label: Text('$emoji ${domain.replaceAll('-', ' ')}', style: const TextStyle(fontSize: 11)),
                                            padding: EdgeInsets.zero,
                                          ),
                                          const Spacer(),
                                          if (idea['mentor'] != null)
                                            const Chip(
                                              label: Text('🎓 Mentored', style: TextStyle(fontSize: 11, color: NexoraTheme.amber600)),
                                              padding: EdgeInsets.zero,
                                              backgroundColor: Color(0xFFFFFBEB),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(idea['title'] ?? '',
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: NexoraTheme.slate900)),
                                      const SizedBox(height: 6),
                                      Text(idea['description'] ?? '',
                                          maxLines: 2, overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(color: NexoraTheme.slate400, fontSize: 13, height: 1.4)),
                                      if (skills.isNotEmpty) ...[
                                        const SizedBox(height: 10),
                                        Wrap(
                                          spacing: 6,
                                          children: skills.take(4).map((s) =>
                                              Chip(label: Text(s.toString(), style: const TextStyle(fontSize: 11)),
                                                  padding: EdgeInsets.zero)).toList(),
                                        ),
                                      ],
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          const Icon(Icons.groups_outlined, size: 16, color: NexoraTheme.slate400),
                                          const SizedBox(width: 4),
                                          Text('$acceptedCount/${idea['teamSlots']} slots',
                                              style: const TextStyle(color: NexoraTheme.slate400, fontSize: 12)),
                                          const Spacer(),
                                          const Icon(Icons.chevron_right, color: NexoraTheme.emerald600),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
