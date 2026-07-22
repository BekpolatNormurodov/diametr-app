import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'workerbyService_state.dart';

class WorkerByServiceBloc extends Cubit<WorkerByServiceState> {
  DioClient dioClient = DioClient();
  WorkerByServiceBloc() : super(WorkerByServiceIntialState());

  Future get({
   required String service_id
  }) async {
    emit(WorkerByServiceWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.Worker,
      queryParameters: {
        'key': Endpoints.authKey,
        'service_id': service_id
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    if (response.statusCode == 200) {
      emit(
        WorkerByServiceSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        WorkerByServiceErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
