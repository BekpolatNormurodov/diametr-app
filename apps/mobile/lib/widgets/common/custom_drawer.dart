import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:stroymarket/export_files.dart';
import 'package:stroymarket/services/storage/storage_service.dart';
import 'package:stroymarket/widgets/common/custom_alert.dart';

// ignore: must_be_immutable
class CustomDrawer extends StatelessWidget {
  CustomDrawer({super.key, required this.scaffoldKey});
  GlobalKey<ScaffoldState> scaffoldKey;

  logoutWidget(BuildContext context) {
    return SizedBox(
      width: 300.w,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: 8.h),
          // ── Red icon ──
          Container(
            width: 64.w,
            height: 64.w,
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Iconsax.logout, color: Colors.red, size: 28.sp),
          ),
          SizedBox(height: 16.h),
          Text(
            'logout'.tr(),
            style: TextStyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.w700,
              color: context.tText,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'logout_confirm'.tr(),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13.sp,
              fontWeight: FontWeight.w400,
              color: context.tSub,
              height: 1.5,
            ),
          ),
          SizedBox(height: 28.h),
          Row(
            children: [
              // Cancel
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.of(scaffoldKey.currentContext!).pop(),
                  child: Container(
                    height: 48.h,
                    decoration: BoxDecoration(
                      color: context.tInput,
                      borderRadius: BorderRadius.circular(14.r),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'no'.tr(),
                      style: TextStyle(
                        color: context.tText,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              // Logout
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    Future.wait([
                      StorageService().remove(StorageService.token),
                      StorageService().remove(StorageService.user),
                    ]);
                    Navigator.pushNamedAndRemoveUntil(
                      scaffoldKey.currentContext!,
                      RouteNames.loginScreen,
                      (route) => false,
                    );
                  },
                  child: Container(
                    height: 48.h,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(14.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.red.withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'yes'.tr(),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 4.h),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = StorageService().read(StorageService.user);
    final svc = StorageService();
    final int favsCount =
        ((svc.read(StorageService.favProducts) as List?)?.length ?? 0) +
        ((svc.read(StorageService.favShops) as List?)?.length ?? 0);

    // divider appears before about/share/contact group AND before logout
    bool _needsDivider(int index) => index == 7 || index == 10;

    final List<IconData> tileIcon = [
      Iconsax.clock,
      Iconsax.heart,
      Iconsax.box,
      Iconsax.shop,
      Iconsax.brush_1,
      Iconsax.document_text,
      Iconsax.setting_2,
      Iconsax.info_circle,
      Iconsax.share,
      Iconsax.call,
      Iconsax.logout,
    ];
    final List<String> tileText = [
      'history'.tr(),
      'favorites'.tr(),
      'products'.tr(),
      'shops'.tr(),
      'services'.tr(),
      'news'.tr(),
      'settings'.tr(),
      'about_us'.tr(),
      'drawer_share'.tr(),
      'about_contact'.tr(),
      'logout'.tr(),
    ];
    final List<String> screens = [
      '/historyScreen',
      '/favoritesScreen',
      '/categoryScreen',
      '/marketAllScreen',
      '/serviceAllScreen',
      '/newsScreen',
      '/settingsScreen',
      '/aboutScreen',
      '__share__',
      '__contact__',
      '/',
    ];

    return Drawer(
      width: MediaQuery.of(context).size.width / 1.5,
      elevation: 0,
      backgroundColor: context.tBg,
      child: SafeArea(
        child: Column(
          children: [
            SizedBox(height: 20.h),
            // ── User profile ──
            FadeUpWidget(
              delay: const Duration(milliseconds: 50),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: Row(
                  children: [
                    Container(
                      width: 46.w,
                      height: 46.w,
                      decoration: BoxDecoration(
                        color: AppConstant.primaryColor.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          Iconsax.user,
                          color: AppConstant.primaryColor,
                          size: 22.sp,
                        ),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user == null ? "- - -" : user["phone"].toString(),
                            style: TextStyle(
                              color: context.tText,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'user'.tr(),
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16.h),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Container(height: 0.5, color: context.tDivider),
            ),
            SizedBox(height: 8.h),
            // ── Nav items ──
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.symmetric(vertical: 4.h),
                scrollDirection: Axis.vertical,
                shrinkWrap: true,
                itemCount: tileIcon.length,
                itemBuilder: (context, index) {
                  final isLogout = index == 10;
                  final isExtra = index >= 7 && index <= 9; // about/share/contact
                  return FadeUpWidget(
                    delay: Duration(milliseconds: 60 + 40 * index),
                    child: Column(
                      children: [
                        if (_needsDivider(index))
                          Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: 16.w, vertical: 4.h),
                            child: Container(
                                height: 0.5, color: context.tDivider),
                          ),
                        ListTile(
                          dense: true,
                          visualDensity: VisualDensity.compact,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 16.w, vertical: 2.h),
                          leading: Container(
                            width: 36.w,
                            height: 36.w,
                            decoration: BoxDecoration(
                              color: isLogout
                                  ? Colors.red.withValues(alpha: 0.08)
                                  : isExtra
                                      ? const Color(0xFF229ED9).withValues(alpha: 0.08)
                                      : AppConstant.primaryColor.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: Icon(
                              tileIcon[index],
                              color: isLogout
                                  ? Colors.red
                                  : isExtra
                                      ? const Color(0xFF229ED9)
                                      : AppConstant.primaryColor,
                              size: 18.sp,
                            ),
                          ),
                          title: Text(
                            tileText[index],
                            style: TextStyle(
                              color: isLogout
                                  ? Colors.red
                                  : context.tText,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          trailing: index == 1 && favsCount > 0
                              ? Container(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 8.w, vertical: 2.h),
                                  decoration: BoxDecoration(
                                    color: AppConstant.primaryColor
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(10.r),
                                    border: Border.all(
                                        color: AppConstant.primaryColor
                                            .withValues(alpha: 0.20)),
                                  ),
                                  child: Text(
                                    '$favsCount',
                                    style: TextStyle(
                                      color: AppConstant.primaryColor,
                                      fontSize: 12.sp,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                )
                              : null,
                          onTap: () {
                            Navigator.of(context).pop(); // close drawer
                            if (isLogout) {
                              customAlert(
                                scaffoldKey.currentContext!,
                                logoutWidget(scaffoldKey.currentContext!),
                              );
                            } else if (screens[index] == '__share__') {
                              Share.share(
                                'Diametr — qurilish materiallari do\'koni!\nIlovani yuklab oling: https://t.me/diametr_uz',
                              );
                            } else if (screens[index] == '__contact__') {
                              launchUrl(
                                Uri.parse('https://t.me/diametr_uz'),
                                mode: LaunchMode.externalApplication,
                              );
                            } else {
                              Navigator.of(scaffoldKey.currentContext!)
                                  .pushNamed(screens[index]);
                            }
                          },
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
