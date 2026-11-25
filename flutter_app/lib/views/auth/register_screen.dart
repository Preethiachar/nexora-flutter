import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _headlineCtrl = TextEditingController();
  final _skillsCtrl = TextEditingController();
  String _role = 'student';
  bool _loading = false;
  String? _error;

  Future<void> _register() async {
    if (_nameCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) return;
    if (_passwordCtrl.text.length < 6) {
      setState(() { _error = 'Password must be at least 6 characters'; });
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await AuthService.register({
        'fullName': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passwordCtrl.text,
        'role': _role,
        'headline': _headlineCtrl.text.trim(),
        'skills': _skillsCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
      });
      if (mounted) context.go('/jobs');
    } catch (e) {
      setState(() { _error = 'Registration failed. Email may already be in use.'; });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Join Nexora'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/login')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Text(_error!, style: const TextStyle(color: NexoraTheme.red600, fontSize: 13)),
                ),
                const SizedBox(height: 16),
              ],

              _label('Full Name *'),
              TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'Alex Johnson')),
              const SizedBox(height: 14),

              _label('Email *'),
              TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(hintText: 'alex@example.com')),
              const SizedBox(height: 14),

              _label('Password *'),
              TextField(controller: _passwordCtrl, obscureText: true,
                  decoration: const InputDecoration(hintText: 'Min. 6 characters')),
              const SizedBox(height: 14),

              _label('Role'),
              DropdownButtonFormField<String>(
                value: _role,
                dropdownColor: Colors.white,
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: NexoraTheme.slate700)),
                ),
                items: const [
                  DropdownMenuItem(value: 'student', child: Text('🎓 Student / Civic Innovator')),
                  DropdownMenuItem(value: 'mentor', child: Text('🌟 Mentor / Expert')),
                  DropdownMenuItem(value: 'recruiter', child: Text('🏢 Recruiter / NGO')),
                ],
                onChanged: (val) => setState(() { _role = val!; }),
              ),
              const SizedBox(height: 14),

              _label('Headline (optional)'),
              TextField(controller: _headlineCtrl,
                  decoration: const InputDecoration(hintText: 'e.g. Urban Sustainability Innovator')),
              const SizedBox(height: 14),

              _label('Skills (comma-separated)'),
              TextField(controller: _skillsCtrl,
                  decoration: const InputDecoration(hintText: 'React, Python, Community Organizing')),
              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _register,
                  child: _loading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Create Account'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: NexoraTheme.slate700)),
  );
}
