import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'serviceAll_state.dart';

class ServiceAllBloc extends Cubit<ServiceAllState> {
  DioClient dioClient = DioClient();
  ServiceAllBloc() : super(ServiceAllIntialState());

  Future getAll() async {
    emit(ServiceAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.ServiceAll,
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
        ServiceAllSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        ServiceAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
