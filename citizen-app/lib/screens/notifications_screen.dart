import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification>? _notifications;
  int _unread = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final result = await context.read<AuthProvider>().fetchNotifications();
    if (mounted) {
      setState(() {
        _notifications = result?.notifications ?? [];
        _unread = result?.unread ?? 0;
        _loading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
    await context.read<AuthProvider>().markAllNotificationsRead();
    setState(() {
      _notifications = _notifications
          ?.map((n) => AppNotification(
                id: n.id,
                reportId: n.reportId,
                type: n.type,
                title: n.title,
                body: n.body,
                isRead: true,
                createdAt: n.createdAt,
                reportTitle: n.reportTitle,
              ))
          .toList();
      _unread = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          const Text('Bildirişlər'),
          if (_unread > 0) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('$_unread',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (_unread > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Hamısını oxu',
                  style: TextStyle(color: Colors.white70, fontSize: 12)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications == null || _notifications!.isEmpty
              ? _buildEmpty()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: const Color(0xFF0077B6),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications!.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) =>
                        _NotificationTile(notif: _notifications![i]),
                  ),
                ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: const Color(0xFF0077B6).withAlpha(20),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.notifications_none_rounded,
              size: 36, color: Color(0xFF0077B6)),
        ),
        const SizedBox(height: 14),
        Text('Bildiriş yoxdur',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 6),
        Text('Müraciətlərinizdə dəyişiklik olduqda burada görünəcək',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center),
      ]),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notif;
  const _NotificationTile({required this.notif});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final (icon, color) = _iconForType(notif.title);

    return Card(
      color: notif.isRead
          ? null
          : const Color(0xFF0077B6).withAlpha(isDark ? 20 : 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: notif.reportId != null
            ? () => context.push('/reports/${notif.reportId}')
            : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withAlpha(isDark ? 50 : 30),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(
                        child: Text(notif.title,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(fontWeight: notif.isRead
                                    ? FontWeight.w500
                                    : FontWeight.w700)),
                      ),
                      if (!notif.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                              color: Color(0xFF0077B6),
                              shape: BoxShape.circle),
                        ),
                    ]),
                    const SizedBox(height: 3),
                    Text(notif.body,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text(_fmt(notif.createdAt),
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(
                                fontSize: 10,
                                color: Theme.of(context)
                                    .colorScheme
                                    .outline)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  (IconData, Color) _iconForType(String title) {
    if (title.contains('həll')) return (Icons.check_circle_outline, Colors.green);
    if (title.contains('qəbul')) return (Icons.thumb_up_outlined, Colors.orange);
    if (title.contains('rədd')) return (Icons.cancel_outlined, Colors.red);
    return (Icons.notifications_outlined, const Color(0xFF0077B6));
  }

  String _fmt(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'İndicə';
    if (diff.inHours < 1) return '${diff.inMinutes} dəq əvvəl';
    if (diff.inDays < 1) return '${diff.inHours} saat əvvəl';
    if (diff.inDays < 7) return '${diff.inDays} gün əvvəl';
    return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
  }
}
