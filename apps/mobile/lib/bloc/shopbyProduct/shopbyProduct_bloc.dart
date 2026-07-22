import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import '../regionSelected/regionSelected_bloc.dart';
import 'shopbyProduct_state.dart';

class ShopByProductBloc extends Cubit<ShopByProductState> {
  DioClient dioClient = DioClient();
  ShopByProductBloc() : super(ShopByProductIntialState());

  Future get(
    BuildContext context,
    
    {
    required String productId,
  }) async {
    emit(ShopByProductWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
     List regions = BlocProvider.of<RegionSelectedBloc>(context).state;
    dio.Response response = await dioClient.get(
      Endpoints.ShopByProduct,
      queryParameters: {
        'key': Endpoints.authKey,
        'product_id': productId,
          'regions' : regions.map((e) => e["id"].toString()).join(",")
        
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    if (response.statusCode == 200) {
      emit(
        ShopByProductSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        ShopByProductErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
