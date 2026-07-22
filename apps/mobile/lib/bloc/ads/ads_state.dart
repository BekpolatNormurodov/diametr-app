abstract class AdsState {}

class AdsIntialState extends AdsState {}

class AdsWaitingState extends AdsState {}

class AdsSuccessState extends AdsState {
  final data;
  AdsSuccessState({required this.data});
}

class AdsErrorState extends AdsState {
  String? title;
  String? message;
  AdsErrorState({required this.message, required this.title});
}
