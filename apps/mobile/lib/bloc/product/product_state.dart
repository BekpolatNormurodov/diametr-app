abstract class ProductState {}

class ProductIntialState extends ProductState {}

class ProductWaitingState extends ProductState {}

class ProductSuccessState extends ProductState {
  final data;
  ProductSuccessState({required this.data});
}

class ProductErrorState extends ProductState {
  String? title;
  String? message;
  ProductErrorState({required this.message, required this.title});
}
