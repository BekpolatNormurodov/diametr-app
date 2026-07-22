abstract class NewsState {}

class NewsIntialState extends NewsState {}

class NewsWaitingState extends NewsState {}

class NewsSuccessState extends NewsState {
  final data;
  NewsSuccessState({required this.data});
}

class NewsErrorState extends NewsState {
  String? title;
  String? message;
  NewsErrorState({required this.message, required this.title});
}
