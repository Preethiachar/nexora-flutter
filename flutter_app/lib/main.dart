import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/router.dart';
import 'config/theme.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService.init();
  if (AuthService.isLoggedIn) SocketService.connect();
  runApp(
    const ProviderScope(
      child: NexoraApp(),
    ),
  );
}

class NexoraApp extends StatelessWidget {
  const NexoraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Nexora',
      debugShowCheckedModeBanner: false,
      theme: NexoraTheme.lightTheme,
      routerConfig: appRouter,
    );
  }
}
