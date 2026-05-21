class User {
  final int id;
  final String email;
  final String fullname;
  final String? phone;
  final String? address;
  final String? username;
  final String? bio;
  final String? city;
  final int points;
  final String? avatar;
  final String role;

  const User({
    required this.id,
    required this.email,
    required this.fullname,
    this.phone,
    this.address,
    this.username,
    this.bio,
    this.city,
    this.points = 0,
    this.avatar,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        email: json['email'] as String,
        fullname: json['fullname'] as String,
        phone: json['phone'] as String?,
        address: json['address'] as String?,
        username: json['username'] as String?,
        bio: json['bio'] as String?,
        city: json['city'] as String?,
        points: (json['points'] as num?)?.toInt() ?? 0,
        avatar: json['avatar'] as String?,
        role: json['role'] as String? ?? 'citizen',
      );

  String get initials {
    final parts = fullname.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return fullname.isNotEmpty ? fullname[0].toUpperCase() : '?';
  }
}

class UserStats {
  final int total;
  final int verified;
  final int resolved;
  final double totalReward;
  final int points;
  final double? avgRating;
  final int ratedCount;

  const UserStats({
    required this.total,
    required this.verified,
    required this.resolved,
    required this.totalReward,
    required this.points,
    this.avgRating,
    this.ratedCount = 0,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) => UserStats(
        total:       (json['total']        as num?)?.toInt()    ?? 0,
        verified:    (json['verified']     as num?)?.toInt()    ?? 0,
        resolved:    (json['resolved']     as num?)?.toInt()    ?? 0,
        totalReward: (json['total_reward'] as num?)?.toDouble() ?? 0,
        points:      (json['points']       as num?)?.toInt()    ?? 0,
        avgRating:   (json['avg_rating']   as num?)?.toDouble(),
        ratedCount:  (json['rated_count']  as num?)?.toInt()    ?? 0,
      );
}

class AppNotification {
  final int id;
  final int? reportId;
  final String type;
  final String title;
  final String body;
  final bool isRead;
  final DateTime createdAt;
  final String? reportTitle;

  const AppNotification({
    required this.id,
    this.reportId,
    required this.type,
    required this.title,
    required this.body,
    required this.isRead,
    required this.createdAt,
    this.reportTitle,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id:          json['id']           as int,
        reportId:    json['report_id']    as int?,
        type:        json['type']         as String,
        title:       json['title']        as String,
        body:        json['body']         as String,
        isRead:      (json['is_read']     as int) == 1,
        createdAt:   DateTime.parse(json['created_at'] as String),
        reportTitle: json['report_title'] as String?,
      );
}
