import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:iconsax/iconsax.dart';
import 'package:stroymarket/core/constants/constants.dart';
import 'package:stroymarket/core/extensions/theme_ext.dart';

/// Universal "data loading" indicator.
///
/// Replaces ugly `CircularProgressIndicator + "Ma'lumot yuklanmoqda..."`
/// blocks with a polished pulsing circle, branded icon and animated dots.
class AppLoading extends StatefulWidget {
  final String? label;
  final IconData icon;
  final double size;
  final EdgeInsetsGeometry padding;

  const AppLoading({
    super.key,
    this.label,
    this.icon = Iconsax.box,
    this.size = 96,
    this.padding = const EdgeInsets.symmetric(vertical: 48),
  });

  @override
  State<AppLoading> createState() => _AppLoadingState();
}

class _AppLoadingState extends State<AppLoading>
    with TickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat(reverse: true);

  late final AnimationController _spin = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  )..repeat();

  late final AnimationController _dots = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat();

  @override
  void dispose() {
    _pulse.dispose();
    _spin.dispose();
    _dots.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final double s = widget.size.w;
    final Color primary = AppConstant.primaryColor;

    return Padding(
      padding: widget.padding,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: s,
              height: s,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Outer pulsing ring
                  ScaleTransition(
                    scale: Tween<double>(begin: 0.85, end: 1.05)
                        .animate(CurvedAnimation(
                      parent: _pulse,
                      curve: Curves.easeInOut,
                    )),
                    child: FadeTransition(
                      opacity: Tween<double>(begin: 0.15, end: 0.35)
                          .animate(_pulse),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: primary.withValues(alpha: 0.18),
                        ),
                      ),
                    ),
                  ),
                  // Rotating gradient arc
                  RotationTransition(
                    turns: _spin,
                    child: SizedBox(
                      width: s * 0.78,
                      height: s * 0.78,
                      child: CustomPaint(
                        painter: _ArcPainter(color: primary),
                      ),
                    ),
                  ),
                  // Center puck with icon
                  Container(
                    width: s * 0.5,
                    height: s * 0.5,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: context.tCard,
                      boxShadow: [
                        BoxShadow(
                          color: primary.withValues(alpha: 0.18),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      widget.icon,
                      color: primary,
                      size: s * 0.24,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 22.h),
            AnimatedBuilder(
              animation: _dots,
              builder: (_, __) {
                final int active = (_dots.value * 3).floor() % 3;
                final String label = widget.label ?? 'Yuklanmoqda';
                final String dots = '.' * (active + 1);
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        color: context.tText,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.2,
                      ),
                    ),
                    SizedBox(
                      width: 18.w,
                      child: Text(
                        dots,
                        style: TextStyle(
                          color: primary,
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w700,
                          height: 1,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  final Color color;
  _ArcPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final Rect rect = Offset.zero & size;
    final Paint paint = Paint()
      ..shader = SweepGradient(
        colors: [
          color.withValues(alpha: 0.0),
          color.withValues(alpha: 0.0),
          color.withValues(alpha: 0.55),
          color,
        ],
        stops: const [0.0, 0.55, 0.85, 1.0],
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.07
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      rect.deflate(paint.strokeWidth / 2),
      -1.57, // -π/2
      4.6,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _ArcPainter oldDelegate) => false;
}
