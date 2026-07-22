import 'dart:math' as math;
import '../export_files.dart';
import '../services/storage/storage_service.dart';

// ignore_for_file: use_build_context_synchronously
// ignore: must_be_immutable
class SplashScreen extends StatefulWidget {
  String? locale;
  SplashScreen({super.key, this.locale});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  Timer? _navTimer;
  bool _navigated = false;
  bool _canNavigate = false;
  bool _waitingForNav = false;

  // ── Controllers ──────────────────────────────────────────────
  late final AnimationController _masterCtrl;  // 4 000 ms — logo, letters, tagline
  late final AnimationController _exitCtrl;    //   700 ms — exit fade-out
  late final AnimationController _ringCtrl;    // 2 200 ms repeat — ring pulse
  late final AnimationController _conicCtrl;   // 2 200 ms repeat — spinning border
  late final AnimationController _glowCtrl;    // 2 000 ms repeat — logo glow
  late final AnimationController _shimmerCtrl; // 2 800 ms repeat — shimmer sweep
  late final AnimationController _particleCtrl;// 3 000 ms repeat — floating dots
  late final AnimationController _barCtrl;     //   550 ms — progress fill

  // ── Derived animations ────────────────────────────────────────
  late final Animation<double> _exitOpacity;
  late final Animation<double> _logoEntrance;
  late final Animation<double> _taglineAnim;
  late final List<Animation<double>> _letterAnims;

  static const List<String> _letters = [
    'd','i','a','m','e','t','r'
  ];

  static const List<List<double>> _particleData = [
    // [xFrac, yFrac, size, dur, delayFrac]
    [0.12, 0.20, 3, 2.8, 0.00],
    [0.85, 0.15, 2, 3.2, 0.13],
    [0.25, 0.75, 4, 2.5, 0.23],
    [0.70, 0.80, 2, 3.5, 0.07],
    [0.50, 0.10, 3, 2.9, 0.33],
    [0.90, 0.50, 2, 3.1, 0.17],
    [0.08, 0.55, 3, 2.7, 0.30],
    [0.60, 0.90, 2, 3.3, 0.10],
    [0.35, 0.30, 2, 3.0, 0.40],
    [0.78, 0.35, 3, 2.6, 0.20],
  ];

  @override
  void initState() {
    super.initState();

    // ── Init controllers ──
    _masterCtrl   = AnimationController(vsync: this, duration: const Duration(milliseconds: 4000));
    _exitCtrl     = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _ringCtrl     = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    _conicCtrl    = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    _glowCtrl     = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000));
    _shimmerCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 2800));
    _particleCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000));
    _barCtrl      = AnimationController(vsync: this, duration: const Duration(milliseconds: 550));

    // ── Derived ──
    _exitOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _exitCtrl, curve: Curves.easeInOut),
    );

    // Logo entrance: 0.05s → 0.85s within 4s master
    _logoEntrance = CurvedAnimation(
      parent: _masterCtrl,
      curve: const Interval(0.0125, 0.2125, curve: Curves.elasticOut),
    );

    // Tagline: 1.0s → 1.55s
    _taglineAnim = CurvedAnimation(
      parent: _masterCtrl,
      curve: const Interval(0.25, 0.3875, curve: Curves.easeOut),
    );

    // Letter anims: staggered from 0.7s, 0.07s apart, 0.48s each
    _letterAnims = List.generate(_letters.length, (i) {
      final start = ((0.7 + i * 0.07) / 4.0).clamp(0.0, 1.0);
      final end   = (start + 0.48 / 4.0).clamp(0.0, 1.0);
      return CurvedAnimation(
        parent: _masterCtrl,
        curve: Interval(start, end, curve: Curves.elasticOut),
      );
    });

    // ── Start animations ──
    _masterCtrl.forward();
    _ringCtrl.repeat();
    _conicCtrl.repeat();
    _glowCtrl.repeat(reverse: true);
    _shimmerCtrl.repeat();
    _particleCtrl.repeat();

    // Progress bar: starts at 0.65s
    Future.delayed(const Duration(milliseconds: 650), () {
      if (mounted) _barCtrl.forward();
    });

    // Exit fade: starts at 1.2s
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) _exitCtrl.forward();
    });

    // ── Navigation (check at 0.8s, navigate at 1.2s together with fade-out)
    // New page slide-in (320ms) overlaps splash fade-out (700ms) → no black frame
    Future.delayed(const Duration(milliseconds: 800), () async {
      if (!mounted) return;
      if (await InternetConnectionChecker.instance.hasConnection) {
        _canNavigate = true;
        if (_waitingForNav) _doNavigate();
      } else {
        _navTimer = Timer.periodic(const Duration(seconds: 5), (t) async {
          if (await InternetConnectionChecker.instance.hasConnection) {
            t.cancel();
            _canNavigate = true;
            if (_waitingForNav && !_navigated) _doNavigate();
          }
        });
      }
    });

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted || _navigated) return;
      if (_canNavigate) {
        _doNavigate();
      } else {
        _waitingForNav = true;
      }
    });
  }

  Future<void> _doNavigate() async {
    if (_navigated || !mounted) return;
    _navigated = true;
    _navTimer?.cancel();
    final token = await StorageService().read(StorageService.token);
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(
      context,
      token == null ? RouteNames.loginScreen : RouteNames.homeScreen,
      (r) => false,
    );
  }

  @override
  void dispose() {
    _navTimer?.cancel();
    _masterCtrl.dispose();
    _exitCtrl.dispose();
    _ringCtrl.dispose();
    _conicCtrl.dispose();
    _glowCtrl.dispose();
    _shimmerCtrl.dispose();
    _particleCtrl.dispose();
    _barCtrl.dispose();
    super.dispose();
  }

  // ════════════════════════════════════════════════════════════
  //  BUILD
  // ════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return AnimatedBuilder(
      animation: _exitOpacity,
      builder: (context, child) => Opacity(
        opacity: _exitOpacity.value,
        child: Transform.scale(
          scale: 1.0 + (1.0 - _exitOpacity.value) * 0.06,
          child: child,
        ),
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFF010E07),
        resizeToAvoidBottomInset: false,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // ── Background gradient ──────────────────────────────
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment(-0.83, -0.56),
                  end: Alignment(0.83, 0.56),
                  colors: [
                    Color(0xFF010E07),
                    Color(0xFF011309),
                    Color(0xFF021A0C),
                  ],
                  stops: [0.0, 0.45, 1.0],
                ),
              ),
            ),
            // ── Ambient radial glow ──────────────────────────────
            Center(
              child: Container(
                width: size.width * 0.85,
                height: size.height * 0.55,
                decoration: BoxDecoration(
                  gradient: const RadialGradient(
                    colors: [
                      Color.fromRGBO(0, 196, 140, 0.10),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            // ── Corner glows ─────────────────────────────────────
            Positioned(
              bottom: 0, left: 0,
              child: _cornerGlow(200, Alignment.bottomLeft, 0.09),
            ),
            Positioned(
              top: 0, right: 0,
              child: _cornerGlow(260, Alignment.topRight, 0.06),
            ),
            // ── Concentric ring pulses ────────────────────────────
            ..._buildRings(),
            // ── Floating particles ────────────────────────────────
            ..._buildParticles(size),
            // ── Logo + Text ───────────────────────────────────────
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildLogoBox(),
                  const SizedBox(height: 36),
                  _buildTitle(),
                  const SizedBox(height: 8),
                  _buildTagline(),
                ],
              ),
            ),
            // ── Progress bar ──────────────────────────────────────
            Positioned(
              bottom: 48, left: 0, right: 0,
              child: _buildProgressBar(),
            ),
          ],
        ),
      ),
    );
  }

  // ════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════

  Widget _cornerGlow(double size, Alignment alignment, double opacity) {
    return SizedBox(
      width: size,
      height: size,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: alignment,
            colors: [
              Color.fromRGBO(0, 196, 140, opacity),
              Colors.transparent,
            ],
            stops: const [0.0, 0.65],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildRings() {
    const sizes    = [220.0, 370.0, 540.0];
    const opacBase = [0.26,  0.14,  0.07];
    const delays   = [0.0, 0.45 / 2.2, 0.90 / 2.2];

    return List.generate(3, (i) {
      return Center(
        child: AnimatedBuilder(
          animation: _ringCtrl,
          builder: (_, __) {
            final t     = (_ringCtrl.value + delays[i]) % 1.0;
            final scale = 1.0 + t * 0.75;
            final alpha = ((1.0 - t) * 0.55).clamp(0.0, 1.0);
            return Transform.scale(
              scale: scale,
              child: Opacity(
                opacity: alpha,
                child: Container(
                  width: sizes[i],
                  height: sizes[i],
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Color.fromRGBO(0, 196, 140, opacBase[i]),
                      width: i == 0 ? 1.5 : 1.0,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      );
    });
  }

  List<Widget> _buildParticles(Size size) {
    return List.generate(_particleData.length, (i) {
      final p      = _particleData[i];
      final x      = p[0] * size.width;
      final y      = p[1] * size.height;
      final sz     = p[2];
      final delay  = p[4];
      final color  = i % 3 == 0
          ? const Color.fromRGBO(0, 255, 200, 0.72)
          : const Color.fromRGBO(0, 196, 140, 0.52);
      final glow   = i % 4 == 0;

      return Positioned(
        left: x - sz / 2,
        top:  y - sz / 2,
        child: AnimatedBuilder(
          animation: _particleCtrl,
          builder: (_, __) {
            final t = (_particleCtrl.value + delay) % 1.0;
            final double op;
            if (t < 0.15)      op = t / 0.15;
            else if (t < 0.75) op = 1.0;
            else               op = 1.0 - (t - 0.75) / 0.25;
            final dy    = -t * 28.0;
            final double sc;
            if (t < 0.15)      sc = t / 0.15;
            else if (t < 0.75) sc = 1.0;
            else               sc = 1.0 - (t - 0.75) / 0.25 * 0.7;

            return Transform.translate(
              offset: Offset(0, dy),
              child: Transform.scale(
                scale: sc.clamp(0.0, 1.0),
                child: Opacity(
                  opacity: op.clamp(0.0, 1.0),
                  child: Container(
                    width: sz, height: sz,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      boxShadow: glow
                          ? [const BoxShadow(
                              color: Color.fromRGBO(0, 196, 140, 0.55),
                              blurRadius: 6, spreadRadius: 2,
                            )]
                          : null,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      );
    });
  }

  Widget _buildLogoBox() {
    return AnimatedBuilder(
      animation: Listenable.merge([
        _logoEntrance, _conicCtrl, _glowCtrl, _shimmerCtrl,
      ]),
      builder: (_, __) {
        final entrance = _logoEntrance.value;
        final glowT    = _glowCtrl.value;
        final glowBlur   = 20.0 + glowT * 32.0;
        final glowSpread = 4.0  + glowT * 12.0;
        final glowAlpha  = 0.15 + glowT * 0.30;
        // shimmer: translateX -180% → 280% (fraction of box width 112)
        final shimDx = (-1.8 + _shimmerCtrl.value * 4.6) * 112.0;

        return Opacity(
          opacity: entrance.clamp(0.0, 1.0),
          child: Transform.scale(
            scale: 0.5 + entrance * 0.5,
            child: SizedBox(
              width: 112, height: 112,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // radial halo
                  Positioned(
                    left: -24, right: -24, top: -24, bottom: -24,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(40),
                        gradient: const RadialGradient(
                          colors: [
                            Color.fromRGBO(0, 196, 140, 0.35),
                            Colors.transparent,
                          ],
                          stops: const [0.0, 0.65],
                        ),
                      ),
                    ),
                  ),
                  // spinning sweep-gradient border
                  Positioned(
                    left: -4, right: -4, top: -4, bottom: -4,
                    child: Transform.rotate(
                      angle: _conicCtrl.value * 2 * math.pi,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(34),
                          gradient: const SweepGradient(
                            colors: [
                              Colors.transparent,
                              Color(0xFF00FFBE),
                              Color.fromRGBO(0, 196, 140, 0.65),
                              Colors.transparent,
                            ],
                            stops: [0.0, 0.194, 0.389, 0.556],
                          ),
                        ),
                      ),
                    ),
                  ),
                  // dark mask (hides the conic inner fill)
                  Positioned(
                    left: 2, right: 2, top: 2, bottom: 2,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF011309),
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                  ),
                  // logo box
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(28),
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color.fromRGBO(0, 196, 140, 0.18),
                            Color.fromRGBO(0, 20, 12, 0.96),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color.fromRGBO(0, 196, 140, glowAlpha),
                            blurRadius: glowBlur,
                            spreadRadius: glowSpread,
                          ),
                          const BoxShadow(
                            color: Color.fromRGBO(0, 0, 0, 0.50),
                            blurRadius: 60,
                            offset: Offset(0, 24),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.hardEdge,
                      child: Stack(
                        children: [
                          // corner shine
                          Positioned.fill(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(28),
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color.fromRGBO(255, 255, 255, 0.10),
                                    Colors.transparent,
                                  ],
                                  stops: const [0.0, 0.45],
                                ),
                              ),
                            ),
                          ),
                          // shimmer sweep
                          Positioned(
                            left: shimDx - 20,
                            top: 0, bottom: 0,
                            width: 40,
                            child: Transform(
                              transform: Matrix4.skewX(-0.32),
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      Color.fromRGBO(255, 255, 255, 0.65),
                                      Color.fromRGBO(255, 255, 255, 0.35),
                                      Colors.transparent,
                                    ],
                                    stops: const [0.0, 0.48, 0.52, 1.0],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          // logo image — tinted white for green glow effect
                          Center(
                            child: ColorFiltered(
                              colorFilter: const ColorFilter.mode(
                                Colors.white,
                                BlendMode.srcATop,
                              ),
                              child: Image.asset(
                                'assets/images/stroymarket.png',
                                width: 72, height: 72,
                                fit: BoxFit.contain,
                              ),
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
      },
    );
  }

  Widget _buildTitle() {
    return AnimatedBuilder(
      animation: _masterCtrl,
      builder: (_, __) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(_letters.length, (i) {
            final v  = _letterAnims[i].value.clamp(0.0, 1.0);
            final dy = (1.0 - v) * 18.0;
            final isEdge = i == 0 || i == _letters.length - 1;
            return Transform.translate(
              offset: Offset(0, dy),
              child: Opacity(
                opacity: v,
                child: Text(
                  _letters[i],
                  style: TextStyle(
                    fontSize: 38,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.76,
                    height: 1.0,
                    shadows: [
                      Shadow(
                        color: isEdge
                            ? const Color.fromRGBO(0, 255, 190, 0.50)
                            : const Color.fromRGBO(0, 196, 140, 0.30),
                        blurRadius: isEdge ? 28 : 20,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildTagline() {
    return AnimatedBuilder(
      animation: _taglineAnim,
      builder: (_, __) {
        final v = _taglineAnim.value.clamp(0.0, 1.0);
        return Opacity(
          opacity: v,
          child: Transform.translate(
            offset: Offset(0, (1.0 - v) * 12.0),
            child: const Text(
              'QURILISH · DIZAYN · YETKAZIB BERISH',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Color.fromRGBO(0, 196, 140, 0.72),
                letterSpacing: 2.5,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProgressBar() {
    return Center(
      child: AnimatedBuilder(
        animation: _barCtrl,
        builder: (_, __) {
          return SizedBox(
            width: 80, height: 2,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(1),
              child: Stack(
                children: [
                  // track
                  Container(color: const Color.fromRGBO(255, 255, 255, 0.07)),
                  // fill
                  FractionallySizedBox(
                    widthFactor: _barCtrl.value,
                    child: ShaderMask(
                      shaderCallback: (rect) => const LinearGradient(
                        colors: [
                          Color.fromRGBO(0, 196, 140, 0.50),
                          Color(0xFF00C48C),
                          Color.fromRGBO(0, 255, 180, 0.85),
                        ],
                        stops: [0.0, 0.60, 1.0],
                      ).createShader(rect),
                      child: Container(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
