import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'orderAll_state.dart';

class OrderAllBloc extends Cubit<OrderAllState> {
  DioClient dioClient = DioClient();
  OrderAllBloc() : super(OrderAllIntialState());

  Future getAll() async {
    emit(OrderAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.OrderAll,
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
        OrderAllSuccessState(
         data: (response.data as List).reversed.toList(),
        ),
      );
    } else {
      emit(
        OrderAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
    Future refreshAll() async {
   
   if (state is OrderAllSuccessState) {
      String? token = await StorageService().read(
      StorageService.token,
    );

    dio.Response response = await dioClient.get(
      Endpoints.OrderAll,
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
        OrderAllSuccessState(
          data: (response.data as List).reversed.toList(),
        ),
      );
    } else {
      emit(
        OrderAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
   }
  }



}
