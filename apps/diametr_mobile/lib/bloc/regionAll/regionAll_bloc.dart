import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'regionAll_state.dart';

class RegionAllBloc extends Cubit<RegionAllState> {
  DioClient dioClient = DioClient();
  RegionAllBloc() : super(RegionAllIntialState());

  Future getAll() async {
    emit(RegionAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.RegionAll,
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
        RegionAllSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        RegionAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
