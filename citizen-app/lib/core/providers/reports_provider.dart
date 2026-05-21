import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models/report.dart';

class ReportsProvider extends ChangeNotifier {
  final _api = ApiClient();

  List<Report> _reports = [];
  bool _loading = false;
  String? _error;

  List<Report> get reports => _reports;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> loadReports() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.listMyReports();
      _reports = data.map((e) => Report.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _error = _api.errorMessage(e);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<Report?> getReport(int id) async {
    try {
      final data = await _api.getReport(id);
      return Report.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<bool> createReport({
    required String title,
    required String description,
    double? latitude,
    double? longitude,
    dynamic imageFile,
  }) async {
    try {
      await _api.createReport(
        title: title,
        description: description,
        latitude: latitude,
        longitude: longitude,
        imageFile: imageFile,
      );
      await loadReports();
      return true;
    } catch (e) {
      _error = _api.errorMessage(e);
      notifyListeners();
      return false;
    }
  }
}
