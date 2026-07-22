import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'worker_state.dart';

class WorkerBloc extends Cubit<WorkerState> {
  DioClient dioClient = DioClient();
  WorkerBloc() : super(WorkerIntialState());

  Future get({
   required String WorkerId
  }) async {
    emit(WorkerWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.Worker + WorkerId,
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
        WorkerSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        WorkerErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
