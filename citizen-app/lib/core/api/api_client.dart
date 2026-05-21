import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _tokenKey = 'auth_token';

// Change this to your backend URL
const String _apiBase = kDebugMode
    ? 'http://localhost:4100'
    : 'https://ndu1.kiberkod.az';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio _dio;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: _apiBase,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          clearToken();
        }
        handler.next(error);
      },
    ));
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  String assetUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    return '$_apiBase$path';
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> body) async {
    final res = await _dio.post('/api/auth/citizen/register', data: body);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login(Map<String, dynamic> body) async {
    final res = await _dio.post('/api/auth/citizen/login', data: body);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get('/api/auth/me');
    final data = res.data as Map<String, dynamic>;
    // endpoint returns { user: {...} }
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> body) async {
    final res = await _dio.patch('/api/auth/me', data: body);
    final data = res.data as Map<String, dynamic>;
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<void> changePassword(Map<String, dynamic> body) async {
    // backend expects current_password / new_password
    await _dio.post('/api/auth/me/password', data: {
      'current_password': body['currentPassword'],
      'new_password': body['newPassword'],
    });
  }

  Future<Map<String, dynamic>> rateReport(int id, int rating) async {
    final res = await _dio.post('/api/reports/$id/rate', data: {'rating': rating});
    final data = res.data as Map<String, dynamic>;
    return data['report'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> myStats() async {
    final res = await _dio.get('/api/auth/me/stats');
    final data = res.data as Map<String, dynamic>;
    return data['stats'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listNotifications() async {
    final res = await _dio.get('/api/notifications');
    return res.data as Map<String, dynamic>;
  }

  Future<void> markAllNotificationsRead() async {
    await _dio.post('/api/notifications/read-all');
  }

  Future<void> markNotificationRead(int id) async {
    await _dio.post('/api/notifications/$id/read');
  }

  Future<List<dynamic>> listMyReports() async {
    final res = await _dio.get('/api/reports');
    final data = res.data as Map<String, dynamic>;
    // endpoint returns { reports: [...] }
    return data['reports'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> getReport(int id) async {
    final res = await _dio.get('/api/reports/$id');
    final data = res.data as Map<String, dynamic>;
    // endpoint returns { report: {...} }
    return data['report'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createReport({
    required String title,
    required String description,
    double? latitude,
    double? longitude,
    dynamic imageFile, // XFile on mobile/web
  }) async {
    final formData = FormData();
    formData.fields.add(MapEntry('title', title));
    formData.fields.add(MapEntry('description', description));
    if (latitude != null) {
      formData.fields.add(MapEntry('latitude', latitude.toString()));
    }
    if (longitude != null) {
      formData.fields.add(MapEntry('longitude', longitude.toString()));
    }
    if (imageFile != null) {
      if (kIsWeb) {
        final bytes = await imageFile.readAsBytes();
        formData.files.add(MapEntry(
          'image',
          MultipartFile.fromBytes(bytes, filename: imageFile.name),
        ));
      } else {
        formData.files.add(MapEntry(
          'image',
          await MultipartFile.fromFile(imageFile.path, filename: imageFile.name),
        ));
      }
    }
    final res = await _dio.post('/api/reports', data: formData);
    return res.data as Map<String, dynamic>;
  }

  String errorMessage(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['error'] != null) return data['error'] as String;
      return e.message ?? 'Xəta baş verdi';
    }
    return e.toString();
  }
}
