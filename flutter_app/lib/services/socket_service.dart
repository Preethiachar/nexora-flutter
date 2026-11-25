import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/constants.dart';
import 'auth_service.dart';

class SocketService {
  static IO.Socket? _socket;

  static IO.Socket? get socket => _socket;

  static void connect() {
    if (_socket != null && _socket!.connected) return;
    _socket = IO.io(
      AppConstants.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': AuthService.token})
          .enableAutoConnect()
          .build(),
    );
    _socket!.on('connect', (_) => print('[Socket] Connected: ${_socket!.id}'));
    _socket!.on('disconnect', (_) => print('[Socket] Disconnected'));
    _socket!.on('connect_error', (err) => print('[Socket] Error: $err'));
  }

  static void joinGroup(String groupId) {
    _socket?.emit('join_group', groupId);
  }

  static void leaveGroup(String groupId) {
    _socket?.emit('leave_group', groupId);
  }

  static void onNewMessage(Function(dynamic) callback) {
    _socket?.on('new_message', callback);
  }

  static void onUserTyping(Function(dynamic) callback) {
    _socket?.on('user_typing', callback);
  }

  static void emitTyping(String groupId) {
    _socket?.emit('typing', {
      'groupId': groupId,
      'userId': AuthService.currentUser?['_id'],
      'userName': AuthService.currentUser?['fullName'],
    });
  }

  static void offNewMessage() => _socket?.off('new_message');
  static void offUserTyping() => _socket?.off('user_typing');

  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
