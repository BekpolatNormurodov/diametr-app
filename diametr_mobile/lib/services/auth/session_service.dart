import 'package:dio/dio.dart' show RequestOptions;

import '../../export_files.dart';
import '../storage/storage_service.dart';

/// Ends the customer's session when the API says the JWT is no longer valid.
///
/// Tokens expire (30 days by default). Before this, an expired token made the
/// order history look empty, the bell badge show 0 and every checkout fail with
/// a generic error, and only a manual logout + login fixed it. Now the first
/// 401 clears the stored token and sends the user to the login screen with a
/// clear message.
class SessionService {
  SessionService._();

  /// Attached to MaterialApp so the session can be ended from outside the
  /// widget tree (the Dio interceptor).
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static bool _endingSession = false;

  /// Called by the Dio interceptor for every 401 response.
  static void handleUnauthorized(RequestOptions request, dynamic body) {
    final String sentToken = _bearerToken(request.headers['Authorization'] ??
        request.headers['authorization']);
    // Anonymous requests (logged-out user, SMS login flow) are not a session.
    if (sentToken.isEmpty) return;
    if (request.path.contains('/sms/')) return;
    // A 401 for a request made with an older token (user already logged in
    // again, or a parallel request after we already logged out) is stale.
    final String? current = StorageService().read(StorageService.token);
    if (current == null || current != sentToken) return;
    // "Access denied" is a role problem on a valid token, not an expired
    // session; logging out would only loop the user back here.
    if (_isAccessDenied(body)) return;
    endSession();
  }

  /// Clears the token and opens the login screen with an explanation.
  static void endSession() {
    if (_endingSession) return;
    _endingSession = true;
    StorageService().remove(StorageService.token);
    StorageService().remove(StorageService.user);
    // Navigate on the next event-loop turn so the failing request's own error
    // handling (closing a loading dialog, etc.) finishes first and cannot pop
    // the login route.
    Future.delayed(Duration.zero, () {
      final nav = navigatorKey.currentState;
      if (nav == null) {
        _endingSession = false;
        return;
      }
      nav.pushNamedAndRemoveUntil(RouteNames.loginScreen, (_) => false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _endingSession = false;
        final ctx = navigatorKey.currentState?.overlay?.context;
        if (ctx != null) {
          AppToast.show(ctx,
              message: 'session_expired'.tr(), type: ToastType.warning);
        }
      });
      WidgetsBinding.instance.scheduleFrame();
    });
  }

  /// True when [token] is a JWT whose `exp` claim is in the past. Anything that
  /// cannot be decoded counts as not expired, so a parsing problem never logs a
  /// user out; the server's 401 is still the final word.
  static bool isExpired(String? token) {
    if (token == null || token.isEmpty) return false;
    try {
      final parts = token.split('.');
      if (parts.length != 3) return false;
      final payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
      final data = jsonDecode(payload);
      final exp = data is Map ? data['exp'] : null;
      if (exp is! num) return false;
      final expiry =
          DateTime.fromMillisecondsSinceEpoch((exp * 1000).toInt(), isUtc: true);
      return DateTime.now().toUtc().isAfter(expiry);
    } catch (_) {
      return false;
    }
  }

  static String _bearerToken(dynamic header) {
    final value = header?.toString() ?? '';
    if (!value.startsWith('Bearer ')) return '';
    return value.substring('Bearer '.length).trim();
  }

  static bool _isAccessDenied(dynamic body) {
    final raw = body is Map ? body['message'] : null;
    final msg = (raw is List ? raw.join(' ') : raw?.toString() ?? '').toLowerCase();
    return msg.contains('access denied') ||
        msg.contains('ruxsat') ||
        msg.contains('доступ запрещ');
  }
}
