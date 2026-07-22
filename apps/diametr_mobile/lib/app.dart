import 'package:stroymarket/bloc/1_send_sms/send_sms_bloc.dart';
import 'package:stroymarket/bloc/2_verify/verify_bloc.dart';
import 'package:stroymarket/bloc/ads/ads_bloc.dart';
import 'package:stroymarket/bloc/categoryAll/categoryAll_bloc.dart';
import 'package:stroymarket/bloc/news/news_bloc.dart';
import 'package:stroymarket/bloc/order/order_bloc.dart';
import 'package:stroymarket/bloc/orderAll/orderAll_bloc.dart';
import 'package:stroymarket/bloc/orderCreate/orderCreate_bloc.dart';
import 'package:stroymarket/bloc/product/product_bloc.dart';
import 'package:stroymarket/bloc/productAll/productAll_bloc.dart';
import 'package:stroymarket/bloc/productbyCategory/productbyCategory_bloc.dart';
import 'package:stroymarket/bloc/regionAll/regionAll_bloc.dart';
import 'package:stroymarket/bloc/regionSelected/regionSelected_bloc.dart';
import 'package:stroymarket/bloc/savatcha/savatcha_bloc.dart';
import 'package:stroymarket/bloc/serviceAll/serviceAll_bloc.dart';
import 'package:stroymarket/bloc/shopProduct/shopProduct_bloc.dart';
import 'package:stroymarket/bloc/worker/worker_bloc.dart';
import 'package:stroymarket/bloc/workerbyService/workerbyService_bloc.dart';

import 'bloc/shop/shop_bloc.dart';
import 'bloc/shopAll/shopAll_bloc.dart';
import 'bloc/shopbyProduct/shopbyProduct_bloc.dart';
import 'export_files.dart';


class stroymarket extends StatelessWidget {
  const stroymarket({super.key});

  @override
  Widget build(BuildContext ctx) {

   return MultiBlocProvider(
    providers: [
      BlocProvider(create: (_) => SavatchaBloc()),
      BlocProvider(create: (_) => ThemeCubit()),
    ],
    child: EasyLocalization(
      supportedLocales: const [
        Locale('uz', 'UZ'),
        Locale('ru', 'RU'),
      ],
      path: 'assets/languages',
      startLocale: const Locale('uz', 'UZ'),
      fallbackLocale: const Locale('uz', 'UZ'),
      child: ScreenUtilInit(
        designSize: const Size(390.0, 845.0),
        builder: (context, child) {
          return BlocBuilder<ThemeCubit, ThemeMode>(
            builder: (ctx, themeMode) {
              return MultiBlocProvider(
                providers: providers,
                child: MaterialApp(
                  localizationsDelegates: context.localizationDelegates,
                  supportedLocales: context.supportedLocales,
                  locale: context.locale,
                  debugShowCheckedModeBanner: false,
                  themeMode: themeMode,
                  initialRoute: RouteNames.splashScreen,
                  onGenerateRoute: FullRoutes().ongenerateRoute,
                  builder: MaterialAppCustomBuilder.builder,
                  theme: ThemeData(
                    fontFamily: 'Inter',
                    useMaterial3: true,
                    scaffoldBackgroundColor: Colors.white,
                    colorScheme: ColorScheme.light(
                      primary: AppConstant.primaryColor,
                      secondary: AppConstant.primaryColor,
                    ),
                    primaryColor: AppConstant.primaryColor,
                    appBarTheme: const AppBarTheme(
                      backgroundColor: Colors.white,
                      surfaceTintColor: Colors.transparent,
                      elevation: 0,
                    ),
                    splashColor: AppConstant.primaryColor.withValues(alpha: 0.08),
                    highlightColor: AppConstant.primaryColor.withValues(alpha: 0.04),
                    textTheme: Typography.englishLike2021.apply(fontSizeFactor: 1.sp),
                  ),
                  darkTheme: ThemeData(
                    fontFamily: 'Inter',
                    useMaterial3: true,
                    scaffoldBackgroundColor: const Color(0xFF0D0D1A),
                    colorScheme: const ColorScheme.dark(
                      primary: AppConstant.primaryColor,
                      secondary: AppConstant.primaryColor,
                      surface: Color(0xFF1A1A2E),
                    ),
                    primaryColor: AppConstant.primaryColor,
                    appBarTheme: const AppBarTheme(
                      backgroundColor: Color(0xFF0D0D1A),
                      surfaceTintColor: Colors.transparent,
                      elevation: 0,
                      foregroundColor: Colors.white,
                    ),
                    cardColor: const Color(0xFF1A1A2E),
                    dividerColor: Colors.white12,
                    splashColor: AppConstant.primaryColor.withValues(alpha: 0.08),
                    highlightColor: AppConstant.primaryColor.withValues(alpha: 0.04),
                    textTheme: Typography.englishLike2021
                        .apply(fontSizeFactor: 1.sp, bodyColor: Colors.white, displayColor: Colors.white),
                  ),
                ),
              );
            },
          );
        },
      ),
    ),
  );
  }
}

List<BlocProvider> providers = [

  //  BlocProvider<SavatchaBloc>(
  //   create: (BuildContext c) => SavatchaBloc(),
  //   lazy: false,
  // ),
  BlocProvider<SendSmsBloc>(
    create: (BuildContext context) => SendSmsBloc(),
    lazy: false,
  ),
  BlocProvider<VerifyBloc>(
    create: (BuildContext context) => VerifyBloc(),
    lazy: false,
  ),
  BlocProvider<AdsBloc>(
    create: (BuildContext context) => AdsBloc(),
    lazy: false,
  ),
  BlocProvider<NewsBloc>(
    create: (BuildContext context) => NewsBloc(),
    lazy: false,
  ),
  BlocProvider<OrderAllBloc>(
    create: (BuildContext context) => OrderAllBloc(),
    lazy: false,
  ),
  BlocProvider<OrderBloc>(
    create: (BuildContext context) => OrderBloc(),
    lazy: false,
  ),
   BlocProvider<OrderCreateBloc>(
    create: (BuildContext context) => OrderCreateBloc(),
    lazy: false,
  ),
  BlocProvider<CategoryAllBloc>(
    create: (BuildContext context) => CategoryAllBloc(),
    lazy: false,
  ),
  BlocProvider<ShopAllBloc>(
    create: (BuildContext context) => ShopAllBloc(),
    lazy: false,
  ),
    BlocProvider<ShopBloc>(
    create: (BuildContext context) => ShopBloc(),
    lazy: false,
  ),

  BlocProvider<ProductAllBloc>(
    create: (BuildContext context) => ProductAllBloc(),
    lazy: false,
  ),
  BlocProvider<ProductBloc>(
    create: (BuildContext context) => ProductBloc(),
    lazy: false,
  ),
    BlocProvider<ProductByCategoryBloc>(
    create: (BuildContext context) => ProductByCategoryBloc(),
    lazy: false,
  ),


    BlocProvider<RegionAllBloc>(
    create: (BuildContext context) => RegionAllBloc(),
    lazy: false,
  ),
   BlocProvider<RegionSelectedBloc>(
    create: (BuildContext context) => RegionSelectedBloc(),
    lazy: false,
  ),


   BlocProvider<ServiceAllBloc>(
    create: (BuildContext context) => ServiceAllBloc(),
    lazy: false,
  ),

     BlocProvider<WorkerByServiceBloc>(
    create: (BuildContext context) => WorkerByServiceBloc(),
    lazy: false,
  ),

     BlocProvider<WorkerBloc>(
    create: (BuildContext context) => WorkerBloc(),
    lazy: false,
  ),



     BlocProvider<ShopProductBloc>(
    create: (BuildContext context) => ShopProductBloc(),
    lazy: false,
  ),

   BlocProvider<ShopByProductBloc>(
    create: (BuildContext context) => ShopByProductBloc(),
    lazy: false,
  ),
 

];
