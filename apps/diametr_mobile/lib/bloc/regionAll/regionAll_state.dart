abstract class RegionAllState {}

class RegionAllIntialState extends RegionAllState {}

class RegionAllWaitingState extends RegionAllState {}

class RegionAllSuccessState extends RegionAllState {
  final data;
  RegionAllSuccessState({required this.data});
}

class RegionAllErrorState extends RegionAllState {
  String? title;
  String? message;
  RegionAllErrorState({required this.message, required this.title});
}
