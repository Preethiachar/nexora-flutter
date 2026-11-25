import 'package:go_router/go_router.dart';
import '../views/auth/login_screen.dart';
import '../views/auth/register_screen.dart';
import '../views/home/main_shell.dart';
import '../views/jobs/jobs_screen.dart';
import '../views/ideas/idea_marketplace_screen.dart';
import '../views/ideas/idea_detail_screen.dart';
import '../views/ideas/create_idea_screen.dart';
import '../views/groups/groups_list_screen.dart';
import '../views/groups/group_chat_screen.dart';
import '../views/ats/ats_screen.dart';
import '../views/feed/feed_screen.dart';
import '../views/profile/profile_screen.dart';
import '../services/auth_service.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/jobs',
  redirect: (context, state) {
    final isLoggedIn = AuthService.isLoggedIn;
    final isAuthRoute = state.matchedLocation == '/login' ||
        state.matchedLocation == '/register';

    if (!isLoggedIn && !isAuthRoute) return '/login';
    if (isLoggedIn && isAuthRoute) return '/jobs';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (ctx, state) => const LoginScreen()),
    GoRoute(path: '/register', builder: (ctx, state) => const RegisterScreen()),
    ShellRoute(
      builder: (ctx, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/jobs', builder: (ctx, state) => const JobsScreen()),
        GoRoute(
          path: '/ideas',
          builder: (ctx, state) => const IdeaMarketplaceScreen(),
          routes: [
            GoRoute(path: 'new', builder: (ctx, state) => const CreateIdeaScreen()),
            GoRoute(
              path: ':id',
              builder: (ctx, state) => IdeaDetailScreen(ideaId: state.pathParameters['id']!),
            ),
          ],
        ),
        GoRoute(
          path: '/groups',
          builder: (ctx, state) => const GroupsListScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (ctx, state) => GroupChatScreen(
                groupId: state.pathParameters['id']!,
                groupName: state.uri.queryParameters['name'] ?? 'Group Chat',
              ),
            ),
          ],
        ),
        GoRoute(path: '/ats', builder: (ctx, state) => const ATSScreen()),
        GoRoute(path: '/feed', builder: (ctx, state) => const FeedScreen()),
        GoRoute(path: '/profile', builder: (ctx, state) => const ProfileScreen()),
      ],
    ),
  ],
);
