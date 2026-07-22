import 'dart:async';

class ConnectivityService {
  ConnectivityService._();
  static final ConnectivityService instance = ConnectivityService._();

  final _reconnectController = StreamController<void>.broadcast();

  /// Screens can listen to this to reload data when internet comes back.
  Stream<void> get onReconnect => _reconnectController.stream;

  void notifyReconnect() => _reconnectController.add(null);

  void dispose() => _reconnectController.close();
}
