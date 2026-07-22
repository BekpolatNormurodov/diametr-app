import 'package:package_info_plus/package_info_plus.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../export_files.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  // ── change these to real values ───────────────────────────────────
  static const String _appName = 'Diametr';
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

  static const String _telegramLink = 'https://t.me/diametr_uz';
  static const String _telegramChannel = 'https://t.me/diametr_uz';
  static const String _instagramLink = 'https://www.instagram.com/diametr.uz';
  static const String _youtubeLink = 'https://www.youtube.com/@diametr_uz';
  static const String _privacyLink =
      'https://diametr.uz/diametr-mobile.privacy-policy.md';
  static const String _phone = '+998955055444';
  static const String _shareText =
      'Diametr — qurilish materiallari do\'koni!\nIlovani yuklab oling: https://t.me/diametr_uz';

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.tBg,
      appBar: AppBar(
        backgroundColor: context.tBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            margin: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: AppConstant.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10.r),
              border: Border.all(
                  color: AppConstant.primaryColor.withValues(alpha: 0.20)),
            ),
            child: Center(
              child: Icon(Iconsax.arrow_left,
                  color: AppConstant.primaryColor, size: 18.sp),
            ),
          ),
        ),
        title: Text(
          'about_us'.tr(),
          style: TextStyle(
              color: context.tText,
              fontSize: 18.sp,
              fontWeight: FontWeight.w600),
        ),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(0.5.h),
          child: Container(height: 0.5.h, color: context.tDivider),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 28.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Logo card ──
            Center(
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(vertical: 32.h),
                decoration: BoxDecoration(
                  color: context.tCard,
                  borderRadius: BorderRadius.circular(20.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 72.w,
                      height: 72.w,
                      decoration: BoxDecoration(
                        color: AppConstant.primaryColor.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(Iconsax.shop,
                            color: AppConstant.primaryColor, size: 34.sp),
                      ),
                    ),
                    SizedBox(height: 14.h),
                    Text(
                      _appName,
                      style: TextStyle(
                          color: context.tText,
                          fontSize: 22.sp,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      _version.isEmpty
                          ? '—'
                          : 'v$_version${_buildNumber.isNotEmpty ? ' (' + _buildNumber + ')' : ''}',
                      style: TextStyle(color: context.tSub, fontSize: 13.sp),
                    ),
                    SizedBox(height: 12.h),
                    Container(
                      margin: EdgeInsets.symmetric(horizontal: 24.w),
                      child: Text(
                        'about_description'.tr(),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: context.tSub,
                            fontSize: 13.sp,
                            height: 1.55),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            SizedBox(height: 24.h),

            // ── Actions ──
            _ActionTile(
              icon: Iconsax.send_2,
              label: 'about_share'.tr(),
              subtitle: 'about_share_sub'.tr(),
              color: const Color(0xFF007AFF),
              onTap: () => Share.share(_shareText),
            ),
            SizedBox(height: 12.h),
            _ActionTile(
              icon: Iconsax.message_text,
              label: 'about_contact'.tr(),
              subtitle: _telegramLink,
              color: const Color(0xFF229ED9),
              onTap: () => _launch(_telegramLink),
            ),
            SizedBox(height: 12.h),
            _ActionTile(
              icon: Iconsax.call,
              label: 'about_phone'.tr(),
              subtitle: _phone,
              color: AppConstant.primaryColor,
              onTap: () => _launch('tel:$_phone'),
            ),

            SizedBox(height: 28.h),

            // ── Social media ──
            _SectionLabel(label: 'about_social'.tr()),
            SizedBox(height: 14.h),
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(vertical: 20.h),
              decoration: BoxDecoration(
                color: context.tCard,
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _SocialButton(
                    icon: Iconsax.instagram,
                    label: 'Instagram',
                    color: const Color(0xFFE1306C),
                    onTap: () => _launch(_instagramLink),
                  ),
                  _SocialButton(
                    icon: Iconsax.send_2,
                    label: 'Telegram',
                    color: const Color(0xFF229ED9),
                    onTap: () => _launch(_telegramChannel),
                  ),
                  _SocialButton(
                    icon: Iconsax.play_circle,
                    label: 'YouTube',
                    color: const Color(0xFFFF3B30),
                    onTap: () => _launch(_youtubeLink),
                  ),
                ],
              ),
            ),

            SizedBox(height: 16.h),

            // ── Privacy & Terms ──
            _ActionTile(
              icon: Iconsax.shield_tick,
              label: 'about_privacy'.tr(),
              subtitle: 'about_privacy_sub'.tr(),
              color: const Color(0xFF34C759),
              onTap: () => _launch(_privacyLink),
            ),

            SizedBox(height: 28.h),

            // ── FAQ ──
            _SectionLabel(label: 'about_faq'.tr()),
            SizedBox(height: 14.h),
            Container(
              decoration: BoxDecoration(
                color: context.tCard,
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Column(
                children: [
                  _FaqItem(
                    question: 'about_faq_q1'.tr(),
                    answer: 'about_faq_a1'.tr(),
                  ),
                  Divider(
                      color: context.tDivider,
                      thickness: 0.5,
                      height: 0,
                      indent: 16.w,
                      endIndent: 16.w),
                  _FaqItem(
                    question: 'about_faq_q2'.tr(),
                    answer: 'about_faq_a2'.tr(),
                  ),
                  Divider(
                      color: context.tDivider,
                      thickness: 0.5,
                      height: 0,
                      indent: 16.w,
                      endIndent: 16.w),
                  _FaqItem(
                    question: 'about_faq_q3'.tr(),
                    answer: 'about_faq_a3'.tr(),
                  ),
                ],
              ),
            ),

            SizedBox(height: 32.h),

            // ── Footer ──
            Center(
              child: Column(
                children: [
                  Text(
                    '© ${DateTime.now().year} $_appName',
                    style: TextStyle(color: context.tSub, fontSize: 12.sp),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    'about_rights'.tr(),
                    style: TextStyle(color: context.tSub, fontSize: 11.sp),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42.w,
              height: 42.w,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Center(
                child: Icon(icon, color: color, size: 20.sp),
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
                        color: context.tText,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    subtitle,
                    style:
                        TextStyle(color: context.tSub, fontSize: 12.sp),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Iconsax.arrow_right_3, color: context.tSub, size: 16.sp),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        color: context.tText,
        fontSize: 15.sp,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56.w,
            height: 56.w,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(color: color.withValues(alpha: 0.30)),
            ),
            child: Center(child: Icon(icon, color: color, size: 24.sp)),
          ),
          SizedBox(height: 6.h),
          Text(label, style: TextStyle(color: context.tSub, fontSize: 12.sp)),
        ],
      ),
    );
  }
}

class _FaqItem extends StatelessWidget {
  final String question;
  final String answer;

  const _FaqItem({required this.question, required this.answer});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 2.h),
        childrenPadding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 14.h),
        iconColor: AppConstant.primaryColor,
        collapsedIconColor: context.tSub,
        title: Text(
          question,
          style: TextStyle(
            color: context.tText,
            fontSize: 14.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
        children: [
          Text(
            answer,
            style: TextStyle(color: context.tSub, fontSize: 13.sp, height: 1.6),
          ),
        ],
      ),
    );
  }
}
