
import 'package:stroymarket/export_files.dart';
import 'package:stroymarket/manager/1_phone_manager.dart';

import '../../bloc/2_verify/verify_bloc.dart';
import '../../bloc/2_verify/verify_state.dart';
import '../../services/loading/loading_service.dart';
import '../../services/storage/storage_service.dart';

class SmsScreen extends StatefulWidget {
  const SmsScreen({super.key, required this.id});
  final String? id;

  @override
  State<SmsScreen> createState() => _SmsScreenState();
}

class _SmsScreenState extends State<SmsScreen>
    with TickerProviderStateMixin {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final TextEditingController smscontroller = TextEditingController();
  LoadingService loadingService = LoadingService();

  // ── Timer ──────────────────────────────────────────────────
  static const int _totalSeconds = 120;
  int _remaining = _totalSeconds;
  Timer? _timer;
  bool _canResend = false;

  bool _isSubmitting = false;

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnim =
        CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
    _startTimer();
  }

  void _startTimer() {
    _remaining = _totalSeconds;
    _canResend = false;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        if (_remaining > 0) {
          _remaining--;
        } else {
          _canResend = true;
          t.cancel();
        }
      });
    });
  }

  String get _timerText {
    final m = _remaining ~/ 60;
    final s = _remaining % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get _timerProgress => _remaining / _totalSeconds;

  @override
  void dispose() {
    _timer?.cancel();
    _fadeCtrl.dispose();
    smscontroller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    final defaultPin = PinTheme(
      width: 48.w,
      height: 54.h,
      textStyle: TextStyle(
        fontSize: 20.sp,
        color: context.tText,
        fontWeight: FontWeight.w700,
      ),
      decoration: BoxDecoration(
        color: context.tInput,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: context.tDivider),
      ),
    );

    final focusedPin = defaultPin.copyWith(
      decoration: BoxDecoration(
        color: AppConstant.primaryColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14.r),
        border:
            Border.all(color: AppConstant.primaryColor, width: 2),
      ),
    );

    final submittedPin = defaultPin.copyWith(
      textStyle: TextStyle(
        fontSize: 20.sp,
        color: isDark ? Colors.white : AppConstant.darkColor,
        fontWeight: FontWeight.w700,
      ),
      decoration: BoxDecoration(
        color: AppConstant.primaryColor.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
            color: AppConstant.primaryColor.withValues(alpha: 0.45)),
      ),
    );

    final bool codeReady = smscontroller.text.length == 6;

    return Scaffold(
      backgroundColor: context.tBg,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // ── Ambient glow ──
          Positioned(
            top: -50,
            right: -40,
            child: Container(
              width: 200.w,
              height: 200.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  AppConstant.primaryColor.withValues(alpha: 0.16),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          Positioned(
            bottom: 200,
            left: -50,
            child: Container(
              width: 160.w,
              height: 160.w,
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
            child: FadeTransition(
              opacity: _fadeAnim,
              child: Column(
                children: [
                  // ── Back button ──
                  Padding(
                    padding:
                        EdgeInsets.fromLTRB(16.w, 10.h, 16.w, 0),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: Container(
                            padding: EdgeInsets.all(10.w),
                            decoration: BoxDecoration(
                              color: context.tCard,
                              borderRadius:
                                  BorderRadius.circular(12.r),
                              border: Border.all(
                                  color: context.tDivider),
                            ),
                            child: Icon(
                              Iconsax.arrow_left_2,
                              size: 20.sp,
                              color: context.tText,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // ── Top ──
                  Expanded(
                    flex: 5,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Icon box
                        Container(
                          width: 82.w,
                          height: 82.w,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1A1A2E)
                                : AppConstant.primaryColor
                                    .withValues(alpha: 0.08),
                            borderRadius:
                                BorderRadius.circular(26.r),
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
                              ),
                            ],
                          ),
                          child: Icon(
                            Iconsax.message_tick,
                            color: AppConstant.primaryColor,
                            size: 36.sp,
                          ),
                        ),
                        SizedBox(height: 20.h),
                        Text(
                          'sms_title'.tr(),
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 26.sp,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.8,
                          ),
                        ),
                        SizedBox(height: 8.h),
                        SizedBox(
                          width: 260.w,
                          child: Text(
                            'sms_subtitle'.tr(),
                            style: TextStyle(
                              color: context.tSub,
                              fontSize: 13.sp,
                              height: 1.55,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Bottom card ──
                  Container(
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
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Handle
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

                        // ── Pinput ──
                        Pinput(
                          length: 6,
                          controller: smscontroller,
                          defaultPinTheme: defaultPin,
                          focusedPinTheme: focusedPin,
                          submittedPinTheme: submittedPin,
                          androidSmsAutofillMethod:
                              AndroidSmsAutofillMethod.none,
                          onChanged: (_) => setState(() {}),
                          onCompleted: (val) async {
                            if (_isSubmitting) return;
                            setState(() => _isSubmitting = true);
                            await PhoneManager.verify(
                                context,
                                id: widget.id,
                                code: val);
                            if (mounted) setState(() => _isSubmitting = false);
                          },
                        ),

                        SizedBox(height: 20.h),

                        // ── Timer progress bar & countdown ──
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4.r),
                          child: LinearProgressIndicator(
                            value: _timerProgress,
                            minHeight: 3.h,
                            backgroundColor: context.tDivider,
                            color: _canResend
                                ? Colors.grey
                                : AppConstant.primaryColor,
                          ),
                        ),
                        SizedBox(height: 12.h),

                        // Timer label or resend button
                        if (!_canResend)
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.center,
                            children: [
                              Icon(Iconsax.timer_1,
                                  size: 15.sp, color: context.tSub),
                              SizedBox(width: 6.w),
                              RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(
                                      text: _timerText,
                                      style: TextStyle(
                                        color: AppConstant.primaryColor,
                                        fontSize: 15.sp,
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'Inter',
                                      ),
                                    ),
                                    TextSpan(
                                      text: 'resend_after'.tr(),
                                      style: TextStyle(
                                        color: context.tSub,
                                        fontSize: 12.sp,
                                        fontFamily: 'Inter',
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        else
                          GestureDetector(
                            onTap: () {
                              _startTimer();
                              smscontroller.clear();
                            },
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 20.w, vertical: 11.h),
                              decoration: BoxDecoration(
                                color: AppConstant.primaryColor
                                    .withValues(alpha: 0.10),
                                borderRadius:
                                    BorderRadius.circular(12.r),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Iconsax.refresh,
                                      size: 16.sp,
                                      color:
                                          AppConstant.primaryColor),
                                  SizedBox(width: 8.w),
                                  Text(
                                    'resend'.tr(),
                                    style: TextStyle(
                                      color: AppConstant.primaryColor,
                                      fontSize: 13.sp,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                        SizedBox(height: 20.h),

                        // ── Confirm button ──
                        GestureDetector(
                          onTap: () async {
                            if (!codeReady || _isSubmitting) return;
                            setState(() => _isSubmitting = true);
                            await PhoneManager.verify(
                              context,
                              id: widget.id,
                              code: smscontroller.text,
                            );
                            if (mounted) setState(() => _isSubmitting = false);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            height: 52.h,
                            decoration: BoxDecoration(
                              color: codeReady
                                  ? AppConstant.primaryColor
                                  : context.tIconBg,
                              borderRadius:
                                  BorderRadius.circular(14.r),
                              boxShadow: codeReady
                                  ? [
                                      BoxShadow(
                                        color: AppConstant.primaryColor
                                            .withValues(alpha: 0.38),
                                        blurRadius: 14,
                                        offset:
                                            const Offset(0, 5),
                                      )
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Iconsax.tick_circle,
                                  color: codeReady
                                      ? Colors.white
                                      : context.tSub,
                                  size: 18.sp,
                                ),
                                SizedBox(width: 8.w),
                                Text(
                                  'confirm'.tr(),
                                  style: TextStyle(
                                    color: codeReady
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
                      ],
                    ),
                  ),

                  BlocListener<VerifyBloc, VerifyState>(
                    child: const SizedBox.shrink(),
                    listener: (context, state) async {
                      if (state is VerifyWaitingState) {
                        loadingService.showLoading(context);
                      } else if (state is VerifyErrorState) {
                        loadingService.closeLoading(context);
                        AppToast.error(
                          context,
                          state.message ?? 'error_occurred'.tr(),
                          title: 'not_confirmed'.tr(),
                        );
                      } else if (state is VerifySuccessState) {
                        loadingService.closeLoading(context);
                        await Future.wait([
                          StorageService().write(
                              StorageService.token,
                              state.token.toString()),
                          StorageService()
                              .write(StorageService.user, state.user),
                        ]);
                        Navigator.of(context).pushNamedAndRemoveUntil(
                            '/homeScreen', (r) => false);
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
