import 'package:stroymarket/manager/5_product_manager.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';

import '../../bloc/product/product_bloc.dart';
import '../../bloc/product/product_state.dart';
import '../../bloc/shopbyProduct/shopbyProduct_bloc.dart';
import '../../bloc/shopbyProduct/shopbyProduct_state.dart';
import '../../export_files.dart';

// ignore: must_be_immutable
class ProductScreen extends StatefulWidget {
  String? name;
  String? product_id;
  ProductScreen({super.key, required this.name, required this.product_id});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final GlobalKey<FormState> formKey = GlobalKey();
  final GlobalKey<FormState> formKey1 = GlobalKey();
  TextEditingController controller = TextEditingController();
  TextEditingController controller1 = TextEditingController();

  List<String> images = [
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/white-disposable-lighter-rXgg90zA820',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/white-disposable-lighter-rXgg90zA820',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
  ];

  List<String> titles = [
    'Kalit',
    "Bolg'a",
    'Zajigalka',
    "Bolg'a",
    'Kalit',
    'Kalit',
    "Bolg'a",
    'Zajigalka',
    "Bolg'a",
    'Kalit',
  ];

  List<Map> products = [
    {"name": '4 ta tishlik Kalit', "price": "400 000 so'm"},
    {"name": 'Qulf uchun kalit', "price": "90 000 so'm"},
    {"name": 'Darvoza kaliti', "price": "250 000 so'm"},
    {"name": '4 ta tishlik Kalit', "price": "400 000 so'm"},
  ];

  String dropdownValue = 'Turlari';
  List<String> items = [
    'Turlari',
    'Oq - 3kg - metal idishli',
    'Qizil - 4kg - yog\'och idishli',
    'Yashil - 3kg - plastik idishli',
    'Sariq - 7kg - shisha idishli',
  ];
  int itemCount = 1;

  @override
  void initState() {
    ProductManager.getById(context, ProductId: widget.product_id ?? "");
    ShopManager.getByProductId(context, productId: widget.product_id ?? "");
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        widget.name ?? "",
        () {
          Navigator.of(context).pop();
        },
        'assets/icons/chevron-left.png',
      ),
      body: SafeArea(child: ProductScreenBody()),
    );
  }

  ProductScreenBody<Widget>() {
    return ListView(
      shrinkWrap: true,
      scrollDirection: Axis.vertical,
      children: [
        BlocBuilder<ProductBloc, ProductState>(builder: (context, state) {
          if (state is ProductSuccessState) {
            if (state.data == null) {
              return EmptyState(
                height: 480.h,
                icon: Iconsax.box_remove,
                title: "Mahsulot mavjud emas",
                subtitle:
                    "Bu mahsulot olib tashlangan yoki vaqtincha sotuvda yo'q.",
              );
            }
            // ── Resolve image: product.image OR first item.image ──
            final String? productImg = state.data["image"]?.toString();
            final List itemsList = (state.data["items"] is List)
                ? state.data["items"] as List
                : const [];
            String? itemImg;
            for (final it in itemsList) {
              final v = it is Map ? it["image"]?.toString() : null;
              if (v != null && v.isNotEmpty) {
                itemImg = v;
                break;
              }
            }
            final String? resolvedImageUrl =
                (productImg != null && productImg.isNotEmpty)
                    ? Endpoints.img('products', productImg)
                    : (itemImg != null
                        ? Endpoints.img('product-items', itemImg)
                        : null);
            final String? desc = state.data["desc"]?.toString();
            final bool hasDesc =
                desc != null && desc.isNotEmpty && desc != 'null';
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 220.h,
                  width: 1.sw,
                  child: resolvedImageUrl != null
                      ? CachedNetworkImage(
                          fit: BoxFit.cover,
                          imageUrl: resolvedImageUrl,
                          placeholder: (ctx, url) => Shimmer.fromColors(
                            baseColor: ctx.tInput,
                            highlightColor: ctx.tDivider,
                            child: Container(color: ctx.tInput),
                          ),
                          errorWidget: (ctx, url, error) =>
                              const AppImagePlaceholder(),
                        )
                      : const AppImagePlaceholder(),
                ),
                Padding(
                  padding: EdgeInsets.all(16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        child: Row(
                          children: [
                            Image.asset(
                              'assets/icons/home.png',
                              scale: 3.sp,
                              color: context.tIconTint,
                            ),
                            SizedBox(width: 10.w),
                            Text(
                              'Stroymarket',
                              style: TextStyle(
                                color: context.tText,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (hasDesc) ...[
                        SizedBox(height: 16.h),
                        Text(
                          desc,
                          style: TextStyle(
                            color: context.tSub,
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            );
          } else if (state is ProductWaitingState) {
            return const ProductDetailSkeleton();
          } else {
            return SizedBox();
          }
        }),

        Divider(thickness: 0.2, color: context.tDivider),
        SizedBox(height: 8.h),
        BlocBuilder<ShopByProductBloc, ShopByProductState>(
            builder: (context, state) {
          if (state is ShopByProductSuccessState) {
            final list = state.data ?? [];
            if (list.isEmpty) {
              return Padding(
                padding: EdgeInsets.symmetric(vertical: 24.h),
                child: EmptyState(
                  height: 280.h,
                  icon: Iconsax.shop_remove,
                  title: "Do'kon topilmadi",
                  subtitle:
                      "Bu mahsulotni sotayotgan do'konlar hali ro'yxatda yo'q.",
                ),
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  child: Row(
                    children: [
                      Container(
                        width: 32.w,
                        height: 32.w,
                        decoration: BoxDecoration(
                          color: AppConstant.primaryColor
                              .withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Icon(
                          Iconsax.shop,
                          color: AppConstant.primaryColor,
                          size: 16.sp,
                        ),
                      ),
                      SizedBox(width: 10.w),
                      Expanded(
                        child: Text(
                          "Tovar mavjud do'konlar",
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 15.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 8.w, vertical: 2.h),
                        decoration: BoxDecoration(
                          color: AppConstant.primaryColor
                              .withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Text(
                          '${list.length}',
                          style: TextStyle(
                            color: AppConstant.primaryColor,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 14.h),
                ShopByProductScreenBody(list),
              ],
            );
          } else if (state is ShopByProductWaitingState) {
            return const ShopListSkeleton();
          } else {
            return SizedBox();
          }
        }),

        SizedBox(height: 16.h),
      ],
    );
  }

  customContainer(double width, Widget child, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        alignment: Alignment.center,
        width: width.w,
        height: width.h,
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(10.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(
                  alpha: context.isDark ? 0.18 : 0.06),
              blurRadius: 5,
              spreadRadius: 1,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: child,
      ),
    );
  }

  Widget ShopByProductScreenBody(List data) {
    return SizedBox(
      width: 1.sw,
      height: 200.h,
      child: ListView.builder(
        padding: EdgeInsets.symmetric(horizontal: 10.w),
        itemCount: data.length,
        scrollDirection: Axis.horizontal,
        shrinkWrap: true,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              Navigator.of(context).pushNamed('/marketScreen', arguments: {
                "id": data[index]["id"],
                "name": data[index]["name"],
              });
            },
            child: Container(
              margin: EdgeInsets.all(10.w),
              width: 150.w,
              decoration: BoxDecoration(
                color: context.tCard,
                borderRadius: BorderRadius.circular(10.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(
                        alpha: context.isDark ? 0.20 : 0.08),
                    blurRadius: 6,
                    spreadRadius: 1,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Expanded(
                    flex: 6,
                    child: SizedBox(
                      width: MediaQuery.of(context).size.width,
                      child: ClipRRect(
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(10.r),
                          topRight: Radius.circular(10.r),
                        ),
                        child: CachedNetworkImage(
                          fit: BoxFit.cover,
                          imageUrl: Endpoints.img('shops', data[index]["image"]),
                          placeholder: (ctx, url) => Shimmer.fromColors(
                            baseColor: ctx.tInput,
                            highlightColor: ctx.tDivider,
                            child: Container(color: ctx.tInput),
                          ),
                          errorWidget: (context, url, error) =>
                              const AppImagePlaceholder(),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      width: double.infinity,
                      child: Padding(
                        padding: EdgeInsets.only(left: 10.w),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "${data[index]["name"]}",
                              style: TextStyle(
                                color: context.tText,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            SizedBox(height: 3.h),
                            Text(
                              data[index]["address"].toString(),
                              style: TextStyle(
                                color: context.tSub,
                                fontSize: 10.sp,
                                fontWeight: FontWeight.w300,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
