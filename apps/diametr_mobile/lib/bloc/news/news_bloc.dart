import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'news_state.dart';

class NewsBloc extends Cubit<NewsState> {
  DioClient dioClient = DioClient();
  NewsBloc() : super(NewsIntialState());

  Future get() async {
    emit(NewsWaitingState());
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
    } else {
      emit(
        NewsErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
