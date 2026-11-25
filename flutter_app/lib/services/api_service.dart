import 'package:dio/dio.dart';
import 'auth_service.dart';
import '../config/constants.dart';

class ApiService {
  static Dio get _dio {
    final dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        if (AuthService.token != null) 'Authorization': 'Bearer ${AuthService.token}',
      },
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          AuthService.logout();
          // Navigate to login — handled by router redirect
        }
        handler.next(error);
      },
    ));

    return dio;
  }

  // ── Marketplace ──────────────────────────────────────────────────────────
  static Future<List<dynamic>> fetchIdeas({String? domain, String? search}) async {
    final params = <String, String>{};
    if (domain != null) params['domain'] = domain;
    if (search != null) params['search'] = search;
    final res = await _dio.get('/marketplace/ideas', queryParameters: params);
    return res.data['ideas'];
  }

  static Future<Map<String, dynamic>> fetchIdeaDetail(String ideaId) async {
    final res = await _dio.get('/marketplace/ideas/$ideaId');
    return res.data['idea'];
  }

  static Future<void> applyToIdea(String ideaId) async {
    await _dio.post('/marketplace/ideas/$ideaId/apply');
  }

  static Future<List<dynamic>> fetchMentors() async {
    final res = await _dio.get('/marketplace/mentors');
    return res.data['mentors'];
  }

  static Future<void> assignMentor(String ideaId, String mentorId) async {
    await _dio.post('/marketplace/ideas/$ideaId/mentor', data: {'mentorId': mentorId});
  }

  static Future<void> createIdea(Map<String, dynamic> data) async {
    await _dio.post('/marketplace/ideas', data: data);
  }

  static Future<void> reviewApplicant(String ideaId, String memberId, String action) async {
    await _dio.post('/marketplace/ideas/$ideaId/accept-member', data: {
      'memberId': memberId,
      'action': action,
    });
  }

  // ── Messages ─────────────────────────────────────────────────────────────
  static Future<List<dynamic>> fetchGroups() async {
    final res = await _dio.get('/messages/groups');
    return res.data['groups'];
  }

  static Future<List<dynamic>> fetchGroupMessages(String groupId) async {
    final res = await _dio.get('/messages/groups/$groupId/messages');
    return res.data['messages'];
  }

  static Future<Map<String, dynamic>> sendMessage(String groupId, String content) async {
    final res = await _dio.post('/messages/groups/$groupId/send', data: {'content': content});
    return res.data['message'];
  }

  static Future<Map<String, dynamic>> uploadGroupDocument(
    String groupId, {
    String? filePath,
    List<int>? bytes,
    String? fileName,
  }) async {
    final multipart = bytes != null
        ? MultipartFile.fromBytes(bytes, filename: fileName ?? 'document')
        : await MultipartFile.fromFile(filePath!, filename: fileName);
    final formData = FormData.fromMap({'document': multipart});
    final res = await _dio.post(
      '/messages/groups/$groupId/upload',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    return res.data['message'];
  }

  // ── Profile & PDF Extraction ─────────────────────────────────────────────
  static Future<Map<String, dynamic>> uploadAvatar({
    String? filePath,
    List<int>? bytes,
    String? fileName,
  }) async {
    final multipart = bytes != null
        ? MultipartFile.fromBytes(bytes, filename: fileName ?? 'avatar.jpg')
        : await MultipartFile.fromFile(filePath!, filename: fileName);
    final res = await _dio.post(
      '/auth/avatar',
      data: FormData.fromMap({'avatar': multipart}),
      options: Options(contentType: 'multipart/form-data'),
    );
    return res.data;
  }

  static Future<Map<String, dynamic>> uploadResumePdf({
    String? filePath,
    List<int>? bytes,
    String? fileName,
  }) async {
    final multipart = bytes != null
        ? MultipartFile.fromBytes(bytes, filename: fileName ?? 'resume.pdf')
        : await MultipartFile.fromFile(filePath!, filename: fileName);
    final res = await _dio.post(
      '/auth/resume-upload',
      data: FormData.fromMap({'resume': multipart}),
      options: Options(contentType: 'multipart/form-data'),
    );
    return res.data;
  }

  static Future<Map<String, dynamic>> fetchMe() async {
    final res = await _dio.get('/auth/me');
    return res.data['user'];
  }

  // ── Jobs ─────────────────────────────────────────────────────────────────
  static Future<List<dynamic>> fetchJobs({String? search}) async {
    final params = <String, String>{};
    if (search != null) params['search'] = search;
    final res = await _dio.get('/jobs', queryParameters: params);
    return res.data['jobs'];
  }

  static Future<Map<String, dynamic>> applyToJob(String jobId) async {
    final res = await _dio.post('/jobs/$jobId/apply', data: {});
    return res.data;
  }

  // ── Copilot & ATS ────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> askCopilot(String message, String currentPage) async {
    final res = await _dio.post('/ai/copilot', data: {
      'message': message,
      'currentPage': currentPage,
    });
    return res.data;
  }

  static Future<Map<String, dynamic>> scanResume(String resumeText, String jobDescription) async {
    final res = await _dio.post('/ai/resume-ats', data: {
      'resumeText': resumeText,
      'jobDescription': jobDescription,
    });
    return res.data['result'];
  }

  // ── Feed ─────────────────────────────────────────────────────────────────
  static Future<List<dynamic>> fetchFeed() async {
    final res = await _dio.get('/feed');
    return res.data['posts'];
  }

  static Future<void> likePost(String postId) async {
    await _dio.post('/feed/$postId/like');
  }

  static Future<void> commentPost(String postId, String content) async {
    await _dio.post('/feed/$postId/comment', data: {'content': content});
  }
}
