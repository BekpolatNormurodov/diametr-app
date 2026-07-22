import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'productbyCategory_state.dart';

class ProductByCategoryBloc extends Cubit<ProductByCategoryState> {
  DioClient dioClient = DioClient();
  ProductByCategoryBloc() : super(ProductByCategoryIntialState());

  Future get({
   required String categoryId
  }) async {
    emit(ProductByCategoryWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.Product,
      queryParameters: {
        'key': Endpoints.authKey,
        'category_id' : categoryId
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    if (response.statusCode == 200) {
      emit(
        ProductByCategorySuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        ProductByCategoryErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
