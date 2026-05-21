import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'dart:typed_data';
import '../core/providers/reports_provider.dart';

class CreateReportScreen extends StatefulWidget {
  const CreateReportScreen({super.key});
  @override
  State<CreateReportScreen> createState() => _CreateReportScreenState();
}

class _CreateReportScreenState extends State<CreateReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  XFile? _imageFile;
  Uint8List? _imageBytes;
  double? _lat;
  double? _lng;
  bool _locating = false;
  bool _submitting = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await ImagePicker()
        .pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() {
      _imageFile = file;
      _imageBytes = bytes;
    });
  }

  Future<void> _locateMe() async {
    setState(() => _locating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        _snack('Yer xidməti aktiv deyil', error: true);
        return;
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        _snack('Yer icazəsi verilmədi', error: true);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
          locationSettings:
              const LocationSettings(accuracy: LocationAccuracy.high));
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
      });
      _snack('Konum tapıldı');
    } catch (e) {
      _snack('Konum alınmadı', error: true);
    } finally {
      setState(() => _locating = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final prov = context.read<ReportsProvider>();
    final ok = await prov.createReport(
      title: _titleCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      latitude: _lat,
      longitude: _lng,
      imageFile: _imageFile,
    );
    if (mounted) {
      setState(() => _submitting = false);
      if (ok) {
        _snack('Müraciətiniz göndərildi');
        context.go('/reports');
      } else if (prov.error != null) {
        _snack(prov.error!, error: true);
      }
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? Colors.red.shade700 : Colors.green.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Yeni Müraciət'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.go('/reports'),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _Section(
                title: 'Müraciət məlumatları',
                icon: Icons.edit_note_rounded,
                child: Column(children: [
                  TextFormField(
                    controller: _titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Başlıq *',
                      hintText: 'Məs: Sahil küçəsində su sızması',
                    ),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? 'Başlıq daxil edin' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _descCtrl,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Təsvir *',
                      hintText: 'Problemi ətraflı izah edin...',
                      alignLabelWithHint: true,
                    ),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? 'Təsvir daxil edin' : null,
                  ),
                ]),
              ),
              const SizedBox(height: 12),
              _Section(
                title: 'Şəkil',
                icon: Icons.image_outlined,
                child: _imageBytes != null
                    ? Stack(children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.memory(_imageBytes!,
                              height: 200,
                              width: double.infinity,
                              fit: BoxFit.cover),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: GestureDetector(
                            onTap: () =>
                                setState(() {
                                  _imageFile = null;
                                  _imageBytes = null;
                                }),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.black.withAlpha(140),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close,
                                  color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ])
                    : OutlinedButton.icon(
                        onPressed: _pickImage,
                        icon: const Icon(Icons.add_photo_alternate_outlined),
                        label: const Text('Şəkil seç (max 5 MB)'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          side: const BorderSide(
                              color: Color(0xFF0077B6)),
                        ),
                      ),
              ),
              const SizedBox(height: 12),
              _Section(
                title: 'Konum',
                icon: Icons.location_on_outlined,
                child: _lat != null && _lng != null
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.green.withAlpha(20),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: Colors.green.withAlpha(60)),
                            ),
                            child: Row(children: [
                              const Icon(Icons.check_circle,
                                  color: Colors.green, size: 16),
                              const SizedBox(width: 8),
                              Text(
                                '${_lat!.toStringAsFixed(5)}, ${_lng!.toStringAsFixed(5)}',
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500),
                              ),
                            ]),
                          ),
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: SizedBox(
                              height: 180,
                              child: FlutterMap(
                                options: MapOptions(
                                  initialCenter: LatLng(_lat!, _lng!),
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
                                      point: LatLng(_lat!, _lng!),
                                      child: const Icon(
                                          Icons.location_pin,
                                          color: Colors.red,
                                          size: 36),
                                    ),
                                  ]),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextButton.icon(
                            onPressed: () =>
                                setState(() {
                                  _lat = null;
                                  _lng = null;
                                }),
                            icon: const Icon(Icons.clear, size: 16),
                            label: const Text('Konumu sil'),
                            style: TextButton.styleFrom(
                                foregroundColor: Colors.red),
                          ),
                        ],
                      )
                    : _locating
                        ? const SizedBox(
                            height: 52,
                            child: Center(
                                child: CircularProgressIndicator()))
                        : OutlinedButton.icon(
                            onPressed: _locateMe,
                            icon: const Icon(Icons.my_location_rounded),
                            label: const Text('Konumu Avtomatik Tap'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(52),
                              side: const BorderSide(
                                  color: Color(0xFF0077B6)),
                            ),
                          ),
              ),
              const SizedBox(height: 24),
              _submitting
                  ? const SizedBox(
                      height: 50,
                      child: Center(child: CircularProgressIndicator()))
                  : ElevatedButton.icon(
                      onPressed: _submit,
                      icon: const Icon(Icons.send_rounded),
                      label: const Text('Müraciəti Göndər'),
                    ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => context.go('/reports'),
                child: Text('Ləğv et',
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.outline)),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _Section(
      {required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, size: 18, color: const Color(0xFF0077B6)),
              const SizedBox(width: 8),
              Text(title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: const Color(0xFF0077B6),
                      fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}
