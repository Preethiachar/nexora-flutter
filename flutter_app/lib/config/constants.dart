import 'package:flutter/foundation.dart';

// API base URL — automatically handles:
// 1. Custom LAN IP via --dart-define=API_HOST=172.17.105.12
// 2. Local Flutter Web dev (localhost:8080 -> http://localhost:5000)
// 3. Production Render Web (same-origin HTTPS -> https://<app>.onrender.com)
// 4. Android Emulator (10.0.2.2:5000)
class AppConstants {
  static const String _customHost = String.fromEnvironment('API_HOST', defaultValue: '');

  static String get _origin {
    if (_customHost.isNotEmpty) return 'http://$_customHost:5000';
    if (kIsWeb) {
      final base = Uri.base;
      if (base.port == 8080 || base.port == 3000) {
        return 'http://${base.host}:5000';
      }
      return base.origin;
    }
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:5000'
        : 'http://127.0.0.1:5000';
  }

  static String get baseUrl => '$_origin/api/v1';

  static String get socketUrl => _origin;

  // Max file sizes
  static const int maxDocumentSizeMB = 15;
  static const int maxImageSizeMB = 5;

  // Supported document types
  static const List<String> allowedDocExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];

  // Token storage key
  static const String tokenKey = 'nexora_token';
  static const String userKey = 'nexora_user';

  // Pagination
  static const int defaultPageSize = 20;
}
