import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'productAll_state.dart';

class ProductAllBloc extends Cubit<ProductAllState> {
  DioClient dioClient = DioClient();
  ProductAllBloc() : super(ProductAllIntialState());

  Future getAll() async {
    emit(ProductAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.ProductAll,
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
        ProductAllSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        ProductAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
