import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models/user.dart';

export '../models/user.dart' show UserStats, AppNotification;

enum AuthStatus { loading, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final _api = ApiClient();

  AuthStatus _status = AuthStatus.loading;
  User? _user;
  String? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    final token = await ApiClient.getToken();
    if (token == null) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      final data = await _api.me();
      _user = User.fromJson(data);
      _status = AuthStatus.authenticated;
    } catch (_) {
      await ApiClient.clearToken();
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _error = null;
    try {
      final data = await _api.login({'email': email, 'password': password});
      await ApiClient.saveToken(data['token'] as String);
      _user = User.fromJson(data['user'] as Map<String, dynamic>);
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _api.errorMessage(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String fullname, String email, String password) async {
    _error = null;
    try {
      final data = await _api.register({
        'fullname': fullname,
        'email': email,
        'password': password,
      });
      await ApiClient.saveToken(data['token'] as String);
      _user = User.fromJson(data['user'] as Map<String, dynamic>);
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _api.errorMessage(e);
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiClient.clearToken();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<bool> updateProfile(Map<String, dynamic> body) async {
    _error = null;
    try {
      final data = await _api.updateMe(body);
      _user = User.fromJson(data);
      notifyListeners();
      return true;
    } catch (e) {
      _error = _api.errorMessage(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> changePassword(String current, String newPass) async {
    _error = null;
    try {
      await _api.changePassword({
        'currentPassword': current,
        'newPassword': newPass,
      });
      return true;
    } catch (e) {
      _error = _api.errorMessage(e);
      notifyListeners();
      return false;
    }
  }

  Future<UserStats?> fetchStats() async {
    try {
      final data = await _api.myStats();
      return UserStats.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<({List<AppNotification> notifications, int unread})?> fetchNotifications() async {
    try {
      final data = await _api.listNotifications();
      final list = (data['notifications'] as List)
          .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
          .toList();
      return (notifications: list, unread: (data['unread'] as int?) ?? 0);
    } catch (_) {
      return null;
    }
  }

  Future<void> markAllNotificationsRead() async {
    await _api.markAllNotificationsRead();
  }
}
