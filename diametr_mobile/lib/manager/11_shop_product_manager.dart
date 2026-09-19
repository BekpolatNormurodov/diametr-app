


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
      // The screen (and its route-scoped bloc) may already be gone.
      if (!context.mounted) return;
      final bloc = BlocProvider.of<ShopProductBloc>(context);
      if (bloc.isClosed) return;
      final msg = e is DioExceptions ? e.message : e.toString();
      bloc.emit(ShopProductErrorState(message: msg, title: msg));
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
      // The screen (and its route-scoped bloc) may already be gone.
      if (!context.mounted) return;
      final bloc = BlocProvider.of<ShopProductBloc>(context);
      if (bloc.isClosed) return;
      final msg = e is DioExceptions ? e.message : e.toString();
      bloc.emit(ShopProductErrorState(message: msg, title: msg));
    }
  }
}
