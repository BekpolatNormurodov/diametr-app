abstract class ProductAllState {}

class ProductAllIntialState extends ProductAllState {}

class ProductAllWaitingState extends ProductAllState {}

class ProductAllSuccessState extends ProductAllState {
  final data;
  ProductAllSuccessState({required this.data});
}

class ProductAllErrorState extends ProductAllState {
  String? title;
  String? message;
  ProductAllErrorState({required this.message, required this.title});
}
