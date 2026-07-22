abstract class ProductByCategoryState {}

class ProductByCategoryIntialState extends ProductByCategoryState {}

class ProductByCategoryWaitingState extends ProductByCategoryState {}

class ProductByCategorySuccessState extends ProductByCategoryState {
  final data;
  ProductByCategorySuccessState({required this.data});
}

class ProductByCategoryErrorState extends ProductByCategoryState {
  String? title;
  String? message;
  ProductByCategoryErrorState({required this.message, required this.title});
}
