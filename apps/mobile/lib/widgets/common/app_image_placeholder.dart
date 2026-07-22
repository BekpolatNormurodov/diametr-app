import '../../export_files.dart';

/// Reusable, themed "no image" placeholder used wherever a remote/asset image
/// is missing or fails to load. Visual style is shared across the whole app.
///
/// Usage:
///   CachedNetworkImage(
///     errorWidget: (_, __, ___) => const AppImagePlaceholder(),
///   )
class AppImagePlaceholder extends StatelessWidget {
  /// Size of the centered icon "puck" (the white circle behind the icon).
  final double? puckSize;

  /// Size of the inner icon.
  final double? iconSize;

  /// If true, decorative blurred circles are hidden (use for very small tiles).
  final bool minimal;

  const AppImagePlaceholder({
    super.key,
    this.puckSize,
    this.iconSize,
    this.minimal = false,
  });

  @override
  Widget build(BuildContext context) {
    final primary = AppConstant.primaryColor;
    final double puck = puckSize ?? 56.w;
    final double icon = iconSize ?? 24.sp;

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primary.withValues(alpha: 0.18),
            primary.withValues(alpha: 0.06),
            context.tCard,
          ],
          stops: const [0.0, 0.55, 1.0],
        ),
      ),
      child: Stack(
        children: [
          if (!minimal) ...[
            Positioned(
              top: -20.h,
              right: -20.w,
              child: Container(
                width: 80.w,
                height: 80.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: primary.withValues(alpha: 0.10),
                ),
              ),
            ),
            Positioned(
              bottom: -16.h,
              left: -16.w,
              child: Container(
                width: 60.w,
                height: 60.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: primary.withValues(alpha: 0.08),
                ),
              ),
            ),
          ],
          Center(
            child: Container(
              width: puck,
              height: puck,
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
              alignment: Alignment.center,
              child: Icon(
                Iconsax.gallery_slash,
                size: icon,
                color: primary.withValues(alpha: 0.75),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
