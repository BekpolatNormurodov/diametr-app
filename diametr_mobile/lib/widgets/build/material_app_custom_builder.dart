import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:stroymarket/core/constants/constants.dart';
import 'package:stroymarket/services/connectivity/connectivity_service.dart';

class MaterialAppCustomBuilder {
  MaterialAppCustomBuilder._();
  static Widget builder(BuildContext context, Widget? child) {
    // App updates are handled by AppUpdateService (Play In-App Update),
    // triggered from HomeScreen.initState — not here.
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
      child: _NoInternetWrapper(
        child: child ?? const Scaffold(body: Center(child: Text("Error"))),
      ),
    );
  }
}

class _NoInternetWrapper extends StatefulWidget {
  final Widget child;
  const _NoInternetWrapper({required this.child});

  @override
  State<_NoInternetWrapper> createState() => _NoInternetWrapperState();
}

class _NoInternetWrapperState extends State<_NoInternetWrapper>
    with SingleTickerProviderStateMixin {
  bool _isOffline = false;
  bool _checking = false;
  StreamSubscription<InternetConnectionStatus>? _sub;
  late AnimationController _controller;
  late Animation<double> _fade;

  /// Manual re-check for the overlay's "try again" button. The stream already
  /// hides the overlay when the link returns, but a button gives the user
  /// immediate feedback instead of waiting for the next poll.
  Future<void> _retry() async {
    if (_checking) return;
    setState(() => _checking = true);
    final has = await InternetConnectionChecker.instance.hasConnection;
    if (!mounted) return;
    setState(() => _checking = false);
    if (has) {
      setState(() => _isOffline = false);
      _controller.reverse().then((_) {
        ConnectivityService.instance.notifyReconnect();
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 300));
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);

    // Check initial status
    InternetConnectionChecker.instance.hasConnection.then((has) {
      if (!has && mounted) {
        setState(() => _isOffline = true);
        _controller.forward();
      }
    });

    _sub = InternetConnectionChecker.instance.onStatusChange.listen((status) {
      final offline = status == InternetConnectionStatus.disconnected;
      if (offline == _isOffline) return;
      setState(() => _isOffline = offline);
      if (offline) {
        _controller.forward();
      } else {
        _controller.reverse().then((_) {
          ConnectivityService.instance.notifyReconnect();
        });
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_isOffline,
      child: Stack(
        children: [
          widget.child,
          FadeTransition(
            opacity: _fade,
            child: _isOffline || _controller.isAnimating
                ? _NoInternetOverlay(onRetry: _retry, checking: _checking)
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _NoInternetOverlay extends StatelessWidget {
  const _NoInternetOverlay({required this.onRetry, required this.checking});

  final Future<void> Function() onRetry;
  final bool checking;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      color: Colors.black.withValues(alpha: 0.75),
      child: Center(
        child: Container(
          margin: EdgeInsets.symmetric(horizontal: 32.w),
          padding: EdgeInsets.symmetric(horizontal: 28.w, vertical: 36.h),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
            borderRadius: BorderRadius.circular(24.r),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72.w,
                height: 72.w,
                decoration: BoxDecoration(
                  color: const Color(0xFFFF3B30).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.wifi_off_rounded,
                  color: const Color(0xFFFF3B30),
                  size: 34.sp,
                ),
              ),
              SizedBox(height: 20.h),
              Text(
                'no_internet_title'.tr(),
                style: TextStyle(
                  color: isDark ? Colors.white : const Color(0xFF1A1A2E),
                  fontSize: 20.sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: 10.h),
              Text(
                'no_internet_subtitle'.tr(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: (isDark ? Colors.white : const Color(0xFF1A1A2E))
                      .withValues(alpha: 0.55),
                  fontSize: 13.sp,
                  height: 1.6,
                ),
              ),
              SizedBox(height: 28.h),
              _PulsingDots(),
              SizedBox(height: 24.h),
              // ── Try again ──
              GestureDetector(
                onTap: checking ? null : onRetry,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 46.h,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppConstant.primaryColor
                        .withValues(alpha: checking ? 0.5 : 1),
                    borderRadius: BorderRadius.circular(14.r),
                  ),
                  alignment: Alignment.center,
                  child: checking
                      ? SizedBox(
                          width: 20.w,
                          height: 20.w,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.refresh_rounded,
                                color: Colors.white, size: 18.sp),
                            SizedBox(width: 8.w),
                            Text(
                              'no_internet_retry'.tr(),
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PulsingDots extends StatefulWidget {
  @override
  State<_PulsingDots> createState() => _PulsingDotsState();
}

class _PulsingDotsState extends State<_PulsingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) {
            final delay = i * 0.3;
            final t = ((_ctrl.value + delay) % 1.0);
            final opacity =
                (0.3 + 0.7 * (t < 0.5 ? t * 2 : (1 - t) * 2)).clamp(0.0, 1.0);
            return Container(
              margin: EdgeInsets.symmetric(horizontal: 4.w),
              width: 8.w,
              height: 8.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppConstant.primaryColor.withValues(alpha: opacity),
              ),
            );
          },
        );
      }),
    );
  }
}
