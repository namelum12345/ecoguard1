class Report {
  final int id;
  final String title;
  final String description;
  final String status;
  final double? latitude;
  final double? longitude;
  final String? imagePath;
  final String? adminResponse;
  final DateTime createdAt;
  final int? rating;

  const Report({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    this.latitude,
    this.longitude,
    this.imagePath,
    this.adminResponse,
    required this.createdAt,
    this.rating,
  });

  factory Report.fromJson(Map<String, dynamic> json) => Report(
        id: json['id'] as int,
        title: json['title'] as String,
        description: json['description'] as String,
        status: json['status'] as String? ?? 'pending',
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        imagePath: json['image'] as String?,
        adminResponse: json['admin_response'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String),
        rating: (json['rating'] as num?)?.toInt(),
      );

  // Backend statuses: pending | accepted | rejected | completed
  String get statusLabel => switch (status) {
        'pending'   => 'Gözləyir',
        'accepted'  => 'Qəbul edildi',
        'completed' => 'Həll edildi',
        'rejected'  => 'Rədd edildi',
        _           => status,
      };

  String get statusEmoji => switch (status) {
        'pending'   => '🕐',
        'accepted'  => '🔧',
        'completed' => '✅',
        'rejected'  => '❌',
        _           => '•',
      };
}
