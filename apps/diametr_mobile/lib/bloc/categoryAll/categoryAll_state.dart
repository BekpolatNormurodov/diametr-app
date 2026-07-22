abstract class CategoryAllState {}

class CategoryAllIntialState extends CategoryAllState {}

class CategoryAllWaitingState extends CategoryAllState {}

class CategoryAllSuccessState extends CategoryAllState {
  final data;
  CategoryAllSuccessState({required this.data});
}

class CategoryAllErrorState extends CategoryAllState {
  String? title;
  String? message;
  CategoryAllErrorState({required this.message, required this.title});
}
