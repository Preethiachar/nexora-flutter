import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  int _locationToIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/jobs')) return 0;
    if (location.startsWith('/ideas')) return 1;
    if (location.startsWith('/groups')) return 2;
    if (location.startsWith('/ats')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _openCopilot(BuildContext context) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        String reply = 'Hi! I am Nexora AI Copilot. Ask me to recommend jobs, review your PDF resume, or explain group collaboration.';
        bool busy = false;
        return StatefulBuilder(
          builder: (ctx, setModalState) => Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.auto_awesome, color: NexoraTheme.emerald600),
                    SizedBox(width: 8),
                    Text('Nexora AI Copilot', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: NexoraTheme.slate900)),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: NexoraTheme.emerald50,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: NexoraTheme.emerald200),
                  ),
                  child: Text(reply, style: const TextStyle(color: NexoraTheme.slate700, fontSize: 13, height: 1.45)),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: ctrl,
                        decoration: const InputDecoration(hintText: 'Ask Nexora AI…'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: busy
                          ? null
                          : () async {
                              final text = ctrl.text.trim();
                              if (text.isEmpty) return;
                              ctrl.clear();
                              setModalState(() => busy = true);
                              try {
                                final res = await ApiService.askCopilot(text, GoRouterState.of(context).matchedLocation);
                                setModalState(() => reply = res['reply'] ?? reply);
                              } finally {
                                setModalState(() => busy = false);
                              }
                            },
                      child: busy
                          ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.send, size: 18),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _locationToIndex(context);
    return Scaffold(
      body: child,
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: NexoraTheme.emerald600,
        foregroundColor: Colors.white,
        onPressed: () => _openCopilot(context),
        tooltip: 'Nexora AI Copilot',
        child: const Icon(Icons.auto_awesome),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: NexoraTheme.slate200)),
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (index) {
            switch (index) {
              case 0: context.go('/jobs'); break;
              case 1: context.go('/ideas'); break;
              case 2: context.go('/groups'); break;
              case 3: context.go('/ats'); break;
              case 4: context.go('/profile'); break;
            }
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.work_outline), label: 'Jobs'),
            BottomNavigationBarItem(icon: Icon(Icons.lightbulb_outline), label: 'Ideas'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Groups'),
            BottomNavigationBarItem(icon: Icon(Icons.bolt_outlined), label: 'AI ATS'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
