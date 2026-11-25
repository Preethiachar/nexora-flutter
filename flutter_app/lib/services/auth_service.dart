import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../config/constants.dart';

class AuthService {
  static String? _token;
  static Map<String, dynamic>? _user;

  static bool get isLoggedIn => _token != null;
  static String? get token => _token;
  static Map<String, dynamic>? get currentUser => _user;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(AppConstants.tokenKey);
    final userStr = prefs.getString(AppConstants.userKey);
    if (userStr != null) _user = jsonDecode(userStr);
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final dio = Dio(BaseOptions(baseUrl: AppConstants.baseUrl));
    final response = await dio.post('/auth/login', data: {'email': email, 'password': password});
    await _saveSession(response.data['token'], response.data['user']);
    return response.data;
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final dio = Dio(BaseOptions(baseUrl: AppConstants.baseUrl));
    final response = await dio.post('/auth/register', data: data);
    await _saveSession(response.data['token'], response.data['user']);
    return response.data;
  }

  static Future<void> _saveSession(String token, Map<String, dynamic> user) async {
    _token = token;
    _user = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.tokenKey, token);
    await prefs.setString(AppConstants.userKey, jsonEncode(user));
  }

  static Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
  }
}
