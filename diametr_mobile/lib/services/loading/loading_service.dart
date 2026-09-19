import '../../export_files.dart';
import '../auth/session_service.dart';

/// A single, app-wide blocking loading dialog.
///
/// Instances are cheap and created per screen, but the shown/closed state is
/// **static** on purpose: there must only ever be one loading dialog, and
/// [closeLoading] must be safe to call at any time, from anywhere — even after
/// the screen that opened it was disposed.
///
/// Two whole classes of bug are impossible now:
/// * The spinner can no longer be left running forever. The dialog lives on the
///   root navigator (via [SessionService.navigatorKey]), so [closeLoading]
///   closes it without needing the caller's context to still be mounted.
/// * [closeLoading] can no longer pop the real screen: it is a no-op unless we
///   actually opened a dialog, and it only ever pops that dialog route.
class LoadingService {
  static bool _isShowing = false;

  /// Whether a loading dialog is currently on screen.
  static bool get isShowing => _isShowing;

  void showLoading(BuildContext context) {
    if (_isShowing) return;
    _isShowing = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      useRootNavigator: true,
      barrierColor: AppConstant.primaryColor.withValues(alpha: 0.3),
      builder: (_) => PopScope(
        canPop: false,
        child: AlertDialog(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          elevation: 0,
          content: SizedBox(
            width: 160.w,
            height: 160.w,
            child: Center(
              child: CircularProgressIndicator(
                color: AppConstant.primaryColor,
                strokeWidth: 6.w,
                strokeAlign: 2,
                strokeCap: StrokeCap.round,
                backgroundColor: AppConstant.primaryColor.withValues(alpha: 0.2),
              ),
            ),
          ),
        ),
      ),
    ).whenComplete(() => _isShowing = false);
  }

  /// Closes the loading dialog if one is open. The [context] is optional and
  /// only a fallback; the dialog is normally closed through the global root
  /// navigator so it works even if the opening screen is gone.
  void closeLoading([BuildContext? context]) {
    if (!_isShowing) return;
    _isShowing = false;
    final rootNav = SessionService.navigatorKey.currentState;
    if (rootNav != null && rootNav.canPop()) {
      rootNav.pop();
      return;
    }
    if (context != null) {
      final nav = Navigator.of(context, rootNavigator: true);
      if (nav.canPop()) nav.pop();
    }
  }
}
