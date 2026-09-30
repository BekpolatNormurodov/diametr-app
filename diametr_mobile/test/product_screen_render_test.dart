// Renders the real ProductScreen with live-shaped data (test/fixtures) and
// saves screenshots (goldens) — this Mac has no emulator, so this is how the
// page is looked at. Opt-in (photos show as placeholders; run one case at a
// time — easy_localization keeps state between cases):
//   RENDER_SHOTS=1 flutter test --update-goldens --plain-name "CERUTTIspa" test/product_screen_render_test.dart
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
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stroymarket/bloc/product/product_bloc.dart';
import 'package:stroymarket/bloc/product/product_state.dart';
import 'package:stroymarket/bloc/regionSelected/regionSelected_bloc.dart';
import 'package:stroymarket/bloc/savatcha/savatcha_bloc.dart';
import 'package:stroymarket/bloc/shopbyProduct/shopbyProduct_bloc.dart';
import 'package:stroymarket/bloc/shopbyProduct/shopbyProduct_state.dart';
import 'package:stroymarket/screens/products/product_screen.dart';

class _FakeProductBloc extends ProductBloc {
  _FakeProductBloc(this.data);
  final Map data;
  @override
  Future get({required String ProductId}) async =>
      emit(ProductSuccessState(data: data));
}

class _FakeShopByProductBloc extends ShopByProductBloc {
  _FakeShopByProductBloc(this.data);
  final List data;
  @override
  Future get(BuildContext context, {required String productId}) async =>
      emit(ShopByProductSuccessState(data: data));
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
    // The image cache asks the platform for folders; hand it a temp dir.
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

  Future<void> shoot(WidgetTester tester, String file,
      {required Locale locale, int? itemId}) async {
    // easy_localization remembers the last locale in prefs; start clean
    SharedPreferences.setMockInitialValues({});
    final Map product =
        jsonDecode(File('test/fixtures/product_204.json').readAsStringSync());
    final List shops =
        jsonDecode(File('test/fixtures/shops_204.json').readAsStringSync());
    // Network photos can't load in tests; their placeholder is drawn instead.
    final onError = FlutterError.onError;
    FlutterError.onError = (d) {
      final lib = d.library ?? '';
      if (lib.contains('image') || '${d.exception}'.contains('MissingPlugin')) return;
      onError?.call(d);
    };
    addTearDown(() => FlutterError.onError = onError);

    tester.view.physicalSize = const Size(390 * 2, 1900 * 2);
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
              BlocProvider<ProductBloc>(create: (_) => _FakeProductBloc(product)),
              BlocProvider<ShopByProductBloc>(
                  create: (_) => _FakeShopByProductBloc(shops)),
              BlocProvider<RegionSelectedBloc>(create: (_) => RegionSelectedBloc()),
              BlocProvider<SavatchaBloc>(create: (_) => SavatchaBloc()),
            ],
            child: ProductScreen(
                name: 'Раковины и умывальники', product_id: '204', itemId: itemId),
          ),
        ),
      ),
    ));
    // Translations load through real async IO: wait for the page itself.
    for (int i = 0; i < 40 && find.byType(ProductScreen).evaluate().isEmpty; i++) {
      await tester.runAsync(() => Future.delayed(const Duration(milliseconds: 100)));
      await tester.pump(const Duration(milliseconds: 50));
    }
    // Photos load and decode the same way; alternate real time with frames.
    for (int i = 0; i < 12; i++) {
      await tester.runAsync(() => Future.delayed(const Duration(milliseconds: 200)));
      await tester.pump(const Duration(milliseconds: 100));
    }
    await expectLater(
        find.byType(ProductScreen), matchesGoldenFile('goldens/$file.png'));
    // Let the page's own timers finish before the test ends
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 10));
  }

  final bool skip = Platform.environment['RENDER_SHOTS'] == null;
  testWidgets('product page, no type chosen (RU)', skip: skip, (t) async =>
      shoot(t, 'product_204_all_ru', locale: const Locale('ru', 'RU')));
  testWidgets('product page, CERUTTIspa chosen (RU)', skip: skip, (t) async =>
      shoot(t, 'product_204_cerutti_ru', locale: const Locale('ru', 'RU'), itemId: 135));
  testWidgets('product page, Roca chosen (UZ)', skip: skip, (t) async =>
      shoot(t, 'product_204_roca_uz', locale: const Locale('uz', 'UZ'), itemId: 134));
}
