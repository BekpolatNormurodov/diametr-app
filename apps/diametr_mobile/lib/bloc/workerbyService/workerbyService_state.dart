abstract class WorkerByServiceState {}

class WorkerByServiceIntialState extends WorkerByServiceState {}

class WorkerByServiceWaitingState extends WorkerByServiceState {}

class WorkerByServiceSuccessState extends WorkerByServiceState {
  final data;
  WorkerByServiceSuccessState({required this.data});
}

class WorkerByServiceErrorState extends WorkerByServiceState {
  String? title;
  String? message;
  WorkerByServiceErrorState({required this.message, required this.title});
}
