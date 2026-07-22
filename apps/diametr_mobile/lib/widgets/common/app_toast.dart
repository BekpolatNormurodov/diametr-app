import '../../export_files.dart';

enum ToastType { error, success, info, warning }

class AppToast {
  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.error,
    String? title,
    Duration duration = const Duration(seconds: 4),
  }) {
    final cfg = _ToastConfig.from(type);

    Flushbar(
      flushbarPosition: FlushbarPosition.TOP,
      flushbarStyle: FlushbarStyle.FLOATING,
      margin: EdgeInsets.fromLTRB(16.w, 14.h, 16.w, 0),
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      borderRadius: BorderRadius.circular(18.r),
      backgroundColor: cfg.bgColor,
      boxShadows: [
        BoxShadow(
          color: cfg.accentColor.withValues(alpha: 0.32),
          blurRadius: 20,
          offset: const Offset(0, 6),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.18),
          blurRadius: 12,
          offset: const Offset(0, 3),
        ),
      ],
      isDismissible: true,
      dismissDirection: FlushbarDismissDirection.HORIZONTAL,
      duration: duration,
      animationDuration: const Duration(milliseconds: 380),
      forwardAnimationCurve: Curves.easeOutBack,
      reverseAnimationCurve: Curves.easeIn,
      // ── Full custom row layout ──
      messageText: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 42.w,
            height: 42.w,
            decoration: BoxDecoration(
              color: cfg.accentColor.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(13.r),
            ),
            child: Icon(cfg.icon, color: cfg.accentColor, size: 21.sp),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title != null) ...[
                  Text(
                    title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w700,
                      height: 1.3,
                    ),
                  ),
                  SizedBox(height: 2.h),
                ],
                Text(
                  message,
                  style: TextStyle(
                    color: title != null
                        ? Colors.white.withValues(alpha: 0.82)
                        : Colors.white,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w400,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).show(context);
  }

  static void error(BuildContext context, String message, {String? title}) =>
      show(context, message: message, title: title, type: ToastType.error);

  static void success(BuildContext context, String message, {String? title}) =>
      show(context, message: message, title: title, type: ToastType.success);

  static void info(BuildContext context, String message, {String? title}) =>
      show(context, message: message, title: title, type: ToastType.info);

  static void warning(BuildContext context, String message, {String? title}) =>
      show(context, message: message, title: title, type: ToastType.warning);
}

class _ToastConfig {
  final Color bgColor;
  final Color accentColor;
  final IconData icon;

  const _ToastConfig({
    required this.bgColor,
    required this.accentColor,
    required this.icon,
  });

  factory _ToastConfig.from(ToastType type) {
    switch (type) {
      case ToastType.error:
        return _ToastConfig(
          bgColor: const Color(0xFF1E0A0A),
          accentColor: const Color(0xFFFF4D4D),
          icon: Iconsax.close_circle,
        );
      case ToastType.success:
        return _ToastConfig(
          bgColor: const Color(0xFF071A12),
          accentColor: const Color(0xFF00C48C),
          icon: Iconsax.tick_circle,
        );
      case ToastType.info:
        return _ToastConfig(
          bgColor: const Color(0xFF071020),
          accentColor: const Color(0xFF4D9FFF),
          icon: Iconsax.info_circle,
        );
      case ToastType.warning:
        return _ToastConfig(
          bgColor: const Color(0xFF1A1200),
          accentColor: const Color(0xFFFFAA00),
          icon: Iconsax.warning_2,
        );
    }
  }
}
