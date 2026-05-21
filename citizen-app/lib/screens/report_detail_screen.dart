import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../core/api/api_client.dart';
import '../core/models/report.dart';
import '../core/providers/auth_provider.dart';
import '../core/providers/reports_provider.dart';

class ReportDetailScreen extends StatefulWidget {
  final int id;
  const ReportDetailScreen({super.key, required this.id});
  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  Report? _report;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final r = await context.read<ReportsProvider>().getReport(widget.id);
    if (mounted) setState(() { _report = r; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _report?.title ?? 'Müraciət #${widget.id}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.go('/reports'),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _report == null
              ? _buildError()
              : _buildBody(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.error_outline, size: 56, color: Colors.red),
        const SizedBox(height: 12),
        const Text('Müraciət tapılmadı'),
        const SizedBox(height: 16),
        OutlinedButton(
            onPressed: () => context.go('/reports'),
            child: const Text('Geri qayıt')),
      ]),
    );
  }

  Widget _buildBody() {
    final r = _report!;
    final api = ApiClient();
    final (statusColor, statusBg) = _statusColors(r.status);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(r.title,
                          style: Theme.of(context).textTheme.titleLarge),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${r.statusEmoji} ${r.statusLabel}',
                        style: TextStyle(
                            color: statusColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(children: [
                  Icon(Icons.calendar_today_outlined,
                      size: 13,
                      color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 6),
                  Text(_fmtFull(r.createdAt),
                      style: Theme.of(context).textTheme.bodySmall),
                ]),
                Divider(
                    height: 24,
                    color: Theme.of(context).dividerColor),
                Text(r.description,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        height: 1.6)),
              ],
            ),
          ),
        ),
        if (r.imagePath != null && r.imagePath!.isNotEmpty) ...[

          const SizedBox(height: 12),
          _SectionTitle(label: 'Şəkil', icon: Icons.image_outlined),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(
              api.assetUrl(r.imagePath),
              width: double.infinity,
              fit: BoxFit.cover,
              loadingBuilder: (_, child, progress) => progress == null
                  ? child
                  : const SizedBox(
                      height: 180,
                      child: Center(child: CircularProgressIndicator())),
              errorBuilder: (_, _, _) => Container(
                height: 80,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.grey.withAlpha(20),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text('Şəkil yüklənmədi'),
              ),
            ),
          ),
        ],
        if (r.latitude != null && r.longitude != null) ...[
          const SizedBox(height: 16),
          _SectionTitle(label: 'Konum', icon: Icons.location_on_outlined),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: 220,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(r.latitude!, r.longitude!),
                  initialZoom: 15,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'az.aquaguard.app',
                  ),
                  MarkerLayer(markers: [
                    Marker(
                      point: LatLng(r.latitude!, r.longitude!),
                      child: const Icon(Icons.location_pin,
                          color: Colors.red, size: 40),
                    ),
                  ]),
                ],
              ),
            ),
          ),
        ],
        if (r.adminResponse != null && r.adminResponse!.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionTitle(label: 'Admin Cavabı', icon: Icons.chat_outlined),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF0077B6).withAlpha(15),
                  const Color(0xFF023E8A).withAlpha(10),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: const Color(0xFF0077B6).withAlpha(40)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0077B6).withAlpha(30),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.support_agent_rounded,
                      size: 18, color: Color(0xFF0077B6)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(r.adminResponse!,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(height: 1.5)),
                ),
              ],
            ),
          ),
        ],
        if (r.status == 'completed') ...[
          const SizedBox(height: 16),
          _RatingSection(report: r, onRated: (updated) {
            setState(() => _report = updated);
            // refresh stats in profile
            context.read<AuthProvider>().fetchStats();
          }),
        ],
        const SizedBox(height: 32),
      ],
    );
  }

  (Color, Color) _statusColors(String status) => switch (status) {
        'completed' => (Colors.green.shade700, Colors.green.withAlpha(25)),
        'rejected'  => (Colors.red.shade700, Colors.red.withAlpha(25)),
        'accepted'  => (Colors.orange.shade700, Colors.orange.withAlpha(25)),
        _           => (Colors.blueGrey.shade700, Colors.blueGrey.withAlpha(25)),
      };

  String _fmtFull(DateTime dt) =>
      '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}  '
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
}

// ─── Rating section ───────────────────────────────────────────────────────────

class _RatingSection extends StatefulWidget {
  final Report report;
  final void Function(Report updated) onRated;
  const _RatingSection({required this.report, required this.onRated});

  @override
  State<_RatingSection> createState() => _RatingSectionState();
}

class _RatingSectionState extends State<_RatingSection> {
  int _hover = 0;
  bool _submitting = false;

  Future<void> _submit(int stars) async {
    setState(() => _submitting = true);
    try {
      final data = await ApiClient().rateReport(widget.report.id, stars);
      final updated = Report.fromJson(data);
      widget.onRated(updated);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(ApiClient().errorMessage(e)),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final existing = widget.report.rating;

    return Card(
      color: isDark
          ? Colors.amber.withAlpha(15)
          : Colors.amber.withAlpha(12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.amber.withAlpha(60)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(children: [
              const Icon(Icons.star_rounded, size: 18, color: Colors.amber),
              const SizedBox(width: 8),
              Text(
                existing != null ? 'Qiymətləndirməniz' : 'Xidməti qiymətləndirin',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Colors.amber.shade700, fontWeight: FontWeight.w700),
              ),
            ]),
            const SizedBox(height: 4),
            Text(
              existing != null
                  ? 'Müraciətinizin həlli haqqında fikrinizi bildirdiniz'
                  : 'Müraciətinizin həlli sizi nə dərəcədə razı saldı?',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            if (existing != null)
              _StarDisplay(rating: existing)
            else if (_submitting)
              const SizedBox(
                height: 44,
                child: Center(child: CircularProgressIndicator(color: Colors.amber)),
              )
            else
              _StarPicker(
                hover: _hover,
                onHover: (v) => setState(() => _hover = v),
                onSelect: _submit,
              ),
            if (existing != null) ...[
              const SizedBox(height: 8),
              Text(
                _ratingText(existing),
                style: TextStyle(
                    color: Colors.amber.shade700,
                    fontWeight: FontWeight.w600,
                    fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _ratingText(int r) => switch (r) {
        1 => 'Çox zəif',
        2 => 'Zəif',
        3 => 'Orta',
        4 => 'Yaxşı',
        5 => 'Əla!',
        _ => '',
      };
}

class _StarPicker extends StatelessWidget {
  final int hover;
  final void Function(int) onHover;
  final void Function(int) onSelect;
  const _StarPicker(
      {required this.hover, required this.onHover, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) {
        final star = i + 1;
        final filled = star <= hover;
        return GestureDetector(
          onTap: () => onSelect(star),
          child: MouseRegion(
            onEnter: (_) => onHover(star),
            onExit: (_) => onHover(0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: Icon(
                filled ? Icons.star_rounded : Icons.star_outline_rounded,
                size: filled ? 42 : 38,
                color: filled ? Colors.amber : Colors.amber.withAlpha(100),
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _StarDisplay extends StatelessWidget {
  final int rating;
  const _StarDisplay({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) {
        final filled = i < rating;
        return Icon(
          filled ? Icons.star_rounded : Icons.star_outline_rounded,
          size: 36,
          color: filled ? Colors.amber : Colors.amber.withAlpha(60),
        );
      }),
    );
  }
}

// ─── Section title ────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String label;
  final IconData icon;
  const _SectionTitle({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 16, color: const Color(0xFF0077B6)),
      const SizedBox(width: 6),
      Text(label,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: const Color(0xFF0077B6), fontWeight: FontWeight.w700)),
    ]);
  }
}
