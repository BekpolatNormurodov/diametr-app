import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'orderCreate_state.dart';

class OrderCreateBloc extends Cubit<OrderCreateState> {
  DioClient dioClient = DioClient();
  OrderCreateBloc() : super(OrderCreateIntialState());

  Future create({
   required data
  }) async {
    emit(OrderCreateWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.post(
      Endpoints.OrderCreate,
      data: data,
      queryParameters: {
        'key': Endpoints.authKey,
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    if (response.statusCode == 201) {
      emit(
        OrderCreateSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        OrderCreateErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
