import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

class IdeaDetailScreen extends StatefulWidget {
  final String ideaId;
  const IdeaDetailScreen({super.key, required this.ideaId});

  @override
  State<IdeaDetailScreen> createState() => _IdeaDetailScreenState();
}

class _IdeaDetailScreenState extends State<IdeaDetailScreen> {
  Map<String, dynamic>? _idea;
  List<dynamic> _mentors = [];
  bool _loading = true;
  bool _actionLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final results = await Future.wait([
        ApiService.fetchIdeaDetail(widget.ideaId),
        ApiService.fetchMentors(),
      ]);
      setState(() {
        _idea = results[0] as Map<String, dynamic>;
        _mentors = results[1] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _applyToIdea() async {
    setState(() => _actionLoading = true);
    try {
      await ApiService.applyToIdea(widget.ideaId);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Application submitted!'), backgroundColor: NexoraTheme.emerald50));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')));
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  void _showMentorPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: NexoraTheme.slate900,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _MentorPickerSheet(
        mentors: _mentors,
        currentMentorId: (_idea?['mentor'] as Map?)?['_id'],
        onSelect: (mentorId) async {
          Navigator.pop(ctx);
          setState(() => _actionLoading = true);
          try {
            await ApiService.assignMentor(widget.ideaId, mentorId);
            await _fetchData();
          } catch (e) {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Failed to assign mentor')));
          } finally {
            if (mounted) setState(() => _actionLoading = false);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600)));
    if (_idea == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Idea not found')));

    final currentUserId = AuthService.currentUser?['_id'];
    final isAuthor = (_idea!['author'] as Map?)?['_id'] == currentUserId;
    final mentor = _idea!['mentor'] as Map?;
    final acceptedMembers = (_idea!['members'] as List?)?.where((m) => m['status'] == 'accepted').toList() ?? [];
    final pendingMembers = (_idea!['members'] as List?)?.where((m) => m['status'] == 'pending').toList() ?? [];
    final skills = (_idea!['requiredSkills'] as List?) ?? [];
    final groupId = _idea!['groupId'];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/ideas')),
        title: Text(_idea!['title'] ?? '', overflow: TextOverflow.ellipsis),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Domain + status
            Wrap(spacing: 8, children: [
              Chip(label: Text(_idea!['domain'] ?? ''), padding: EdgeInsets.zero),
              Chip(label: Text(_idea!['status'] ?? ''), padding: EdgeInsets.zero),
            ]),
            const SizedBox(height: 14),

            // Description
            Text(_idea!['description'] ?? '', style: const TextStyle(color: NexoraTheme.slate700, fontSize: 14, height: 1.6)),
            const SizedBox(height: 16),

            // Skills
            if (skills.isNotEmpty) ...[
              const Text('Required Skills', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900, fontSize: 14)),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 6, children: skills.map((s) => Chip(label: Text(s.toString()), padding: EdgeInsets.zero)).toList()),
              const SizedBox(height: 16),
            ],

            // Team slots
            Row(children: [
              const Icon(Icons.groups_outlined, color: NexoraTheme.emerald600, size: 20),
              const SizedBox(width: 8),
              Text('${acceptedMembers.length} / ${_idea!['teamSlots']} team slots',
                  style: const TextStyle(color: NexoraTheme.slate700, fontWeight: FontWeight.w600)),
              if (groupId != null) ...[
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: () => context.go('/groups/$groupId?name=${Uri.encodeComponent(_idea!['title'] ?? 'Group')}'),
                  icon: const Icon(Icons.forum_outlined, size: 16),
                  label: const Text('Open Chat'),
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                ),
              ],
            ]),
            const SizedBox(height: 16),

            // Mentor section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.school, color: NexoraTheme.amber600, size: 20),
                        const SizedBox(width: 8),
                        const Text('Project Mentor', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.amber600, fontSize: 15)),
                        if (isAuthor) ...[
                          const Spacer(),
                          OutlinedButton(
                            onPressed: _showMentorPicker,
                            child: Text(mentor != null ? 'Change' : 'Assign Mentor'),
                            style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 10),
                    mentor != null
                        ? Row(children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xFF78350F),
                              child: Text((mentor['fullName'] ?? '?')[0].toUpperCase(),
                                  style: const TextStyle(color: NexoraTheme.amber600, fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(width: 10),
                            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(mentor['fullName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900)),
                              Text(mentor['headline'] ?? 'Industry Expert', style: const TextStyle(color: NexoraTheme.slate400, fontSize: 12)),
                            ]),
                          ])
                        : const Text('No mentor assigned.', style: TextStyle(color: NexoraTheme.slate400)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Pending applicants (author only)
            if (isAuthor && pendingMembers.isNotEmpty) ...[
              Text('Pending Applications (${pendingMembers.length})',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900, fontSize: 15)),
              const SizedBox(height: 8),
              ...pendingMembers.map((m) => _ApplicantTile(
                member: m,
                ideaId: widget.ideaId,
                onAction: (_) => _fetchData(),
              )),
              const SizedBox(height: 14),
            ],

            // Apply button (non-author students)
            if (!isAuthor && AuthService.currentUser?['role'] == 'student')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _actionLoading ? null : _applyToIdea,
                  child: _actionLoading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Apply to Join Team'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ApplicantTile extends StatelessWidget {
  final dynamic member;
  final String ideaId;
  final Function(String) onAction;

  const _ApplicantTile({required this.member, required this.ideaId, required this.onAction});

  @override
  Widget build(BuildContext context) {
    final user = member['user'] ?? {};
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: NexoraTheme.slate700,
          child: Text((user['fullName'] ?? '?')[0].toUpperCase()),
        ),
        title: Text(user['fullName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: NexoraTheme.slate900)),
        subtitle: Text(user['headline'] ?? '', style: const TextStyle(fontSize: 12, color: NexoraTheme.slate400)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.check_circle, color: NexoraTheme.emerald600),
              onPressed: () async {
                await ApiService.reviewApplicant(ideaId, user['_id'], 'accept');
                onAction('accepted');
              },
            ),
            IconButton(
              icon: const Icon(Icons.cancel, color: NexoraTheme.red600),
              onPressed: () async {
                await ApiService.reviewApplicant(ideaId, user['_id'], 'reject');
                onAction('rejected');
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _MentorPickerSheet extends StatelessWidget {
  final List<dynamic> mentors;
  final String? currentMentorId;
  final Function(String) onSelect;

  const _MentorPickerSheet({required this.mentors, this.currentMentorId, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Verified Mentor', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: NexoraTheme.slate900)),
          const SizedBox(height: 4),
          const Text('Mentors validate civic hours and guide your team milestones.',
              style: TextStyle(fontSize: 12, color: NexoraTheme.slate400)),
          const SizedBox(height: 16),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: mentors.length,
              separatorBuilder: (_, __) => const Divider(color: Colors.white),
              itemBuilder: (ctx, i) {
                final mentor = mentors[i];
                final isAssigned = mentor['_id'] == currentMentorId;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF78350F),
                    child: Text(mentor['fullName'][0].toUpperCase(),
                        style: const TextStyle(color: NexoraTheme.amber600, fontWeight: FontWeight.w700)),
                  ),
                  title: Text(mentor['fullName'], style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900, fontSize: 14)),
                  subtitle: Text(mentor['headline'] ?? 'Industry Expert', style: const TextStyle(color: NexoraTheme.slate400, fontSize: 12)),
                  trailing: ElevatedButton(
                    onPressed: isAssigned ? null : () => onSelect(mentor['_id']),
                    child: Text(isAssigned ? '✓ Assigned' : 'Assign'),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
