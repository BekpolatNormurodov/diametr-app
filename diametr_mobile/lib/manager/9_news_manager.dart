


import 'package:stroymarket/bloc/news/news_bloc.dart';
import 'package:stroymarket/bloc/news/news_state.dart';

import '../export_files.dart';

class NewsManager {
  static Future<void> getAll(
    BuildContext context, {
    bool silent = false,
  }) async {
    try {
      await BlocProvider.of<NewsBloc>(context).get(silent: silent);
    } catch (e) {
      if (silent &&
          BlocProvider.of<NewsBloc>(context).state is NewsSuccessState) {
        return;
      }
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<NewsBloc>(context).emit(NewsErrorState(
        message: msg,
        title: msg,
      ));
    }
  }
}
