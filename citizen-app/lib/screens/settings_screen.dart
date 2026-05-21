import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/theme_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tənzimləmələr'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SettingsGroup(
            title: 'Görünüş',
            children: [
              Consumer<ThemeProvider>(
                builder: (_, tp, _) => _SettingsTile(
                  icon: Icons.dark_mode_outlined,
                  iconColor: const Color(0xFF0077B6),
                  title: 'Qaranlıq mod',
                  subtitle: tp.isDark ? 'Aktiv' : 'Deaktiv',
                  trailing: Switch.adaptive(
                    value: tp.isDark,
                    onChanged: (_) => tp.toggle(),
                    activeThumbColor: const Color(0xFF0077B6),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SettingsGroup(
            title: 'Bildirişlər',
            children: [
              _SettingsTile(
                icon: Icons.notifications_outlined,
                iconColor: Colors.orange,
                title: 'Bildirişlər',
                subtitle: 'Status dəyişikliklərindən xəbərdar ol',
                trailing: Switch.adaptive(
                  value: true,
                  onChanged: null,
                  activeThumbColor: const Color(0xFF0077B6),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SettingsGroup(
            title: 'Tətbiq haqqında',
            children: [
              _SettingsTile(
                icon: Icons.info_outline_rounded,
                iconColor: Colors.blueGrey,
                title: 'Versiya',
                subtitle: '1.0.0',
              ),
              _SettingsTile(
                icon: Icons.shield_outlined,
                iconColor: Colors.green,
                title: 'Gizlilik Siyasəti',
                onTap: () {},
              ),
              _SettingsTile(
                icon: Icons.description_outlined,
                iconColor: Colors.blueGrey,
                title: 'İstifadə Şərtləri',
                onTap: () {},
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SettingsGroup({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 0, 0, 8),
          child: Text(
            title.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.outline,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w700),
          ),
        ),
        Card(
          child: Column(
            children: children
                .asMap()
                .entries
                .map((e) => Column(children: [
                      e.value,
                      if (e.key < children.length - 1)
                        Divider(height: 1, indent: 56),
                    ]))
                .expand((w) => [w])
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconColor.withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w500)),
                if (subtitle != null)
                  Text(subtitle!,
                      style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          trailing ??
              (onTap != null
                  ? Icon(Icons.chevron_right_rounded,
                      size: 20,
                      color: Theme.of(context).colorScheme.outline)
                  : const SizedBox.shrink()),
        ]),
      ),
    );
  }
}
