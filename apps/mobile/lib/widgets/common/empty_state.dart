import '../../export_files.dart';

/// Reusable "nothing here" state shown when a list/detail is empty.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final double? height;
  final VoidCallback? onAction;
  final String? actionLabel;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.height,
    this.onAction,
    this.actionLabel,
  });

  @override
  Widget build(BuildContext context) {
    final content = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Soft layered circles around the icon
        SizedBox(
          width: 120.w,
          height: 120.w,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 120.w,
                height: 120.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppConstant.primaryColor.withValues(alpha: 0.06),
                ),
              ),
              Container(
                width: 90.w,
                height: 90.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppConstant.primaryColor.withValues(alpha: 0.10),
                ),
              ),
              Container(
                width: 64.w,
                height: 64.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppConstant.primaryColor.withValues(alpha: 0.16),
                ),
                child: Icon(
                  icon,
                  color: AppConstant.primaryColor,
                  size: 30.sp,
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 18.h),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 32.w),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: context.tText,
              fontSize: 16.sp,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        if (subtitle != null) ...[
          SizedBox(height: 6.h),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 40.w),
            child: Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.tSub,
                fontSize: 13.sp,
                fontWeight: FontWeight.w400,
                height: 1.4,
              ),
            ),
          ),
        ],
        if (onAction != null && actionLabel != null) ...[
          SizedBox(height: 18.h),
          GestureDetector(
            onTap: onAction,
            child: Container(
              padding:
                  EdgeInsets.symmetric(horizontal: 22.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: AppConstant.primaryColor,
                borderRadius: BorderRadius.circular(12.r),
                boxShadow: [
                  BoxShadow(
                    color:
                        AppConstant.primaryColor.withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Text(
                actionLabel!,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ],
    );

    return SizedBox(
      width: double.infinity,
      height: height,
      child: Center(child: content),
    );
  }
}
