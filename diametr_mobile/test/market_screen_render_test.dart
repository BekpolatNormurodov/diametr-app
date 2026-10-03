// Renders the real MarketScreen (shop page) with a live-shaped shop
// (test/fixtures/shop_16.json + sample about text and weekly hours) — this Mac
// has no emulator. Opt-in, one case at a time:
//   RENDER_SHOTS=1 flutter test --update-goldens --plain-name "UZ" test/market_screen_render_test.dart
import 'dart:convert';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:iconsax/iconsax.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stroymarket/bloc/savatcha/savatcha_bloc.dart';
import 'package:stroymarket/bloc/shop/shop_bloc.dart';
import 'package:stroymarket/bloc/shop/shop_state.dart';
import 'package:stroymarket/screens/market/market_Screen.dart';

class _FakeShopBloc extends ShopBloc {
  _FakeShopBloc(this.data);
  final Map data;
  @override
  Future get({required String ShopId}) async => emit(ShopSuccessState(
        data: data,
        admin: (data['admins'] as List?)?.firstOrNull,
        products: data['products'],
      ));
}

/// Serves photos from test/fixtures/img (downloaded from the live server) —
/// no network, no sqflite (NonStoringObjectProvider keeps nothing on disk).
class _FixtureFileService extends FileService {
  @override
  Future<FileServiceResponse> get(String url, {Map<String, String>? headers}) async =>
      _FixtureResponse(File('test/fixtures/img/${Uri.parse(url).pathSegments.last}'));
}

class _FixtureResponse implements FileServiceResponse {
  _FixtureResponse(this.file);
  final File file;
  @override
  Stream<List<int>> get content =>
      file.existsSync() ? file.openRead() : const Stream.empty();
  @override
  int? get contentLength => file.existsSync() ? file.lengthSync() : 0;
  @override
  int get statusCode => file.existsSync() ? 200 : 404;
  @override
  DateTime get validTill => DateTime.now().add(const Duration(days: 1));
  @override
  String? get eTag => null;
  @override
  String get fileExtension => '.${file.path.split('.').last}';
}

class _TestCacheManager extends CacheManager with ImageCacheManager {
  _TestCacheManager()
      : super(Config('diametr_test',
            repo: NonStoringObjectProvider(), fileService: _FixtureFileService()));
}

Future<void> _font(String family, List<String> files) async {
  final loader = FontLoader(family);
  for (final f in files) {
    loader.addFont(Future.value(ByteData.sublistView(File(f).readAsBytesSync())));
  }
  await loader.load();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    final tmp = Directory.systemTemp.createTempSync('diametr_test').path;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('plugins.flutter.io/path_provider'),
            (call) async => tmp);
    CachedNetworkImageProvider.defaultCacheManager = _TestCacheManager();
    SharedPreferences.setMockInitialValues({});
    await EasyLocalization.ensureInitialized();
    dotenv.testLoad(fileInput: File('.env').readAsStringSync());
    await _font('Inter', [
      for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold'])
        'assets/fonts/Inter-$w.ttf',
    ]);
    var dir = File(Platform.resolvedExecutable).parent;
    const icons = 'bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf';
    while (!File('${dir.path}/$icons').existsSync() && dir.parent.path != dir.path) {
      dir = dir.parent;
    }
    await _font('MaterialIcons', ['${dir.path}/$icons']);
    final pubCache = Platform.environment['PUB_CACHE'] ??
        '${Platform.environment['HOME']}/.pub-cache';
    await _font('packages/iconsax/iconsax',
        ['$pubCache/hosted/pub.dev/iconsax-0.0.8/lib/assets/fonts/iconsax.ttf']);
  });

  Future<void> shoot(WidgetTester tester, String file, {required Locale locale}) async {
    SharedPreferences.setMockInitialValues({});
    final Map shop =
        jsonDecode(File('test/fixtures/shop_16.json').readAsStringSync());
    final onError = FlutterError.onError;
    FlutterError.onError = (d) {
      final lib = d.library ?? '';
      if (lib.contains('image') || '${d.exception}'.contains('MissingPlugin')) return;
      onError?.call(d);
    };
    addTearDown(() => FlutterError.onError = onError);

    tester.view.physicalSize = const Size(390 * 2, 1500 * 2);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(EasyLocalization(
      supportedLocales: const [Locale('uz', 'UZ'), Locale('ru', 'RU')],
      path: 'assets/languages',
      startLocale: locale,
      fallbackLocale: const Locale('uz', 'UZ'),
      child: ScreenUtilInit(
        designSize: const Size(390.0, 845.0),
        builder: (context, _) => MaterialApp(
          debugShowCheckedModeBanner: false,
          localizationsDelegates: context.localizationDelegates,
          supportedLocales: context.supportedLocales,
          locale: context.locale,
          theme: ThemeData(fontFamily: 'Inter'),
          home: MultiBlocProvider(
            providers: [
              BlocProvider<ShopBloc>(create: (_) => _FakeShopBloc(shop)),
              BlocProvider<SavatchaBloc>(create: (_) => SavatchaBloc()),
            ],
            child: const MarketScreen(id: '16', name: 'Muhriddin shop'),
          ),
        ),
      ),
    ));
    for (int i = 0; i < 40 && find.byType(MarketScreen).evaluate().isEmpty; i++) {
      await tester.runAsync(() => Future.delayed(const Duration(milliseconds: 100)));
      await tester.pump(const Duration(milliseconds: 50));
    }
    for (int i = 0; i < 12; i++) {
      await tester.runAsync(() => Future.delayed(const Duration(milliseconds: 200)));
      await tester.pump(const Duration(milliseconds: 100));
    }
    // Open the weekly table
    final chevron = find.byIcon(Iconsax.arrow_down_1);
    if (chevron.evaluate().isNotEmpty) {
      await tester.tap(chevron.first);
      for (int i = 0; i < 6; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }
    }
    await expectLater(
        find.byType(MarketScreen), matchesGoldenFile('goldens/$file.png'));
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 10));
  }

  final bool skip = Platform.environment['RENDER_SHOTS'] == null;
  testWidgets('shop page with hours (UZ)', skip: skip, (t) async =>
      shoot(t, 'shop_16_uz', locale: const Locale('uz', 'UZ')));
  testWidgets('shop page with hours (RU)', skip: skip, (t) async =>
      shoot(t, 'shop_16_ru', locale: const Locale('ru', 'RU')));
}
