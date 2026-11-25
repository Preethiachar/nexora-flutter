import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  List<dynamic> jobs = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _fetchJobs();
  }

  Future<void> _fetchJobs() async {
    setState(() => _loading = true);
    try {
      final list = await ApiService.fetchJobs(search: _search.isEmpty ? null : _search);
      setState(() => jobs = list);
    } catch (_) {
      /* ignore */
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _apply(String jobId, String title) async {
    try {
      final res = await ApiService.applyToJob(jobId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Applied to $title! Match score: ${res['matchScore']}%')),
        );
        _fetchJobs();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Already applied or unable to apply')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Opportunities'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bolt, color: NexoraTheme.emerald600),
            onPressed: () => context.go('/ats'),
            tooltip: 'AI ATS Scanner',
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (v) {
                _search = v;
                _fetchJobs();
              },
              decoration: const InputDecoration(
                hintText: 'Search jobs, NGOs, or skills…',
                prefixIcon: Icon(Icons.search, color: NexoraTheme.slate400),
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600))
                : jobs.isEmpty
                    ? const Center(child: Text('No job opportunities found', style: TextStyle(color: NexoraTheme.slate500)))
                    : RefreshIndicator(
                        onRefresh: _fetchJobs,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: jobs.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (ctx, i) {
                            final job = jobs[i];
                            final skills = (job['requiredSkills'] as List?) ?? [];
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(job['title'] ?? '',
                                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: NexoraTheme.slate900)),
                                        ),
                                        Chip(label: Text(job['type'] ?? ''), padding: EdgeInsets.zero),
                                      ],
                                    ),
                                    Text('${job['organization'] ?? ''} · ${job['location'] ?? 'Remote'}',
                                        style: const TextStyle(color: NexoraTheme.slate500, fontSize: 12)),
                                    const SizedBox(height: 8),
                                    Text(job['description'] ?? '',
                                        maxLines: 3, overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: NexoraTheme.slate700, fontSize: 13)),
                                    if (skills.isNotEmpty) ...[
                                      const SizedBox(height: 10),
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 4,
                                        children: skills.take(4).map((s) => Chip(label: Text(s.toString()), padding: EdgeInsets.zero)).toList(),
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(job['compensation'] ?? '', style: const TextStyle(color: NexoraTheme.emerald600, fontWeight: FontWeight.w600, fontSize: 12)),
                                        ElevatedButton(
                                          onPressed: () => _apply(job['_id'], job['title'] ?? ''),
                                          child: const Text('Apply'),
                                          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)),
                                        ),
                                      ],
                                    ),
                                  ],
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
