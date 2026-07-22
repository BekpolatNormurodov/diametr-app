abstract class ShopState {}

class ShopIntialState extends ShopState {}

class ShopWaitingState extends ShopState {}

class ShopSuccessState extends ShopState {
  final data;
  final admin;
  final products;
  ShopSuccessState({required this.data,required this.admin,required this.products});
}

class ShopErrorState extends ShopState {
  String? title;
  String? message;
  ShopErrorState({required this.message, required this.title});
}
