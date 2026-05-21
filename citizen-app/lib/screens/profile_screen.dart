import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/models/user.dart';
import '../core/providers/auth_provider.dart';
import '../core/providers/theme_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserStats? _stats;
  bool _statsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await context.read<AuthProvider>().fetchStats();
    if (mounted) setState(() { _stats = stats; _statsLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          Consumer<ThemeProvider>(
            builder: (_, tp, _) => IconButton(
              icon: Icon(
                tp.isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: Colors.white,
              ),
              onPressed: tp.toggle,
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ProfileCard(user: user),
          const SizedBox(height: 12),
          _StatsCard(stats: _stats, loading: _statsLoading),
          const SizedBox(height: 12),
          _MenuCard(children: [
            _MenuItem(
              icon: Icons.notifications_outlined,
              label: 'Bildirişlər',
              onTap: () => context.push('/notifications'),
            ),
            _MenuItem(
              icon: Icons.settings_outlined,
              label: 'Tənzimləmələr',
              onTap: () => context.push('/settings'),
            ),
          ]),
          const SizedBox(height: 12),
          _MenuCard(children: [
            _MenuItem(
              icon: Icons.logout_rounded,
              label: 'Çıxış',
              color: Colors.red,
              onTap: () => context.read<AuthProvider>().logout(),
            ),
          ]),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ─── Profile header card ──────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  final User? user;
  const _ProfileCard({required this.user});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _AvatarWidget(user: user, radius: 40),
            const SizedBox(height: 14),
            Text(
              user?.fullname ?? '',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800),
              textAlign: TextAlign.center,
            ),
            if (user?.username != null) ...[
              const SizedBox(height: 2),
              Text(
                '@${user!.username}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF0077B6),
                    fontWeight: FontWeight.w600),
              ),
            ],
            if (user?.city != null) ...[
              const SizedBox(height: 6),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_on_outlined,
                      size: 14,
                      color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 4),
                  Text(user!.city!,
                      style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ],
            if (user?.bio != null && user!.bio!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                user!.bio!,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(height: 1.5),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: () => context.push('/profile/edit'),
              icon: const Icon(Icons.edit_outlined, size: 16),
              label: const Text('Profili Redaktə Et'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(160, 38),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Statistics card ─────────────────────────────────────────────────────────

class _StatsCard extends StatelessWidget {
  final UserStats? stats;
  final bool loading;
  const _StatsCard({required this.stats, required this.loading});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.bar_chart_rounded, size: 18, color: Color(0xFF0077B6)),
              const SizedBox(width: 8),
              Text('Statistika',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: const Color(0xFF0077B6), fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 16),
            if (loading)
              const Center(child: CircularProgressIndicator())
            else
              Column(children: [
                Row(children: [
                  Expanded(
                    child: _StatTile(
                      icon: Icons.stars_rounded,
                      color: const Color(0xFFFFB700),
                      label: 'Xallar',
                      value: '${stats?.points ?? 0}',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatTile(
                      icon: Icons.monetization_on_outlined,
                      color: Colors.green,
                      label: 'Mükafat',
                      value: '${(stats?.totalReward ?? 0).toStringAsFixed(0)} ₼',
                    ),
                  ),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: _StatTile(
                      icon: Icons.assignment_outlined,
                      color: const Color(0xFF0077B6),
                      label: 'Müraciətlər',
                      value: '${stats?.total ?? 0}',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatTile(
                      icon: Icons.verified_outlined,
                      color: Colors.orange,
                      label: 'Yoxlanmış',
                      value: '${stats?.verified ?? 0}',
                    ),
                  ),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: _StatTile(
                      icon: Icons.check_circle_outline_rounded,
                      color: Colors.green,
                      label: 'Həll Edilmiş',
                      value: '${stats?.resolved ?? 0}',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatTile(
                      icon: Icons.star_rounded,
                      color: Colors.amber,
                      label: 'Ortalama Reytinq',
                      value: stats?.avgRating != null
                          ? '${stats!.avgRating!.toStringAsFixed(1)} ★'
                          : '—',
                    ),
                  ),
                ]),
              ]),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String value;
  const _StatTile({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: color.withAlpha(isDark ? 25 : 18),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withAlpha(isDark ? 50 : 35),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: color)),
                Text(label,
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Menu card ────────────────────────────────────────────────────────────────

class _MenuCard extends StatelessWidget {
  final List<Widget> children;
  const _MenuCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: children
            .asMap()
            .entries
            .map((e) => Column(children: [
                  e.value,
                  if (e.key < children.length - 1)
                    Divider(
                        height: 1,
                        indent: 56,
                        color: Theme.of(context).dividerColor),
                ]))
            .expand((w) => [w])
            .toList(),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurface;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: c.withAlpha(18),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: c),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: c, fontWeight: FontWeight.w500)),
          ),
          Icon(Icons.chevron_right_rounded,
              size: 20,
              color: Theme.of(context).colorScheme.outline),
        ]),
      ),
    );
  }
}

// ─── Avatar widget (shared) ───────────────────────────────────────────────────

class _AvatarWidget extends StatelessWidget {
  final User? user;
  final double radius;
  const _AvatarWidget({required this.user, required this.radius});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: radius * 2,
          height: radius * 2,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFF0077B6), Color(0xFF023E8A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0077B6).withAlpha(70),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Center(
            child: Text(
              user?.initials ?? '?',
              style: TextStyle(
                color: Colors.white,
                fontSize: radius * 0.65,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        Positioned(
          right: 0,
          bottom: 0,
          child: Container(
            width: radius * 0.65,
            height: radius * 0.65,
            decoration: BoxDecoration(
              color: Colors.green.shade500,
              shape: BoxShape.circle,
              border: Border.all(
                  color: Theme.of(context).scaffoldBackgroundColor, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}
