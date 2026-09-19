import 'package:stroymarket/bloc/categoryAll/categoryAll_bloc.dart';
import 'package:stroymarket/bloc/categoryAll/categoryAll_state.dart';

import '../export_files.dart';

class CategoryManager {
  static Future<void> getAll(
    BuildContext context, {
    bool silent = false,
  }) async {
    try {
      await BlocProvider.of<CategoryAllBloc>(context).getAll(silent: silent);
    } catch (e) {
      if (silent &&
          BlocProvider.of<CategoryAllBloc>(context).state
              is CategoryAllSuccessState) {
        return;
      }
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<CategoryAllBloc>(context).emit(CategoryAllErrorState(
        message: msg,
        title: msg,
      ));
    }
  }
}
