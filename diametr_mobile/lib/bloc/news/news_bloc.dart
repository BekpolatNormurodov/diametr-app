import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'news_state.dart';

class NewsBloc extends Cubit<NewsState> {
  DioClient dioClient = DioClient();
  NewsBloc() : super(NewsIntialState());

  /// [silent] is a background refresh (app resume): keep what is on screen
  /// instead of flashing the skeleton, and keep it if the refresh fails.
  Future get({bool silent = false}) async {
    final bool keep = silent && state is NewsSuccessState;
    if (!keep) emit(NewsWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.News,
      queryParameters: {
        'key': Endpoints.authKey,
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    if (response.statusCode == 200) {
      emit(
        NewsSuccessState(
          data: response.data,
        ),
      );
    } else if (!keep) {
      emit(
        NewsErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
