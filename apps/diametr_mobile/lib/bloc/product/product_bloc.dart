import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'product_state.dart';

class ProductBloc extends Cubit<ProductState> {
  DioClient dioClient = DioClient();
  ProductBloc() : super(ProductIntialState());

  Future get({
   required String ProductId
  }) async {
    emit(ProductWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.Product + ProductId,
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
        ProductSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        ProductErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
