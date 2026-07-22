abstract class ShopAllState {}

class ShopAllIntialState extends ShopAllState {}

class ShopAllWaitingState extends ShopAllState {}

class ShopAllSuccessState extends ShopAllState {
  final data;
  ShopAllSuccessState({required this.data});
}

class ShopAllErrorState extends ShopAllState {
  String? title;
  String? message;
  ShopAllErrorState({required this.message, required this.title});
}
