import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/auth_service.dart';
import '../../services/socket_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      await AuthService.login(_emailCtrl.text.trim(), _passwordCtrl.text);
      SocketService.connect();
      if (mounted) context.go('/jobs');
    } catch (e) {
      setState(() { _error = 'Invalid credentials. Please register if you are a new user.'; });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 56),
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: NexoraTheme.emerald600,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.bolt, color: Colors.white, size: 34),
              ),
              const SizedBox(height: 20),
              const Text('Welcome to Nexora',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: NexoraTheme.slate900)),
              const SizedBox(height: 6),
              const Text('Sign in to explore jobs, ideas, and teams',
                  style: TextStyle(fontSize: 14, color: NexoraTheme.slate500)),
              const SizedBox(height: 36),

              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: NexoraTheme.red600, size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Text(_error!, style: const TextStyle(color: NexoraTheme.red600, fontSize: 13))),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'Email address',
                  prefixIcon: Icon(Icons.email_outlined, color: NexoraTheme.slate400),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _passwordCtrl,
                obscureText: true,
                onSubmitted: (_) => _login(),
                decoration: const InputDecoration(
                  hintText: 'Password',
                  prefixIcon: Icon(Icons.lock_outline, color: NexoraTheme.slate400),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _login,
                  child: _loading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Sign In'),
                ),
              ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () => context.go('/register'),
                child: const Text('New to Nexora? Create your account',
                    style: TextStyle(color: NexoraTheme.emerald600, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
