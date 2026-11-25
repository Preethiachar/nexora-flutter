import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class ATSScreen extends StatefulWidget {
  const ATSScreen({super.key});

  @override
  State<ATSScreen> createState() => _ATSScreenState();
}

class _ATSScreenState extends State<ATSScreen> {
  final _resumeCtrl = TextEditingController();
  final _jobCtrl = TextEditingController();
  Map<String, dynamic>? _result;
  bool _loading = false;
  String? _error;

  Future<void> _scanResume() async {
    if (_resumeCtrl.text.trim().isEmpty || _jobCtrl.text.trim().isEmpty) {
      setState(() { _error = 'Both fields are required.'; });
      return;
    }
    setState(() { _loading = true; _error = null; _result = null; });
    try {
      final result = await ApiService.scanResume(_resumeCtrl.text.trim(), _jobCtrl.text.trim());
      setState(() { _result = result; });
    } catch (e) {
      setState(() { _error = 'Analysis failed. Please check your connection.'; });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.bolt, color: NexoraTheme.emerald600),
            SizedBox(width: 8),
            Text('AI ATS Scanner'),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Paste your resume text and job description to get a transparent keyword match analysis.',
                style: TextStyle(color: NexoraTheme.slate400, fontSize: 13)),
            const SizedBox(height: 20),

            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF7F1D1D).withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFB91C1C).withOpacity(0.5)),
                ),
                child: Text(_error!, style: const TextStyle(color: NexoraTheme.red600)),
              ),
              const SizedBox(height: 16),
            ],

            // Resume input
            const Text('Resume Text', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate700, fontSize: 14)),
            const SizedBox(height: 8),
            TextField(
              controller: _resumeCtrl,
              maxLines: 8,
              decoration: const InputDecoration(
                hintText: 'Paste your complete resume text here, including skills, experience, and civic activities…',
              ),
            ),
            const SizedBox(height: 16),

            const Text('Job / Internship Description', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate700, fontSize: 14)),
            const SizedBox(height: 8),
            TextField(
              controller: _jobCtrl,
              maxLines: 8,
              decoration: const InputDecoration(
                hintText: 'Paste the full job or internship description here…',
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _scanResume,
                icon: _loading
                    ? const SizedBox(height: 18, width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.bolt),
                label: Text(_loading ? 'Analyzing…' : 'Scan Resume'),
              ),
            ),

            // Results
            if (_result != null) ...[
              const SizedBox(height: 28),
              _buildResults(_result!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResults(Map<String, dynamic> result) {
    final score = result['matchScore'] as int;
    final matched = (result['matchedKeywords'] as List?) ?? [];
    final missing = (result['missingKeywords'] as List?) ?? [];
    final advice = result['careerAdvice'] as String? ?? '';
    final improvements = (result['improvements'] as List?) ?? [];

    final scoreColor = score >= 75
        ? NexoraTheme.emerald600
        : score >= 50
            ? NexoraTheme.amber600
            : NexoraTheme.red600;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Score circle
        Center(
          child: Column(
            children: [
              SizedBox(
                width: 140,
                height: 140,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 140,
                      height: 140,
                      child: CircularProgressIndicator(
                        value: score / 100,
                        backgroundColor: Colors.white,
                        color: scoreColor,
                        strokeWidth: 10,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('$score%', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: scoreColor)),
                        const Text('match', style: TextStyle(fontSize: 12, color: NexoraTheme.slate400)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                score >= 75 ? '🌟 Strong Match' : score >= 50 ? '⚡ Good Match' : '🔧 Needs Work',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: NexoraTheme.slate900),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Advice
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Career Advice', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.emerald600, fontSize: 15)),
                const SizedBox(height: 8),
                Text(advice, style: const TextStyle(color: NexoraTheme.slate700, fontSize: 13, height: 1.5)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Matched keywords
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.check_circle, color: NexoraTheme.emerald600, size: 18),
                  const SizedBox(width: 8),
                  Text('Matched Keywords (${matched.length})',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.emerald600, fontSize: 14)),
                ]),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: matched.map((kw) => Chip(
                    label: Text(kw.toString()),
                    backgroundColor: NexoraTheme.emerald50,
                    labelStyle: const TextStyle(color: NexoraTheme.emerald600, fontSize: 12),
                    side: const BorderSide(color: NexoraTheme.emerald200),
                  )).toList(),
                ),
                if (matched.isEmpty)
                  const Text('No keyword matches found.', style: TextStyle(color: NexoraTheme.slate400)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Missing keywords
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.cancel, color: NexoraTheme.red600, size: 18),
                  const SizedBox(width: 8),
                  Text('Missing Keywords (${missing.length})',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.red600, fontSize: 14)),
                ]),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: missing.take(15).map((kw) => Chip(
                    label: Text(kw.toString()),
                    backgroundColor: const Color(0xFFFEF2F2),
                    labelStyle: const TextStyle(color: NexoraTheme.red600, fontSize: 12),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                  )).toList(),
                ),
                if (missing.isEmpty)
                  const Text('🎉 You have all the required keywords!', style: TextStyle(color: NexoraTheme.emerald600)),
              ],
            ),
          ),
        ),

        // Improvement suggestions
        if (improvements.isNotEmpty) ...[
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(children: [
                    Icon(Icons.trending_up, color: NexoraTheme.amber600, size: 18),
                    SizedBox(width: 8),
                    Text('Improvement Suggestions',
                        style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.amber600, fontSize: 14)),
                  ]),
                  const SizedBox(height: 10),
                  ...improvements.take(6).map((imp) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Chip(label: Text(imp['keyword']?.toString() ?? ''), padding: EdgeInsets.zero),
                        const SizedBox(width: 10),
                        Expanded(child: Text(imp['suggestion']?.toString() ?? '',
                            style: const TextStyle(color: NexoraTheme.slate400, fontSize: 12))),
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
