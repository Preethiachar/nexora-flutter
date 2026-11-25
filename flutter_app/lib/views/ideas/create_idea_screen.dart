import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class CreateIdeaScreen extends StatefulWidget {
  const CreateIdeaScreen({super.key});

  @override
  State<CreateIdeaScreen> createState() => _CreateIdeaScreenState();
}

class _CreateIdeaScreenState extends State<CreateIdeaScreen> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _skillInput = TextEditingController();
  String _domain = 'technology';
  int _teamSlots = 4;
  List<String> _skills = [];
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (_titleCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Title and description are required.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.createIdea({
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'domain': _domain,
        'teamSlots': _teamSlots,
        'requiredSkills': _skills,
      });
      if (mounted) context.go('/ideas');
    } catch (e) {
      setState(() => _error = 'Failed to create idea. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  static const domains = [
    'environment', 'education', 'health', 'governance', 'technology', 'social-impact', 'other',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Launch a Civic Idea'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/ideas')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: const Color(0xFF7F1D1D).withOpacity(0.3), borderRadius: BorderRadius.circular(12)),
                child: Text(_error!, style: const TextStyle(color: NexoraTheme.red600)),
              ),
              const SizedBox(height: 16),
            ],

            _label('Idea Title *'),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'e.g. Community Solar Microgrids for Rural Schools')),
            const SizedBox(height: 14),

            _label('Description *'),
            TextField(controller: _descCtrl, maxLines: 5, decoration: const InputDecoration(hintText: 'Describe the problem, solution, and civic impact…')),
            const SizedBox(height: 14),

            _label('Domain'),
            DropdownButtonFormField<String>(
              value: _domain,
              dropdownColor: Colors.white,
              decoration: InputDecoration(filled: true, fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: NexoraTheme.slate700))),
              items: domains.map((d) => DropdownMenuItem(value: d, child: Text(d.replaceAll('-', ' ').toUpperCase()))).toList(),
              onChanged: (val) => setState(() => _domain = val!),
            ),
            const SizedBox(height: 14),

            _label('Team Slots (1–20)'),
            Slider(
              value: _teamSlots.toDouble(),
              min: 1,
              max: 20,
              divisions: 19,
              activeColor: NexoraTheme.emerald600,
              label: _teamSlots.toString(),
              onChanged: (val) => setState(() => _teamSlots = val.round()),
            ),
            Center(child: Text('$_teamSlots slots', style: const TextStyle(color: NexoraTheme.emerald600, fontWeight: FontWeight.w700))),
            const SizedBox(height: 14),

            _label('Required Skills'),
            Row(children: [
              Expanded(child: TextField(controller: _skillInput, decoration: const InputDecoration(hintText: 'e.g. React, GIS, Policy Design'))),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  final s = _skillInput.text.trim();
                  if (s.isNotEmpty && !_skills.contains(s)) {
                    setState(() { _skills.add(s); });
                    _skillInput.clear();
                  }
                },
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14)),
                child: const Icon(Icons.add, size: 20),
              ),
            ]),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: _skills.map((s) => Chip(
                label: Text(s),
                deleteIcon: const Icon(Icons.close, size: 14),
                onDeleted: () => setState(() => _skills.remove(s)),
                padding: EdgeInsets.zero,
              )).toList(),
            ),
            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('🚀 Launch Idea'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate700, fontSize: 13)),
  );
}
