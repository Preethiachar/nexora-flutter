import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class GroupsListScreen extends StatefulWidget {
  const GroupsListScreen({super.key});

  @override
  State<GroupsListScreen> createState() => _GroupsListScreenState();
}

class _GroupsListScreenState extends State<GroupsListScreen> {
  List<dynamic> groups = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchGroups();
  }

  Future<void> _fetchGroups() async {
    try {
      final g = await ApiService.fetchGroups();
      setState(() { groups = g; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Collaboration Groups')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600))
          : groups.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.groups_outlined, size: 64, color: NexoraTheme.slate700),
                      const SizedBox(height: 16),
                      const Text('No groups yet', style: TextStyle(color: NexoraTheme.slate700, fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      const Text('Apply to an idea and get accepted\nto join a collaboration group.',
                          textAlign: TextAlign.center, style: TextStyle(color: NexoraTheme.slate400)),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        onPressed: () => context.go('/ideas'),
                        icon: const Icon(Icons.lightbulb_outline),
                        label: const Text('Browse Ideas'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchGroups,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: groups.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final group = groups[i];
                      final membersCount = (group['members'] as List?)?.length ?? 0;
                      return Card(
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: NexoraTheme.emerald50,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.forum_outlined, color: NexoraTheme.emerald600),
                          ),
                          title: Text(group['name'] ?? '',
                              style: const TextStyle(color: NexoraTheme.slate900, fontWeight: FontWeight.w700)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(group['idea']?['title'] ?? '',
                                  style: const TextStyle(color: NexoraTheme.slate400, fontSize: 12)),
                              const SizedBox(height: 4),
                              Text('$membersCount members',
                                  style: const TextStyle(color: NexoraTheme.emerald600, fontSize: 12)),
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right, color: NexoraTheme.slate400),
                          onTap: () => context.go(
                            '/groups/${group['_id']}?name=${Uri.encodeComponent(group['name'] ?? 'Group Chat')}',
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
