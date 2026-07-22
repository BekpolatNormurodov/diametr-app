


import 'package:stroymarket/bloc/news/news_bloc.dart';
import 'package:stroymarket/bloc/news/news_state.dart';

import '../export_files.dart';

class NewsManager {
  static Future<void> getAll(
    BuildContext context,
  ) async {
    try {
      await BlocProvider.of<NewsBloc>(context).get();
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<NewsBloc>(context).emit(NewsErrorState(
        message: msg,
        title: msg,
      ));
    }
  }
}
