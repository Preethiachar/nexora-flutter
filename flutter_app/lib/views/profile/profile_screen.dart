import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/socket_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  bool _loading = true;
  bool _uploadingPdf = false;
  bool _uploadingAvatar = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final me = await ApiService.fetchMe();
      setState(() {
        _user = me;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _user = AuthService.currentUser;
        _loading = false;
      });
    }
  }

  Future<void> _pickAvatar() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image, withData: true);
    if (result == null) return;
    final f = result.files.single;
    setState(() => _uploadingAvatar = true);
    try {
      final res = await ApiService.uploadAvatar(
        filePath: f.bytes == null ? f.path : null,
        bytes: f.bytes,
        fileName: f.name,
      );
      setState(() => _user = res['user']);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Photo upload failed')));
      }
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _pickResumePdf() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true,
    );
    if (result == null) return;
    final f = result.files.single;
    setState(() => _uploadingPdf = true);
    try {
      final res = await ApiService.uploadResumePdf(
        filePath: f.bytes == null ? f.path : null,
        bytes: f.bytes,
        fileName: f.name,
      );
      setState(() => _user = res['user']);
      if (mounted) {
        final extracted = res['extracted'] ?? {};
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Extracted ${(extracted['skills'] as List?)?.length ?? 0} skills into your profile!')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PDF extraction failed')));
      }
    } finally {
      if (mounted) setState(() => _uploadingPdf = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = _user ?? {};
    final avatarPath = u['avatarUrl'] as String?;
    final fullAvatarUrl = (avatarPath != null && avatarPath.isNotEmpty)
        ? '${AppConstants.socketUrl}$avatarPath'
        : null;
    final skills = (u['skills'] as List?) ?? [];
    final badges = (u['badges'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Civic Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: NexoraTheme.red600),
            onPressed: () async {
              SocketService.disconnect();
              await AuthService.logout();
              if (mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600))
          : RefreshIndicator(
              onRefresh: _loadUser,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: _uploadingAvatar ? null : _pickAvatar,
                            child: Stack(
                              children: [
                                CircleAvatar(
                                  radius: 34,
                                  backgroundColor: NexoraTheme.emerald50,
                                  backgroundImage: fullAvatarUrl != null ? NetworkImage(fullAvatarUrl) : null,
                                  child: fullAvatarUrl == null
                                      ? Text((u['fullName'] ?? '?')[0].toUpperCase(),
                                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: NexoraTheme.emerald600))
                                      : null,
                                ),
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(5),
                                    decoration: const BoxDecoration(color: NexoraTheme.emerald600, shape: BoxShape.circle),
                                    child: const Icon(Icons.camera_alt, size: 12, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(u['fullName'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: NexoraTheme.slate900)),
                                Text(u['headline']?.toString().isNotEmpty == true ? u['headline'] : (u['role'] ?? ''),
                                    style: const TextStyle(color: NexoraTheme.slate500, fontSize: 12)),
                                const SizedBox(height: 6),
                                Text('${u['civicHours'] ?? 0} civic hours · ${u['location'] ?? 'Nexora Member'}',
                                    style: const TextStyle(color: NexoraTheme.emerald600, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Card(
                    color: NexoraTheme.emerald50,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Smart PDF Resume Extraction',
                              style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900, fontSize: 15)),
                          const SizedBox(height: 4),
                          const Text('Upload your PDF resume to extract skills, links, education & experience directly into your profile.',
                              style: TextStyle(color: NexoraTheme.slate700, fontSize: 12)),
                          if (u['resumeFileName']?.toString().isNotEmpty == true) ...[
                            const SizedBox(height: 6),
                            Text('Active: ${u['resumeFileName']}',
                                style: const TextStyle(color: NexoraTheme.emerald600, fontWeight: FontWeight.w600, fontSize: 12)),
                          ],
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: _uploadingPdf ? null : _pickResumePdf,
                            icon: const Icon(Icons.upload_file, size: 18),
                            label: Text(_uploadingPdf ? 'Extracting PDF…' : 'Upload PDF Resume'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (skills.isNotEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Skills', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: skills.map((s) => Chip(label: Text(s.toString()), padding: EdgeInsets.zero)).toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (badges.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Civic Badges', style: TextStyle(fontWeight: FontWeight.w700, color: NexoraTheme.slate900)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: badges.map((b) => Chip(label: Text('${b['icon'] ?? '🏅'} ${b['name'] ?? ''}'))).toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
