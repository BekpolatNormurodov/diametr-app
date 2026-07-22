
import 'package:stroymarket/export_files.dart';
import 'package:stroymarket/manager/1_phone_manager.dart';

import '../../bloc/1_send_sms/send_sms_bloc.dart';
import '../../bloc/1_send_sms/send_sms_state.dart';
import '../../services/loading/loading_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final TextEditingController phonecontroller = TextEditingController();
  LoadingService loadingService = LoadingService();
  final phoneMask = MaskTextInputFormatter(
    mask: '(##) ###-##-##',
    filter: {"#": RegExp(r'[0-9]')},
    type: MaskAutoCompletionType.eager,
  );

  bool get _ready => phonecontroller.text.length == 14;
  bool _isSubmitting = false;

  Widget _buildLangChip(
      BuildContext context, String label, String lang, String country) {
    final isActive = context.locale.languageCode == lang;
    return GestureDetector(
      onTap: () {
        context.setLocale(Locale(lang, country));
        GetStorage().write('app_lang', lang);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding:
            EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: isActive ? AppConstant.primaryColor : context.tCard,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(
            color: isActive
                ? AppConstant.primaryColor
                : context.tDivider,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppConstant.primaryColor
                        .withValues(alpha: 0.30),
                    blurRadius: 10,
                    spreadRadius: 1,
                  )
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : context.tSub,
            fontSize: 12.sp,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Scaffold(
      backgroundColor: context.tBg,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // ── Ambient glow top-left ──
          Positioned(
            top: -70,
            left: -40,
            child: Container(
              width: 240.w,
              height: 240.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  AppConstant.primaryColor.withValues(alpha: 0.18),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          // ── Ambient glow bottom-right ──
          Positioned(
            bottom: 180,
            right: -50,
            child: Container(
              width: 180.w,
              height: 180.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  AppConstant.primaryColor.withValues(alpha: 0.10),
                  Colors.transparent,
                ]),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // ── Language switcher ──
                Padding(
                  padding:
                      EdgeInsets.fromLTRB(20.w, 14.h, 20.w, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      _buildLangChip(
                          context, "O'Z", 'uz', 'UZ'),
                      SizedBox(width: 8.w),
                      _buildLangChip(
                          context, 'РУС', 'ru', 'RU'),
                    ],
                  ),
                ),
                // ── Brand section ──
                Expanded(
                  flex: 6,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      FadeUpWidget(
                        delay: const Duration(milliseconds: 80),
                        child: Container(
                          width: 88.w,
                          height: 88.w,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1A1A2E)
                                : AppConstant.primaryColor
                                    .withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(26.r),
                            border: Border.all(
                              color: AppConstant.primaryColor
                                  .withValues(alpha: 0.28),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppConstant.primaryColor
                                    .withValues(alpha: 0.22),
                                blurRadius: 28,
                                spreadRadius: 2,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          padding: EdgeInsets.all(14.w),
                          child: Image.asset(
                              'assets/images/stroymarket1.png'),
                        ),
                      ),
                      SizedBox(height: 20.h),
                      FadeUpWidget(
                        delay: const Duration(milliseconds: 160),
                        child: Text(
                          'Diametr',
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 32.sp,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -1.2,
                          ),
                        ),
                      ),
                      SizedBox(height: 10.h),
                      FadeUpWidget(
                        delay: const Duration(milliseconds: 220),
                        child: SizedBox(
                          width: 250.w,
                          child: Text(
                            'login_tagline'.tr(),
                            style: TextStyle(
                              color: context.tSub,
                              fontSize: 13.sp,
                              fontWeight: FontWeight.w400,
                              height: 1.6,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Input card ──
                FadeUpWidget(
                  delay: const Duration(milliseconds: 300),
                  child: Container(
                    padding:
                        EdgeInsets.fromLTRB(20.w, 10.h, 20.w, 30.h),
                    decoration: BoxDecoration(
                      color: context.tCard,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(32.r),
                        topRight: Radius.circular(32.r),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(
                              alpha: isDark ? 0.35 : 0.08),
                          blurRadius: 24,
                          offset: const Offset(0, -6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // handle
                        Center(
                          child: Container(
                            width: 40.w,
                            height: 4.h,
                            margin: EdgeInsets.symmetric(vertical: 14.h),
                            decoration: BoxDecoration(
                              color: context.tDivider,
                              borderRadius: BorderRadius.circular(2.r),
                            ),
                          ),
                        ),
                        Text(
                          'login'.tr(),
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 24.sp,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.8,
                          ),
                        ),
                        SizedBox(height: 4.h),
                        Text(
                          'login_phone_hint'.tr(),
                          style: TextStyle(
                            color: context.tSub,
                            fontSize: 13.sp,
                          ),
                        ),
                        SizedBox(height: 20.h),

                        // ── Phone field ──
                        Container(
                          height: 54.h,
                          decoration: BoxDecoration(
                            color: context.tInput,
                            borderRadius: BorderRadius.circular(14.r),
                            border: Border.all(
                                color: context.tDivider, width: 1.0),
                          ),
                          child: Row(
                            children: [
                              SizedBox(width: 16.w),
                              Icon(Iconsax.call,
                                  size: 18.sp,
                                  color: AppConstant.primaryColor),
                              SizedBox(width: 8.w),
                              Text(
                                "+998",
                                style: TextStyle(
                                  color: context.tText,
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 20.h,
                                margin: EdgeInsets.symmetric(
                                    horizontal: 10.w),
                                color: context.tDivider,
                              ),
                              Expanded(
                                child: TextFormField(
                                  controller: phonecontroller,
                                  onChanged: (_) => setState(() {}),
                                  inputFormatters: [phoneMask],
                                  keyboardType: TextInputType.number,
                                  style: TextStyle(
                                    color: context.tText,
                                    fontSize: 15.sp,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  cursorColor: AppConstant.primaryColor,
                                  decoration: InputDecoration(
                                    border: InputBorder.none,
                                    hintText: '(XX) XXX-XX-XX',
                                    hintStyle: TextStyle(
                                      color: context.tSub,
                                      fontSize: 14.sp,
                                    ),
                                    isDense: true,
                                    contentPadding:
                                        EdgeInsets.only(right: 12.w),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 16.h),

                        // ── Send button ──
                        GestureDetector(
                          onTap: () async {
                            if (_ready && !_isSubmitting) {
                              setState(() => _isSubmitting = true);
                              await PhoneManager.sendSms(
                                context,
                                phone: '998' +
                                    phoneMask.unmaskText(
                                        phonecontroller.text),
                              );
                              if (mounted) setState(() => _isSubmitting = false);
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            height: 52.h,
                            decoration: BoxDecoration(
                              color: _ready
                                  ? AppConstant.primaryColor
                                  : context.tIconBg,
                              borderRadius: BorderRadius.circular(14.r),
                              boxShadow: _ready
                                  ? [
                                      BoxShadow(
                                        color: AppConstant.primaryColor
                                            .withValues(alpha: 0.38),
                                        blurRadius: 14,
                                        offset: const Offset(0, 5),
                                      )
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Iconsax.sms,
                                  color: _ready
                                      ? Colors.white
                                      : context.tSub,
                                  size: 18.sp,
                                ),
                                SizedBox(width: 8.w),
                                Text(
                                  'send_sms_btn'.tr(),
                                  style: TextStyle(
                                    color: _ready
                                        ? Colors.white
                                        : context.tSub,
                                    fontSize: 15.sp,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(height: 10.h),
                      ],
                    ),
                  ),
                ),

                BlocListener<SendSmsBloc, SendSmsState>(
                  child: const SizedBox.shrink(),
                  listener: (context, state) async {
                    if (state is SendSmsWaitingState) {
                      loadingService.showLoading(context);
                    } else if (state is SendSmsErrorState) {
                      loadingService.closeLoading(context);
                      AppToast.error(
                        context,
                        state.message ?? 'error_occurred'.tr(),
                        title: 'send_failed'.tr(),
                      );
                    } else if (state is SendSmsSuccessState) {
                      loadingService.closeLoading(context);
                      Navigator.of(context).pushNamed(
                        '/smsScreen',
                        arguments: {'id': state.data["id"]},
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
