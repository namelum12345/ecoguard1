import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _profileKey = GlobalKey<FormState>();
  final _passKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _usernameCtrl;
  late TextEditingController _bioCtrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _addressCtrl;
  final _curPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confPassCtrl = TextEditingController();
  bool _obscureCur = true;
  bool _obscureNew = true;
  bool _savingProfile = false;
  bool _savingPass = false;

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthProvider>().user;
    _nameCtrl = TextEditingController(text: u?.fullname ?? '');
    _usernameCtrl = TextEditingController(text: u?.username ?? '');
    _bioCtrl = TextEditingController(text: u?.bio ?? '');
    _cityCtrl = TextEditingController(text: u?.city ?? '');
    _phoneCtrl = TextEditingController(text: u?.phone ?? '');
    _addressCtrl = TextEditingController(text: u?.address ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _usernameCtrl.dispose(); _bioCtrl.dispose();
    _cityCtrl.dispose(); _phoneCtrl.dispose(); _addressCtrl.dispose();
    _curPassCtrl.dispose(); _newPassCtrl.dispose(); _confPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_profileKey.currentState!.validate()) return;
    setState(() => _savingProfile = true);
    final auth = context.read<AuthProvider>();
    final ok = await auth.updateProfile({
      'fullname': _nameCtrl.text.trim(),
      'username': _usernameCtrl.text.trim(),
      'bio':      _bioCtrl.text.trim(),
      'city':     _cityCtrl.text.trim(),
      'phone':    _phoneCtrl.text.trim(),
      'address':  _addressCtrl.text.trim(),
    });
    if (mounted) {
      setState(() => _savingProfile = false);
      _snack(ok ? 'Profil yeniləndi' : (auth.error ?? 'Xəta'), ok: ok);
      if (ok) context.pop();
    }
  }

  Future<void> _changePass() async {
    if (!_passKey.currentState!.validate()) return;
    setState(() => _savingPass = true);
    final auth = context.read<AuthProvider>();
    final ok = await auth.changePassword(_curPassCtrl.text, _newPassCtrl.text);
    if (mounted) {
      setState(() => _savingPass = false);
      if (ok) { _curPassCtrl.clear(); _newPassCtrl.clear(); _confPassCtrl.clear(); }
      _snack(ok ? 'Şifrə dəyişdirildi' : (auth.error ?? 'Xəta'), ok: ok);
    }
  }

  void _snack(String msg, {bool ok = true}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: ok ? Colors.green.shade700 : Colors.red.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profili Redaktə Et')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildProfileSection(),
          const SizedBox(height: 12),
          _buildPasswordSection(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildProfileSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _SectionHeader(label: 'Şəxsi məlumatlar', icon: Icons.person_outline),
            const SizedBox(height: 16),
            Form(
              key: _profileKey,
              child: Column(children: [
                TextFormField(
                  controller: _nameCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Ad Soyad *',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty
                      ? 'Ad Soyad daxil edin' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _usernameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'İstifadəçi adı',
                    prefixIcon: Icon(Icons.alternate_email_rounded),
                    hintText: 'örn: ali_huseynov',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _bioCtrl,
                  maxLines: 3,
                  maxLength: 160,
                  decoration: const InputDecoration(
                    labelText: 'Bio',
                    prefixIcon: Icon(Icons.info_outline),
                    alignLabelWithHint: true,
                    hintText: 'Özünüz haqqında qısa məlumat...',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _cityCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Şəhər',
                    prefixIcon: Icon(Icons.location_city_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Telefon',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _addressCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Ünvan',
                    prefixIcon: Icon(Icons.home_outlined),
                  ),
                ),
                const SizedBox(height: 18),
                _savingProfile
                    ? const SizedBox(height: 50, child: Center(child: CircularProgressIndicator()))
                    : ElevatedButton.icon(
                        onPressed: _saveProfile,
                        icon: const Icon(Icons.save_outlined, size: 18),
                        label: const Text('Dəyişiklikləri Saxla'),
                      ),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _SectionHeader(label: 'Şifrəni dəyiş', icon: Icons.lock_outline),
            const SizedBox(height: 16),
            Form(
              key: _passKey,
              child: Column(children: [
                TextFormField(
                  controller: _curPassCtrl,
                  obscureText: _obscureCur,
                  decoration: InputDecoration(
                    labelText: 'Mövcud şifrə',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureCur
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined),
                      onPressed: () => setState(() => _obscureCur = !_obscureCur),
                    ),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Daxil edin' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _newPassCtrl,
                  obscureText: _obscureNew,
                  decoration: InputDecoration(
                    labelText: 'Yeni şifrə',
                    prefixIcon: const Icon(Icons.lock_open_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureNew
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined),
                      onPressed: () => setState(() => _obscureNew = !_obscureNew),
                    ),
                  ),
                  validator: (v) =>
                      v == null || v.length < 6 ? 'Ən az 6 simvol' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _confPassCtrl,
                  obscureText: _obscureNew,
                  decoration: const InputDecoration(
                    labelText: 'Yeni şifrəni təsdiqlə',
                    prefixIcon: Icon(Icons.lock_open_outlined),
                  ),
                  validator: (v) =>
                      v != _newPassCtrl.text ? 'Şifrələr uyğun gəlmir' : null,
                ),
                const SizedBox(height: 18),
                _savingPass
                    ? const SizedBox(height: 50, child: Center(child: CircularProgressIndicator()))
                    : ElevatedButton.icon(
                        onPressed: _changePass,
                        icon: const Icon(Icons.key_rounded, size: 18),
                        label: const Text('Şifrəni Dəyiş'),
                      ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final IconData icon;
  const _SectionHeader({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(icon, size: 18, color: const Color(0xFF0077B6)),
        const SizedBox(width: 8),
        Text(label,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: const Color(0xFF0077B6), fontWeight: FontWeight.w700)),
      ]);
}
