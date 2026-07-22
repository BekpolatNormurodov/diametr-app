import 'package:stroymarket/bloc/order/order_bloc.dart';
import 'package:stroymarket/bloc/order/order_state.dart';
import 'package:stroymarket/bloc/orderAll/orderAll_bloc.dart';
import 'package:stroymarket/bloc/orderAll/orderAll_state.dart';
import 'package:stroymarket/bloc/orderConfirm/OrderConfirm_state.dart';
import 'package:stroymarket/bloc/orderConfirm/orderConfirm_bloc.dart';
import 'package:stroymarket/bloc/orderCreate/orderCreate_state.dart';

import '../bloc/orderCreate/orderCreate_bloc.dart';
import '../export_files.dart';

class OrderManager {
  static Future<void> getAll(
    BuildContext context,
  ) async {
    try {
      await BlocProvider.of<OrderAllBloc>(context).getAll();
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<OrderAllBloc>(context).emit(OrderAllErrorState(message: msg, title: msg));
    }
  }

  static Future<void> refreshAll(
    BuildContext context,
  ) async {
    try {
      await BlocProvider.of<OrderAllBloc>(context).refreshAll();
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<OrderAllBloc>(context).emit(OrderAllErrorState(message: msg, title: msg));
    }
  }

  // static Future<void> finish(
  //   BuildContext context,{String? order_id} ) async {
  //   try {
  //     await BlocProvider.of<FinishOrderBloc>(context).post(
  //       order_id: order_id
  //     );
  //   } catch (e, track) {
  //     print("Manager Error >>" + e.toString());
  //     print("Manager track >>" + track.toString());
  //   }
  // }

  // static Future<void> cancel(
  //   BuildContext context,{String? order_id} ) async {
  //   try {
  //     await BlocProvider.of<CancelOrderBloc>(context).post(
  //       order_id: order_id
  //     );
  //   } catch (e, track) {
  //     print("Manager Error >>" + e.toString());
  //     print("Manager track >>" + track.toString());
  //   }
  // }

  static Future<void> getByid(BuildContext context,
      {required String id}) async {
    try {
      await BlocProvider.of<OrderBloc>(context).get(orderId: id);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<OrderBloc>(context)
          .emit(OrderErrorState(message: msg, title: msg));
    }
  }

  static Future<void> create(BuildContext context, {required data}) async {
    try {
      await BlocProvider.of<OrderCreateBloc>(context).create(data: data);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<OrderCreateBloc>(context)
          .emit(OrderCreateErrorState(message: msg, title: msg));
    }
  }

  static Future<void> confirm(BuildContext context,
      {required String id}) async {
    try {
      await BlocProvider.of<OrderConfirmBloc>(context).confirm(OrderId: id);
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<OrderConfirmBloc>(context)
          .emit(OrderConfirmErrorState(message: msg, title: msg));
    }
  }
}
