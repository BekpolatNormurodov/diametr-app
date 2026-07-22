abstract class WorkerState {}

class WorkerIntialState extends WorkerState {}

class WorkerWaitingState extends WorkerState {}

class WorkerSuccessState extends WorkerState {
  final data;
  WorkerSuccessState({required this.data});
}

class WorkerErrorState extends WorkerState {
  String? title;
  String? message;
  WorkerErrorState({required this.message, required this.title});
}
