import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:open_filex/open_filex.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../services/auth_service.dart';

class GroupChatScreen extends StatefulWidget {
  final String groupId;
  final String groupName;

  const GroupChatScreen({super.key, required this.groupId, required this.groupName});

  @override
  State<GroupChatScreen> createState() => _GroupChatScreenState();
}

class _GroupChatScreenState extends State<GroupChatScreen> {
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<dynamic> messages = [];
  bool _loading = true;
  bool _uploading = false;
  String? _typingUser;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    SocketService.joinGroup(widget.groupId);
    SocketService.onNewMessage((data) {
      setState(() => messages.add(data));
      _scrollToBottom();
    });
    SocketService.onUserTyping((data) {
      if (data['userId'] != AuthService.currentUser?['_id']) {
        setState(() => _typingUser = data['userName']);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _typingUser = null);
        });
      }
    });
  }

  @override
  void dispose() {
    SocketService.leaveGroup(widget.groupId);
    SocketService.offNewMessage();
    SocketService.offUserTyping();
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages() async {
    try {
      final msgs = await ApiService.fetchGroupMessages(widget.groupId);
      setState(() { messages = msgs; _loading = false; });
      _scrollToBottom();
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final content = _msgController.text.trim();
    if (content.isEmpty) return;
    _msgController.clear();
    try {
      await ApiService.sendMessage(widget.groupId, content);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send message')),
      );
    }
  }

  Future<void> _pickAndUploadDocument({List<String> extensions = const ['pdf', 'doc', 'docx', 'ppt', 'pptx']}) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: extensions,
      allowMultiple: false,
      withData: true,
    );

    if (result == null) return;
    final file = result.files.single;
    if (file.bytes == null && file.path == null) return;

    final sizeKB = (file.size / 1024).toStringAsFixed(1);

    if (file.size > 15 * 1024 * 1024) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('File exceeds 15 MB limit')),
      );
      return;
    }

    setState(() => _uploading = true);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Uploading ${file.name} ($sizeKB KB)…')),
    );

    try {
      await ApiService.uploadGroupDocument(
        widget.groupId,
        filePath: file.bytes == null ? file.path : null,
        bytes: file.bytes,
        fileName: file.name,
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upload failed. Check file type and size.')),
      );
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Widget _buildFileMessage(dynamic msg) {
    final fileType = msg['fileType'] ?? 'other';
    final Map<String, dynamic> typeConfig = {
      'pdf': {'icon': Icons.picture_as_pdf, 'color': const Color(0xFFDC2626), 'bg': const Color(0xFFFEF2F2)},
      'word': {'icon': Icons.description, 'color': const Color(0xFF2563EB), 'bg': const Color(0xFFEFF6FF)},
      'ppt': {'icon': Icons.slideshow, 'color': const Color(0xFFEA580C), 'bg': const Color(0xFFFFF7ED)},
    };
    final config = typeConfig[fileType] ?? {'icon': Icons.attach_file, 'color': NexoraTheme.slate700, 'bg': NexoraTheme.slate100};

    return GestureDetector(
      onTap: () {
        final raw = (msg['fileUrl'] ?? '').toString();
        final url = raw.startsWith('http') ? raw : '${AppConstants.socketUrl}$raw';
        OpenFilex.open(url);
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: config['bg'] as Color,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: NexoraTheme.slate200),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(config['icon'] as IconData, color: config['color'] as Color, size: 24),
            const SizedBox(width: 10),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(msg['fileName'] ?? 'Document',
                      style: const TextStyle(color: NexoraTheme.slate900, fontSize: 13, fontWeight: FontWeight.w600),
                      overflow: TextOverflow.ellipsis),
                  Text('${msg['fileSize'] ?? ''} · ${fileType.toUpperCase()}',
                      style: const TextStyle(color: NexoraTheme.slate500, fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.download_rounded, color: NexoraTheme.emerald600, size: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = AuthService.currentUser?['_id'];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/groups')),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.groupName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const Text('Word · PowerPoint · PDF sharing enabled', style: TextStyle(fontSize: 11, color: NexoraTheme.emerald600)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: NexoraTheme.emerald600))
                : messages.isEmpty
                    ? const Center(child: Text('No messages yet', style: TextStyle(color: NexoraTheme.slate500)))
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length + ((_typingUser != null) ? 1 : 0),
                        itemBuilder: (ctx, i) {
                          if (i == messages.length && _typingUser != null) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text('$_typingUser is typing…',
                                  style: const TextStyle(color: NexoraTheme.slate500, fontSize: 12, fontStyle: FontStyle.italic)),
                            );
                          }
                          final msg = messages[i];
                          final isMine = (msg['sender']?['_id'] ?? msg['sender']) == currentUserId;
                          return _buildMessageBubble(msg, isMine);
                        },
                      ),
          ),

          if (_uploading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: NexoraTheme.emerald50,
              child: const Row(
                children: [
                  SizedBox(height: 16, width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: NexoraTheme.emerald600)),
                  SizedBox(width: 10),
                  Text('Uploading document…', style: TextStyle(color: NexoraTheme.emerald600, fontSize: 13)),
                ],
              ),
            ),

          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 14),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: NexoraTheme.slate200)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Quick-share Word / PPT / PDF chips
                Row(
                  children: [
                    ActionChip(
                      label: const Text('Word', style: TextStyle(fontSize: 11, color: Color(0xFF1D4ED8))),
                      avatar: const Icon(Icons.description, size: 14, color: Color(0xFF1D4ED8)),
                      backgroundColor: const Color(0xFFEFF6FF),
                      onPressed: () => _pickAndUploadDocument(extensions: ['doc', 'docx']),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text('PPT', style: TextStyle(fontSize: 11, color: Color(0xFFC2410C))),
                      avatar: const Icon(Icons.slideshow, size: 14, color: Color(0xFFC2410C)),
                      backgroundColor: const Color(0xFFFFF7ED),
                      onPressed: () => _pickAndUploadDocument(extensions: ['ppt', 'pptx']),
                    ),
                    const SizedBox(width: 6),
                    ActionChip(
                      label: const Text('PDF', style: TextStyle(fontSize: 11, color: Color(0xFFB91C1C))),
                      avatar: const Icon(Icons.picture_as_pdf, size: 14, color: Color(0xFFB91C1C)),
                      backgroundColor: const Color(0xFFFEF2F2),
                      onPressed: () => _pickAndUploadDocument(extensions: ['pdf']),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.attach_file, color: NexoraTheme.emerald600),
                      onPressed: () => _pickAndUploadDocument(),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _msgController,
                        onChanged: (_) => SocketService.emitTyping(widget.groupId),
                        maxLines: null,
                        decoration: InputDecoration(
                          hintText: 'Message your group…',
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: NexoraTheme.slate200),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _sendMessage,
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: NexoraTheme.emerald600,
                          borderRadius: BorderRadius.circular(22),
                        ),
                        child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(dynamic msg, bool isMine) {
    final hasFile = msg['fileUrl'] != null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: NexoraTheme.emerald50,
              child: Text(
                (msg['sender']?['fullName'] ?? '?')[0].toUpperCase(),
                style: const TextStyle(color: NexoraTheme.emerald600, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMine)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4, left: 4),
                    child: Text(msg['sender']?['fullName'] ?? '',
                        style: const TextStyle(color: NexoraTheme.slate500, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                hasFile
                    ? _buildFileMessage(msg)
                    : Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isMine ? NexoraTheme.emerald600 : Colors.white,
                          border: isMine ? null : Border.all(color: NexoraTheme.slate200),
                          borderRadius: BorderRadius.circular(18).copyWith(
                            bottomRight: isMine ? const Radius.circular(4) : null,
                            bottomLeft: !isMine ? const Radius.circular(4) : null,
                          ),
                        ),
                        child: Text(
                          msg['content'] ?? '',
                          style: TextStyle(
                            color: isMine ? Colors.white : NexoraTheme.slate900,
                            fontSize: 14,
                          ),
                        ),
                      ),
              ],
            ),
          ),
          if (isMine) const SizedBox(width: 8),
        ],
      ),
    );
  }
}
