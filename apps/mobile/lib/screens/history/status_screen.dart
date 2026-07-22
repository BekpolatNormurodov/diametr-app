// ignore_for_file: file_names, prefer_const_constructors

import 'package:map_launcher/map_launcher.dart';
import 'package:stroymarket/core/extensions/date_extension.dart';
import 'package:stroymarket/core/extensions/str.dart';

import '../../bloc/order/order_bloc.dart';
import '../../bloc/order/order_state.dart';
import '../../bloc/shop/shop_bloc.dart';
import '../../bloc/shop/shop_state.dart';
import '../../export_files.dart';
import '../../manager/3_order_manager.dart';
import '../../manager/8_shop_manager.dart';
import '../../services/loading/loading_service.dart';

class StatusScreen extends StatefulWidget {
  String? id;
  String? order_id;
  String? shop_id;
  String? status;

  StatusScreen({
    super.key,
    required this.order_id,
    required this.id,
    required this.shop_id,
    required this.status,
  });

  @override
  State<StatusScreen> createState() => _StatusScreenState();
}

class _StatusScreenState extends State<StatusScreen> {
  @override
  void initState() {
    OrderManager.getByid(context, id: widget.id ?? "");
    ShopManager.getById(context, ShopId: widget.shop_id ?? "");
    super.initState();
  }

  LoadingService loadingService = LoadingService();

  @override
  Widget build(BuildContext context) {
    var scaffoldKey = GlobalKey<ScaffoldState>();
    return Scaffold(
      backgroundColor: context.tBg,
      resizeToAvoidBottomInset: true,
      appBar: CustomAppBar(
        scaffoldKey,
        'Buyurtma : ${widget.order_id ?? "- - -"}',
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
      ),
      body: Stack(
        children: [
          SizedBox(
            height: 1.sh,
            width: 1.sw,
            child: ListView(
              shrinkWrap: true,
              scrollDirection: Axis.vertical,
              children: [
                BlocBuilder<ShopBloc, ShopState>(builder: (context, state) {
                  if (state is ShopSuccessState) {
                    if (state.data == null) {
                      return EmptyState(
                        height: 320.h,
                        icon: Iconsax.shop,
                        title: "Do'kon ma'lumotlari topilmadi",
                        subtitle:
                            "Buyurtma qilingan do'kon hozircha mavjud emas.",
                      );
                    }
                    return _marketSection(
                        context, state.data, state.admin, state.products);
                  } else if (state is ShopWaitingState) {
                    return _loadingWidget(context);
                  } else {
                    return const SizedBox();
                  }
                }),
                BlocBuilder<OrderBloc, OrderState>(builder: (context, state) {
                  if (state is OrderSuccessState) {
                    if (state.data == null) {
                      return EmptyState(
                        height: 240.h,
                        icon: Iconsax.receipt_1,
                        title: "Buyurtma topilmadi",
                        subtitle: "Bu buyurtma haqida ma'lumot mavjud emas.",
                      );
                    }
                    return _orderSection(context, state.data ?? []);
                  } else if (state is OrderWaitingState) {
                    return _loadingWidget(context);
                  } else {
                    return const SizedBox();
                  }
                }),
                SizedBox(height: 120.h),
              ],
            ),
          ),
          Positioned(
            bottom: 0,
            child: Image.asset(
              widget.status == "CANCELED"
                  ? "assets/images/error_bg.png"
                  : "assets/images/success_bg.png",
              width: 1.sw,
              fit: BoxFit.fitWidth,
              color: widget.status == "STARTED"
                  ? const Color(0xFFFFCF5C)
                  : (widget.status == "FINISHED"
                      ? const Color(0xFF0084F4)
                      : null),
            ),
          ),
        ],
      ),
    );
  }

  Widget _loadingWidget(BuildContext context) {
    return SizedBox(
      height: 280.h,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(
              color: AppConstant.primaryColor,
              strokeWidth: 3.w,
              strokeCap: StrokeCap.round,
              backgroundColor: AppConstant.primaryColor.withValues(alpha: 0.2),
            ),
            SizedBox(height: 20.h),
            Text(
              "Ma'lumot yuklanmoqda...",
              style: TextStyle(color: context.tSub, fontSize: 14.sp),
            ),
          ],
        ),
      ),
    );
  }

  Widget _marketSection(BuildContext context, data, admin, products) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 220.h,
          width: 1.sw,
          child: Stack(
            children: [
              SizedBox(
                height: 220.h,
                width: 1.sw,
                child: data["image"] != null
                    ? CachedNetworkImage(
                        imageUrl: Endpoints.img('shops', data["image"]),
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: AppConstant.greyColor.withValues(alpha: 0.6),
                          highlightColor: Colors.white70,
                          child: Container(color: AppConstant.greyColor),
                        ),
                        errorWidget: (context, url, error) =>
                            const AppImagePlaceholder(),
                      )
                    : const AppImagePlaceholder(),
              ),
              Positioned(
                bottom: 16.w,
                right: 16.w,
                child: GestureDetector(
                  onTap: () async {
                    try {
                      final coords = Coords(
                        double.tryParse(
                                data["location"]["lat"].toString()) ??
                            0,
                        double.tryParse(
                                data["location"]["lon"].toString()) ??
                            0,
                      );
                      final title = data["name"] ?? "";
                      final availableMaps = await MapLauncher.installedMaps;
                      // ignore: use_build_context_synchronously
                      showModalBottomSheet(
                        context: context,
                        backgroundColor: context.tCard,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.vertical(
                              top: Radius.circular(20.r)),
                        ),
                        builder: (BuildContext ctx) {
                          return SafeArea(
                            child: SingleChildScrollView(
                              child: Wrap(
                                children: availableMaps
                                    .map((map) => ListTile(
                                          onTap: () => map.showMarker(
                                              coords: coords, title: title),
                                          title: Text(map.mapName,
                                              style: TextStyle(
                                                  color: context.tText)),
                                          leading: SvgPicture.asset(
                                            map.icon,
                                            height: 30.0,
                                            width: 30.0,
                                            clipBehavior: Clip.none,
                                          ),
                                        ))
                                    .toList(),
                              ),
                            ),
                          );
                        },
                      );
                    } catch (e) {
                      debugPrint(e.toString());
                    }
                  },
                  child: Container(
                    padding: EdgeInsets.all(10.w),
                    decoration: BoxDecoration(
                      color: context.tCard.withValues(alpha: 0.92),
                      border: Border.all(
                          width: 1.5.w, color: AppConstant.primaryColor),
                      shape: BoxShape.circle,
                    ),
                    child: Image.asset(
                      'assets/images/go_location.png',
                      width: 18.w,
                      height: 18.w,
                      color: AppConstant.primaryColor,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          color: context.tBg,
          padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 4.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _InfoRow(icon: Iconsax.shop, text: data["name"] ?? ""),
              SizedBox(height: 12.h),
              _InfoRow(icon: Iconsax.location, text: data["address"] ?? ""),
              SizedBox(height: 12.h),
              _InfoRow(icon: Iconsax.call, text: admin?["phone"] ?? ""),
              SizedBox(height: 16.h),
              Divider(color: context.tDivider, thickness: 0.5.h, height: 0),
            ],
          ),
        ),
      ],
    );
  }

  Widget _orderSection(BuildContext context, data) {
    final deliveryTexts = {
      "MARKET": "Do'kondan olib ketish",
      "YANDEX": "Yandex orqali yetkazish",
      "FIXED": "Standart yetkazish",
    };

    final rows = [
      {
        'label': 'Sana',
        'value': DateTime.tryParse("${data["createdt"] ?? ""}").toMyFormatStatus()
      },
      {
        'label': 'Narxi',
        'value': "${data["amount"] ?? ""}".toMoney() + " so'm"
      },
      {
        'label': 'Xarid turi',
        'value': deliveryTexts[data?["delivery_type"] ?? "MARKET"] ?? ""
      },
    ];

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...rows.map((row) => Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: EdgeInsets.symmetric(vertical: 10.h),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          row['label'] ?? '',
                          style: TextStyle(
                            fontSize: 14.sp,
                            color: context.tSub,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        Text(
                          row['value'] ?? '',
                          style: TextStyle(
                            fontSize: 14.sp,
                            color: context.tText,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Divider(
                      color: context.tDivider, thickness: 0.5.h, height: 0),
                ],
              )),
          SizedBox(height: 16.h),
          _productsSection(context, data["products"] ?? []),
        ],
      ),
    );
  }

  Widget _productsSection(BuildContext context, List products) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Mahsulotlar",
          style: TextStyle(
            fontSize: 14.sp,
            color: context.tText,
            fontWeight: FontWeight.w600,
          ),
        ),
        SizedBox(height: 10.h),
        ...products.map((e) => Container(
              margin: EdgeInsets.only(bottom: 10.h),
              padding:
                  EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: context.tCard,
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8.r),
                    child: SizedBox(
                      width: 58.w,
                      height: 58.w,
                      child: e["image"] != null
                          ? CachedNetworkImage(
                              fit: BoxFit.cover,
                              imageUrl: Endpoints.img('product-items', e["image"]),
                              placeholder: (context, url) => Shimmer.fromColors(
                                baseColor:
                                    AppConstant.greyColor.withValues(alpha: 0.6),
                                highlightColor: Colors.white70,
                                child: Container(color: AppConstant.greyColor),
                              ),
                              errorWidget: (context, url, error) =>
                                  AppImagePlaceholder(minimal: true, puckSize: 36.w, iconSize: 14.sp),
                            )
                          : AppImagePlaceholder(minimal: true, puckSize: 36.w, iconSize: 14.sp),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${e["shop_product"]["product_item"]["name"]}, '
                          '${e["shop_product"]["product_item"]["product"]["name"]}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 13.sp,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 4.h),
                        Text(
                          'Soni: ${e["count"] ?? ""}',
                          style: TextStyle(
                              color: context.tSub, fontSize: 12.sp),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 8.w),
                  Text(
                    '${((e["amount"] ?? 0) * (e["count"] ?? 0)).toString().toMoney()} so\'m',
                    style: TextStyle(
                      color: AppConstant.primaryColor,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppConstant.primaryColor, size: 18.sp),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: context.tText,
              fontSize: 14.sp,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }
}
