import '../../../export_files.dart';
// ignore: must_be_immutable
class HeaderSections extends StatelessWidget {
  HeaderSections({Key? key, required this.title, required this.onTap})
      : super(key: key);
  String title;
  VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          title,
          style: TextStyle(
            color: context.tText,
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
            decoration: BoxDecoration(
              color: AppConstant.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Text(
              'header_all'.tr(),
              style: TextStyle(
                color: AppConstant.primaryColor,
                fontSize: 12.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
