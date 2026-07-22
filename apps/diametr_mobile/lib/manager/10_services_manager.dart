






import 'package:stroymarket/bloc/serviceAll/serviceAll_bloc.dart';
import 'package:stroymarket/bloc/serviceAll/serviceAll_state.dart';
import 'package:stroymarket/bloc/worker/worker_bloc.dart';
import 'package:stroymarket/bloc/worker/worker_state.dart';
import 'package:stroymarket/bloc/workerbyService/workerbyService_bloc.dart';
import 'package:stroymarket/bloc/workerbyService/workerbyService_state.dart';



import '../export_files.dart';

class ServicesManager {
  static Future<void> getAll(
    BuildContext context, ) async {
    try {
      await BlocProvider.of<ServiceAllBloc>(context).getAll(
        
      );
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<ServiceAllBloc>(context).emit(ServiceAllErrorState(
        message: msg,
        title: msg,
      ));
    }
  }

  static Future<void> getWorkers(
    BuildContext context,{
      required String serviceId
    } ) async {
    try {
      await BlocProvider.of<WorkerByServiceBloc>(context).get(
        service_id: serviceId
      );
    } catch (e, track) {
      var err = e as DioExceptions;
      print("Manager Error >>" + e.toString());
      print("Manager track >>" + track.toString());
      BlocProvider.of<WorkerByServiceBloc>(context).emit(WorkerByServiceErrorState(
        message: err.message,
        title: err.message,
      ));
    }
  }

  
  static Future<void> getWorkerById(
    BuildContext context,{
      required String WorkerId
    } ) async {
    try {
      await BlocProvider.of<WorkerBloc>(context).get(
        WorkerId: WorkerId
      );
    } catch (e, track) {
      var err = e as DioExceptions;
      print("Manager Error >>" + e.toString());
      print("Manager track >>" + track.toString());
      BlocProvider.of<WorkerBloc>(context).emit(WorkerErrorState(
        message: err.message,
        title: err.message,
      ));
    }
  }



  

}
