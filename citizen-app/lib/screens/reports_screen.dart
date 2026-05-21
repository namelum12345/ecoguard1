import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/models/report.dart';
import '../core/providers/auth_provider.dart';
import '../core/providers/reports_provider.dart';
import '../core/providers/theme_provider.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().loadReports();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(40),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.water_drop_rounded, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 8),
          const Text('EcoGuard'),
        ]),
        actions: [
          Consumer<ThemeProvider>(
            builder: (_, tp, _) => IconButton(
              icon: Icon(
                tp.isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: Colors.white,
              ),
              tooltip: tp.isDark ? 'İşıq modu' : 'Qaranlıq mod',
              onPressed: tp.toggle,
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildGreeting(isDark, user?.fullname),
          Expanded(child: _buildList()),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/reports/new'),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Yeni Müraciət',
            style: TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: const Color(0xFF0077B6),
        foregroundColor: Colors.white,
        elevation: 4,
      ),
    );
  }

  Widget _buildGreeting(bool isDark, String? name) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name != null ? 'Salam, ${name.split(' ').first}!' : 'Müraciətlər',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 2),
          Text(
            'Aktiv müraciətlərinizi izləyin',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _buildList() {
    return Consumer<ReportsProvider>(
      builder: (context, prov, _) {
        if (prov.loading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (prov.error != null) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.wifi_off_rounded,
                      size: 56,
                      color: Theme.of(context).colorScheme.outline),
                  const SizedBox(height: 12),
                  Text(prov.error!,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: prov.loadReports,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Yenidən cəhd et'),
                  ),
                ],
              ),
            ),
          );
        }
        if (prov.reports.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0077B6).withAlpha(20),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.assignment_outlined,
                        size: 40, color: Color(0xFF0077B6)),
                  ),
                  const SizedBox(height: 16),
                  Text('Müraciət yoxdur',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('Yeni müraciət yaradaraq başlayın',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center),
                ],
              ),
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: prov.loadReports,
          color: const Color(0xFF0077B6),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
            itemCount: prov.reports.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) =>
                _ReportTile(report: prov.reports[i]),
          ),
        );
      },
    );
  }
}

class _ReportTile extends StatelessWidget {
  final Report report;
  const _ReportTile({required this.report});

  @override
  Widget build(BuildContext context) {
    final (color, bg) = _statusColors(report.status);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.go('/reports/${report.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      report.title,
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${report.statusEmoji} ${report.statusLabel}',
                      style: TextStyle(
                          color: color,
                          fontSize: 11,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                report.description,
                style: Theme.of(context).textTheme.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              Row(children: [
                Icon(Icons.calendar_today_outlined,
                    size: 12,
                    color: Theme.of(context).colorScheme.outline),
                const SizedBox(width: 4),
                Text(
                  _fmt(report.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontSize: 11,
                      color: Theme.of(context).colorScheme.outline),
                ),
                if (report.latitude != null) ...[
                  const SizedBox(width: 12),
                  Icon(Icons.location_on_outlined,
                      size: 12,
                      color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 2),
                  Text('Konum var',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontSize: 11,
                          color: Theme.of(context).colorScheme.outline)),
                ],
                const Spacer(),
                Icon(Icons.arrow_forward_ios_rounded,
                    size: 13,
                    color: Theme.of(context).colorScheme.outline),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  (Color, Color) _statusColors(String status) {
    return switch (status) {
      'completed' => (Colors.green.shade700, Colors.green.withAlpha(25)),
      'rejected'  => (Colors.red.shade700, Colors.red.withAlpha(25)),
      'accepted'  => (Colors.orange.shade700, Colors.orange.withAlpha(25)),
      _           => (Colors.blueGrey.shade700, Colors.blueGrey.withAlpha(25)),
    };
  }

  String _fmt(DateTime dt) =>
      '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
}
