import 'package:stroymarket/bloc/shop/shop_state.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_bloc.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_state.dart';
import 'package:stroymarket/bloc/shopbyProduct/shopbyProduct_bloc.dart';
import 'package:stroymarket/bloc/shopbyProduct/shopbyProduct_state.dart';

import '../bloc/shop/shop_bloc.dart';
import '../export_files.dart';

class ShopManager {
  static Future<void> getAll(
    BuildContext context,
  ) async {
    try {
      await BlocProvider.of<ShopAllBloc>(context).getAll(context);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ShopAllBloc>(context).emit(ShopAllErrorState(message: msg, title: msg));
    }
  }

  static Future<void> getById(BuildContext context,
      {required String ShopId}) async {
    try {
      await BlocProvider.of<ShopBloc>(context).get(ShopId: ShopId);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ShopBloc>(context).emit(ShopErrorState(message: msg, title: msg));
    }
  }

  static Future<void> getByProductId(BuildContext context,
      {required String productId}) async {
    try {
      await BlocProvider.of<ShopByProductBloc>(context)
          .get(context, productId: productId);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ShopByProductBloc>(context)
          .emit(ShopByProductErrorState(message: msg, title: msg));
    }
  }
}
