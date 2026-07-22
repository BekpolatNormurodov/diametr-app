import 'package:flutter/foundation.dart';

/// Beautiful console logger — only prints in debug mode.
///
/// Usage:
///   AppLogger.request(method: 'POST', url: '/auth/login', data: body);
///   AppLogger.response(method: 'POST', url: '/auth/login', status: 200, ms: 142);
///   AppLogger.error(method: 'POST', url: '/auth/login', status: 401, message: 'Unauthorized');
///   AppLogger.info('Auth', 'Token saved');
class AppLogger {
  // ── ANSI colours ────────────────────────────────────────────────
  static const _r = '\x1B[0m';   // reset
  static const _b = '\x1B[1m';   // bold
  static const _d = '\x1B[2m';   // dim
  static const _green   = '\x1B[32m';
  static const _yellow  = '\x1B[33m';
  static const _cyan    = '\x1B[36m';
  static const _red     = '\x1B[31m';
  static const _magenta = '\x1B[35m';
  static const _blue    = '\x1B[34m';
  static const _white   = '\x1B[37m';
  static const _gray    = '\x1B[90m';

  static void _out(String msg) {
    if (kDebugMode) debugPrint(msg);
  }

  static String _mc(String method) => switch (method.toUpperCase()) {
        'GET'    => _cyan,
        'POST'   => _green,
        'PUT'    => _yellow,
        'PATCH'  => _magenta,
        'DELETE' => _red,
        _        => _white,
      };

  static String _sc(int status) {
    if (status >= 500) return _red;
    if (status >= 400) return _yellow;
    if (status >= 300) return _cyan;
    return _green;
  }

  static String _ms(int ms) {
    if (ms < 300) return '$_green${ms}ms$_r';
    if (ms < 800) return '$_yellow${ms}ms$_r';
    return '$_red${ms}ms$_r';
  }

  static String _trim(String s, [int max = 220]) =>
      s.length > max ? '${s.substring(0, max)}…' : s;

  // ── Public API ───────────────────────────────────────────────────

  /// Log outgoing request.
  static void request({
    required String method,
    required String url,
    dynamic data,
  }) {
    final mc = _mc(method);
    _out('$_b${mc}→ ${method.padRight(6)}$_r $_white$url$_r');
    if (data != null && data.toString().isNotEmpty) {
      _out('$_d$_gray  ↳ ${_trim(data.toString())}$_r');
    }
  }

  /// Log successful response.
  static void response({
    required String method,
    required String url,
    required int status,
    required int ms,
  }) {
    final mc = _mc(method);
    final sc = _sc(status);
    _out(
      '$_b${mc}← ${method.padRight(6)}$_r '
      '$_white$url$_r  '
      '$_b${sc}$status$_r  '
      '$_gray▸$_r ${_ms(ms)}',
    );
  }

  /// Log error response.
  static void error({
    required String method,
    required String url,
    required int status,
    int ms = 0,
    required String message,
  }) {
    final mc = _mc(method);
    _out(
      '$_b${mc}✗ ${method.padRight(6)}$_r '
      '$_white$url$_r  '
      '$_b$_red$status$_r  '
      '${ms > 0 ? '${_ms(ms)}  ' : ''}'
      '$_red$message$_r',
    );
  }

  /// General info log.
  static void info(String tag, String message) {
    _out('$_b$_blue[$tag]$_r $_white$message$_r');
  }

  /// General warning log.
  static void warn(String tag, String message) {
    _out('$_b$_yellow[$tag]$_r $_yellow$message$_r');
  }
}
