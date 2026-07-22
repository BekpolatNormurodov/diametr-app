import 'package:stroymarket/bloc/product/product_bloc.dart';
import 'package:stroymarket/bloc/product/product_state.dart';
import 'package:stroymarket/bloc/productAll/productAll_bloc.dart';
import 'package:stroymarket/bloc/productAll/productAll_state.dart';
import 'package:stroymarket/bloc/productbyCategory/productbyCategory_bloc.dart';
import 'package:stroymarket/bloc/productbyCategory/productbyCategory_state.dart';

import '../export_files.dart';

class ProductManager {
  static Future<void> getbyCategoryId(BuildContext context,
      {required String categoryId}) async {
    try {
      await BlocProvider.of<ProductByCategoryBloc>(context)
          .get(categoryId: categoryId);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ProductByCategoryBloc>(context)
          .emit(ProductByCategoryErrorState(message: msg, title: msg));
    }
  }

  static Future<void> getAll(
    BuildContext context,
  ) async {
    try {
      await BlocProvider.of<ProductAllBloc>(context).getAll();
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ProductAllBloc>(context)
          .emit(ProductAllErrorState(message: msg, title: msg));
    }
  }

  static Future<void> getById(BuildContext context,
      {required String ProductId}) async {
    try {
      await BlocProvider.of<ProductBloc>(context).get(ProductId: ProductId);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ProductBloc>(context)
          .emit(ProductErrorState(message: msg, title: msg));
    }
  }
}
