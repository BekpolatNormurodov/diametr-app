abstract class ShopByProductState {}

class ShopByProductIntialState extends ShopByProductState {}

class ShopByProductWaitingState extends ShopByProductState {}

class ShopByProductSuccessState extends ShopByProductState {
  final data;
  ShopByProductSuccessState({required this.data,});
}

class ShopByProductErrorState extends ShopByProductState {
  String? title;
  String? message;
  ShopByProductErrorState({required this.message, required this.title});
}
