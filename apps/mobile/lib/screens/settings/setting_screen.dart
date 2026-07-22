import 'package:package_info_plus/package_info_plus.dart';
import 'package:stroymarket/export_files.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _version = '';
  String _buildNumber = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() {
      _version = info.version;
      _buildNumber = info.buildNumber;
    });
  }

  @override
  Widget build(BuildContext context) {
    final scaffoldKey = GlobalKey<ScaffoldState>();
    final isDark = context.isDark;
    final currentLang = context.locale.languageCode;

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        'settings'.tr(),
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
      ),
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 24.h),
          physics: const BouncingScrollPhysics(),
          children: [
            // ── Language ──
            FadeUpWidget(
              delay: const Duration(milliseconds: 40),
              child: _sectionLabel(context,
                  icon: Iconsax.global, label: 'language_settings'.tr()),
            ),
            SizedBox(height: 12.h),
            FadeUpWidget(
              delay: const Duration(milliseconds: 80),
              child: _card(context, children: [
                _LangTile(
                  flag: '🇺🇿',
                  label: "O'zbek",
                  sublabel: "Uzbek tili",
                  isSelected: currentLang == 'uz',
                  onTap: () {
                    context.setLocale(const Locale('uz', 'UZ'));
                    GetStorage().write('app_lang', 'uz');
                    setState(() {});
                  },
                ),
                _divider(context),
                _LangTile(
                  flag: '🇷🇺',
                  label: 'Русский',
                  sublabel: "Rus tili",
                  isSelected: currentLang == 'ru',
                  onTap: () {
                    context.setLocale(const Locale('ru', 'RU'));
                    GetStorage().write('app_lang', 'ru');
                    setState(() {});
                  },
                ),
              ]),
            ),

            SizedBox(height: 32.h),

            // ── Theme ──
            FadeUpWidget(
              delay: const Duration(milliseconds: 140),
              child: _sectionLabel(context,
                  icon: isDark ? Iconsax.moon : Iconsax.sun_1,
                  label: 'theme_settings'.tr()),
            ),
            SizedBox(height: 12.h),
            FadeUpWidget(
              delay: const Duration(milliseconds: 180),
              child: _card(context, children: [
                _ThemeTile(
                  icon: Iconsax.sun_1,
                  label: 'light_theme'.tr(),
                  sublabel: "Yorug' rejim",
                  isSelected: !isDark,
                  onTap: () => context.read<ThemeCubit>().setLight(),
                ),
                _divider(context),
                _ThemeTile(
                  icon: Iconsax.moon,
                  label: 'dark_theme'.tr(),
                  sublabel: "Qorong'u rejim",
                  isSelected: isDark,
                  onTap: () => context.read<ThemeCubit>().setDark(),
                ),
              ]),
            ),

            SizedBox(height: 48.h),

            // ── Version ──
            FadeUpWidget(
              delay: const Duration(milliseconds: 240),
              child: Column(
                children: [
                  Container(
                    width: 44.w,
                    height: 44.w,
                    decoration: BoxDecoration(
                      color: AppConstant.primaryColor.withValues(alpha: 0.10),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Iconsax.info_circle,
                        color: AppConstant.primaryColor, size: 20.sp),
                  ),
                  SizedBox(height: 10.h),
                  Text(
                    'Diametr',
                    style: TextStyle(
                      color: context.tText,
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    _version.isEmpty
                        ? '—'
                        : 'v$_version${_buildNumber.isNotEmpty ? ' (' + _buildNumber + ')' : ''}',
                    style: TextStyle(color: context.tSub, fontSize: 12.sp),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(BuildContext ctx,
      {required IconData icon, required String label}) {
    return Row(
      children: [
        Container(
          width: 38.w,
          height: 38.w,
          decoration: BoxDecoration(
            color: AppConstant.primaryColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12.r),
          ),
          child:
              Icon(icon, color: AppConstant.primaryColor, size: 18.sp),
        ),
        SizedBox(width: 12.w),
        Text(
          label,
          style: TextStyle(
            color: ctx.tText,
            fontSize: 16.sp,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _card(BuildContext ctx, {required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: ctx.tCard,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black
                .withValues(alpha: ctx.isDark ? 0.22 : 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: children),
    );
  }

  Widget _divider(BuildContext ctx) => Divider(
        height: 0,
        thickness: 0.5,
        indent: 20.w,
        endIndent: 20.w,
        color: ctx.tDivider,
      );
}

// ── Language tile ──────────────────────────────────────────────

class _LangTile extends StatelessWidget {
  const _LangTile({
    required this.flag,
    required this.label,
    required this.sublabel,
    required this.isSelected,
    required this.onTap,
  });

  final String flag;
  final String label;
  final String sublabel;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
        decoration: BoxDecoration(
          color: isSelected
              ? AppConstant.primaryColor.withValues(alpha: 0.07)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Row(
          children: [
            Text(flag, style: TextStyle(fontSize: 26.sp)),
            SizedBox(width: 14.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: isSelected
                          ? AppConstant.primaryColor
                          : context.tText,
                      fontSize: 15.sp,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    sublabel,
                    style: TextStyle(
                      color: context.tSub,
                      fontSize: 12.sp,
                    ),
                  ),
                ],
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 22.w,
              height: 22.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected
                    ? AppConstant.primaryColor
                    : Colors.transparent,
                border: Border.all(
                  color: isSelected
                      ? AppConstant.primaryColor
                      : context.tDivider,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Icon(Icons.check, color: Colors.white, size: 12.sp)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Theme tile ─────────────────────────────────────────────────

class _ThemeTile extends StatelessWidget {
  const _ThemeTile({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String sublabel;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
        decoration: BoxDecoration(
          color: isSelected
              ? AppConstant.primaryColor.withValues(alpha: 0.07)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44.w,
              height: 44.w,
              decoration: BoxDecoration(
                color: isSelected
                    ? AppConstant.primaryColor
                    : context.tIconBg,
                borderRadius: BorderRadius.circular(13.r),
              ),
              child: Icon(
                icon,
                size: 22.sp,
                color: isSelected ? Colors.white : context.tSub,
              ),
            ),
            SizedBox(width: 14.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: isSelected
                          ? AppConstant.primaryColor
                          : context.tText,
                      fontSize: 15.sp,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    sublabel,
                    style: TextStyle(
                      color: context.tSub,
                      fontSize: 12.sp,
                    ),
                  ),
                ],
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 22.w,
              height: 22.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected
                    ? AppConstant.primaryColor
                    : Colors.transparent,
                border: Border.all(
                  color: isSelected
                      ? AppConstant.primaryColor
                      : context.tDivider,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Icon(Icons.check, color: Colors.white, size: 12.sp)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
