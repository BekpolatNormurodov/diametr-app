


import 'package:stroymarket/bloc/shopProduct/shopProduct_bloc.dart';
import 'package:stroymarket/bloc/shopProduct/shopProduct_state.dart';

import '../export_files.dart';

class ShopProductManager {
  static Future<void> getAll(
    BuildContext context,
    {
    required String productId,
    required String shopId,
    }
  ) async {
    try {
      await BlocProvider.of<ShopProductBloc>(context).get(
        productId: productId,
        shopId: shopId
      );
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ShopProductBloc>(context).emit(ShopProductErrorState(message: msg, title: msg));
    }
  }
   static Future<void> refresh(
    BuildContext context,
    {
    required String productId,
    required String shopId,
    }
  ) async {
    try {
      await BlocProvider.of<ShopProductBloc>(context).refreshAll(
        productId: productId,
        shopId: shopId
      );
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ShopProductBloc>(context).emit(ShopProductErrorState(message: msg, title: msg));
    }
  }
}
