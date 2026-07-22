abstract class ShopProductState {}

class ShopProductIntialState extends ShopProductState {}

class ShopProductWaitingState extends ShopProductState {}

class ShopProductSuccessState extends ShopProductState {
  final data;
  final tavsiyalar;
  ShopProductSuccessState({required this.data,required this.tavsiyalar});
}

class ShopProductErrorState extends ShopProductState {
  String? title;
  String? message;
  ShopProductErrorState({required this.message, required this.title});
}
