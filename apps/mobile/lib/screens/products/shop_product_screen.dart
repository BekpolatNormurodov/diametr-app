import 'package:fluttertoast/fluttertoast.dart';
import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/manager/11_shop_product_manager.dart';
import 'package:stroymarket/services/storage/storage_service.dart';
import 'package:stroymarket/widgets/common/custom_button.dart';

import '../../bloc/savatcha/savatcha_bloc.dart';
import '../../bloc/shopProduct/shopProduct_state.dart';
import '../../bloc/shopProduct/shopProduct_bloc.dart';
import '../../export_files.dart';

// ignore: must_be_immutable
class ShopProductScreen extends StatefulWidget {
  String? name;
  String? product_id;
  String? shop_id;
  String? desc;
  String? image;

  ShopProductScreen(
      {super.key,
      required this.name,
      required this.product_id,
      required this.shop_id,
      required this.desc,
      required this.image});

  @override
  State<ShopProductScreen> createState() => _ShopProductScreenState();
}

class _ShopProductScreenState extends State<ShopProductScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final GlobalKey<FormState> formKey = GlobalKey();
  final GlobalKey<FormState> formKey1 = GlobalKey();
  TextEditingController controller = TextEditingController();
  TextEditingController controller1 = TextEditingController();

  int itemCount = 1;
  int selectTypeIndex = 0;

  @override
  void initState() {
    ShopProductManager.getAll(context,
        productId: widget.product_id ?? " ", shopId: widget.shop_id ?? "");
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: new CustomAppBar(scaffoldKey, widget.name ?? "- - -", () {
        Navigator.of(context).pop();
      }, 'assets/icons/chevron-left.png', savatcha: true),
      body: BlocBuilder<ShopProductBloc, ShopProductState>(
          builder: (context, state) {
        if (state is ShopProductSuccessState) {
          if (state.data.length == 0) {
            return EmptyState(
              icon: Iconsax.shop,
              title: "Do'kon hozircha mavjud emas",
              subtitle:
                  "Hozircha bu mahsulot biror do'konda topilmadi. Keyinroq qayta urinib ko'ring.",
            );
          }
          return SafeArea(
              child: ShopProductScreenBody(state.data, state.tavsiyalar));
        } else if (state is ShopProductWaitingState) {
          return Center(
              child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(
                color: AppConstant.primaryColor,
                strokeWidth: 6.w,
                strokeAlign: 2,
                strokeCap: StrokeCap.round,
                backgroundColor: AppConstant.primaryColor.withOpacity(0.2),
              ),
              SizedBox(
                height: 48.h,
              ),
              SizedBox(
                width: 365.w,
                child: Text(
                  "Ma\'lumot yuklanmoqda...",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: context.tText,
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w300,
                  ),
                ),
              ),
            ],
          ));
        } else {
          return SizedBox();
        }
      }),
    );
  }

  Future addProductToSavatcha(itemData) async {
    List savatchaData = StorageService().read(StorageService.savatcha) ?? [];
    if (savatchaData.length > 0) {
      if (savatchaData[0]["shop_id"].toString() !=
          itemData["shop_id"].toString()) {
        return false;
      }
    }
    savatchaData.add({
      "id": itemData["id"],
      "name": itemData["name"],
      "product_name": itemData["product_name"],
      "image": itemData["image"],
      "price": itemData["price"],
      "count": itemData["count"],
      "shop_id": itemData["shop_id"],
      "product_id" : itemData["product_id"],
    });
    // await SavatchaManager.changeValue(context, data: savatchaData);
      context.read<SavatchaBloc>().changeValue(
                               savatchaData);
    
    await StorageService().write(StorageService.savatcha, savatchaData);
    setState(() {});
    return true;
  }

  static const Map<String, String> _colorNames = {
    '#EF4444': 'Qizil', '#DC2626': "To'q qizil", '#F87171': 'Och qizil',
    '#B91C1C': 'Qon qizil', '#FCA5A5': 'Pushti qizil',
    '#EC4899': 'Pushti', '#F472B6': 'Och pushti', '#BE185D': "To'q pushti",
    '#F97316': 'Zangori', '#FB923C': 'Och zangori', '#EA580C': "To'q zangori",
    '#EAB308': 'Sariq', '#FACC15': 'Och sariq', '#CA8A04': "To'q sariq",
    '#FDE047': 'Limon', '#FCD34D': 'Oltin',
    '#22C55E': 'Yashil', '#16A34A': "To'q yashil", '#4ADE80': 'Och yashil',
    '#15803D': "O'rmon", '#86EFAC': 'Menta', '#A3E635': 'Salat',
    '#14B8A6': 'Havorang', '#2DD4BF': 'Och havo', '#0D9488': "To'q havo",
    '#3B82F6': "Ko'k", '#2563EB': "To'q ko'k", '#60A5FA': "Och ko'k",
    '#1D4ED8': "Quyuq ko'k", '#93C5FD': 'Osmon',
    '#06B6D4': 'Moviy', '#0EA5E9': 'Dengiz',
    '#8B5CF6': 'Binafsha', '#7C3AED': "To'q binafsha", '#A78BFA': 'Och binafsha',
    '#6D28D9': 'Indigo',
    '#92400E': 'Jigarrang', '#A16207': 'Och jigarrang', '#78350F': 'Shokolad',
    '#D97706': 'Qahrabo',
    '#6B7280': 'Kulrang', '#9CA3AF': 'Och kulrang', '#4B5563': "To'q kulrang",
    '#D1D5DB': 'Kumush',
    '#FFFFFF': 'Oq', '#000000': 'Qora', '#1E293B': "Qora ko'k",
    '#F5F5DC': 'Bej', '#FFFDD0': 'Krem', '#C0C0C0': 'Kumush',
  };

  String _getColorLabel(String? colorStr, String variantName) {
    if (colorStr != null && _colorNames.containsKey(colorStr.toUpperCase())) {
      return _colorNames[colorStr.toUpperCase()]!;
    }
    return variantName;
  }

  Color? _parseColor(String? colorStr) {
    if (colorStr == null || colorStr.isEmpty) return null;
    if (colorStr.startsWith('#')) {
      final hex = colorStr.replaceFirst('#', '');
      if (hex.length == 6) {
        final intVal = int.tryParse(hex, radix: 16);
        if (intVal != null) return Color(0xFF000000 | intVal);
      }
    }
    return null;
  }

  bool _hasAnyColor(List data) {
    return data.any((e) => _parseColor(e["color"]?.toString()) != null);
  }

  Widget _buildVariantSelector(List data) {
    final hasColors = _hasAnyColor(data);

    if (hasColors) {
      // Color circles style (marketplace)
      return Wrap(
        spacing: 10.w,
        runSpacing: 10.h,
        children: List.generate(data.length, (index) {
          final item = data[index];
          final color = _parseColor(item["color"]?.toString());
          final isSelected = selectTypeIndex == index;
          final name = item["name"]?.toString() ?? "";
          final colorLabel = _getColorLabel(item["color"]?.toString(), name);

          return GestureDetector(
            onTap: () {
              setState(() {
                selectTypeIndex = index;
                itemCount = 1;
              });
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 48.w,
                  height: 48.w,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color ?? AppConstant.greyColor,
                    border: Border.all(
                      color: isSelected
                          ? AppConstant.primaryColor
                          : Colors.grey.shade300,
                      width: isSelected ? 3.w : 1.5.w,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: (color ?? AppConstant.primaryColor)
                                  .withOpacity(0.4),
                              blurRadius: 8,
                              spreadRadius: 1,
                            )
                          ]
                        : [],
                  ),
                  child: isSelected
                      ? Center(
                          child: Icon(
                            Icons.check,
                            color: _isLightColor(color ?? Colors.white)
                                ? Colors.black87
                                : Colors.white,
                            size: 20.sp,
                          ),
                        )
                      : null,
                ),
                SizedBox(height: 4.h),
                SizedBox(
                  width: 60.w,
                  child: Text(
                    colorLabel,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isSelected
                          ? AppConstant.primaryColor
                          : context.tText,
                      fontSize: 11.sp,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      );
    }

    // Chip style for non-color variants (size, weight, etc.)
    return Wrap(
      spacing: 8.w,
      runSpacing: 8.h,
      children: List.generate(data.length, (index) {
        final item = data[index];
        final isSelected = selectTypeIndex == index;
        final name = item["name"]?.toString() ?? "";

        return GestureDetector(
          onTap: () {
            setState(() {
              selectTypeIndex = index;
              itemCount = 1;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppConstant.primaryColor.withOpacity(0.1)
                  : context.tCard,
              borderRadius: BorderRadius.circular(12.r),
              border: Border.all(
                color: isSelected
                    ? AppConstant.primaryColor
                    : context.tDivider,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Text(
              name,
              style: TextStyle(
                color: isSelected
                    ? AppConstant.primaryColor
                    : context.tText,
                fontSize: 14.sp,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
        );
      }),
    );
  }

  bool _isLightColor(Color color) {
    final luminance = (0.299 * color.red + 0.587 * color.green + 0.114 * color.blue) / 255;
    return luminance > 0.5;
  }

  ShopProductScreenBody<Widget>(data, tavsiyalar) {
    // Use variant image if available, fallback to product image.
    // Variants live in /static/product-items/, products in /static/products/.
    final dynamic variantImg = data[selectTypeIndex]["image"];
    final String mainImageUrl = variantImg != null
        ? Endpoints.img('product-items', variantImg)
        : (widget.image != null
            ? Endpoints.img('products', widget.image)
            : AppConstant.defaultImage);

    return ListView(
      shrinkWrap: true,
      scrollDirection: Axis.vertical,
      children: [
        SizedBox(
          height: 220.h,
          width: 1.sw,
          child: CachedNetworkImage(
            fit: BoxFit.cover,
            imageUrl: mainImageUrl,
            placeholder: (ctx, url) => Shimmer.fromColors(
              baseColor: ctx.tInput,
              highlightColor: ctx.tDivider,
              child: Container(color: ctx.tInput),
            ),
            errorWidget: (context, url, error) => const AppImagePlaceholder(),
          ),
        ),
        Padding(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () {},
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
              SizedBox(height: 16.h),
              Text(
                widget.desc ?? "",
                style: TextStyle(
                  color: context.tSub,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w300,
                ),
              ),
              SizedBox(height: 16.h),
              Text(
                'Turini tanlang',
                style: TextStyle(
                  color: context.tText,
                  fontSize: 15.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 8.h),
              // Marketplace-style variant selector with color circles
              _buildVariantSelector(data),
             SizedBox(height: 16.h),
                Text(
               data[selectTypeIndex]["count"] > 0 ?  'Bu turdagi mahsulot ${data[selectTypeIndex]["count"]} ta mavjud' : "Bu turdagi mahsulot tugagan",
                style: TextStyle(
                  color: data[selectTypeIndex]["count"] > 0 ?  AppConstant.primaryColor : Color.fromARGB(255, 253, 104, 104),
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
             
              SizedBox(height: 32.h),
              Row(
                children: [
                  customContainer(
                    25,
                    Image.asset(
                      'assets/icons/minus.png',
                      scale: 3.sp,
                    ),
                    () {
                      setState(() {
                        if (itemCount > 1) {
                          itemCount--;
                        }
                      });
                    },
                  ),
                  SizedBox(width: 5.w),
                  customContainer(
                    30,
                    Text(
                      itemCount.toString(),
                      style: TextStyle(
                        color: AppConstant.primaryColor,
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    () {},
                  ),
                  SizedBox(width: 5.w),
                  customContainer(
                    25,
                    Image.asset(
                      'assets/icons/plus.png',
                      scale: 3.sp,
                    ),
                    () {
                      setState(() {
                        itemCount++;
                      });
                    },
                  ),
                  Spacer(),
                  Text(
                    (itemCount * data[selectTypeIndex]["price"])
                            .toString()
                            .toMoney() +
                        " so'm",
                    style: TextStyle(
                      color: context.tText,
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              CustomButton(
                onPressed: () async {
                  if (data[selectTypeIndex]["count"] >= itemCount ) {
                    if (await addProductToSavatcha({
                    "id": data[selectTypeIndex]["id"],
                    "name": data[selectTypeIndex]["name"],
                    "product_name": widget.name ?? "",
                    "image": (widget.image ?? ""),
                    "price": data[selectTypeIndex]["price"],
                    "count": itemCount,
                    "shop_id": (widget.shop_id ?? ""),
                    "product_id" : (widget.product_id ?? ""),
                  }
                  )) {
                    itemCount= 1;

                    setState(() {});
                    // ShopProductManager.refresh(context,
                    //  productId: widget.product_id ?? " ", shopId: widget.shop_id ?? "");

                    Fluttertoast.showToast(
                      msg: "Mahsulot qo'shildi",
                      toastLength: Toast.LENGTH_SHORT,
                      gravity: ToastGravity.BOTTOM,
                      timeInSecForIosWeb: 1,
                      backgroundColor: AppConstant.darkColor.withOpacity(0.9),
                      textColor: Colors.white,
                      fontSize: 14.sp,
                    );

                  } else {
                    Fluttertoast.showToast(
                      msg: "Boshqa do'kondan mahsulot qo'shib bo'lmaydi",
                      toastLength: Toast.LENGTH_SHORT,
                      gravity: ToastGravity.BOTTOM,
                      timeInSecForIosWeb: 1,
                      backgroundColor: AppConstant.darkColor.withOpacity(0.9),
                      textColor: Colors.white,
                      fontSize: 14.sp,
                    );
                  }
                  } else {
                      Fluttertoast.showToast(
                      msg: "Mahsulot yetarli emas",
                      toastLength: Toast.LENGTH_SHORT,
                      gravity: ToastGravity.BOTTOM,
                      timeInSecForIosWeb: 1,
                      backgroundColor: AppConstant.darkColor.withOpacity(0.9),
                      textColor: Colors.white,
                      fontSize: 14.sp,
                    );
                  }

               
                },
                text: "Savatchaga qo'shish",
                width: 1.sw,
                color: data[selectTypeIndex]["count"] >= itemCount ?   AppConstant.primaryColor  : AppConstant.greyColor,
              ),
              SizedBox(height: 16.h),
            ],
          ),
        ),
        // MoreAndCheapSection(
        //   images: images,
        //   titles: titles,
        //   header: HeaderSections(
        //     title: "Siz uchun tavsiyalar",
        //     onTap: () {
        //       Navigator.of(context).pushNamed(
        //         '/productsScreen',
        //       );
        //     },
        //   ),
        // ),

        Column(
          children: [
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Row(
                children: [
                  Text(
                    "Siz uchun tavsiyalar",
                    style: TextStyle(
                      color: context.tText,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16.h),
            SizedBox(
              height: 200.h,
              child: ListView.builder(
                itemCount: tavsiyalar.length,
                scrollDirection: Axis.horizontal,
                shrinkWrap: true,
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () {
                      Navigator.of(context).pushReplacementNamed(
                          '/shopProductScreen',
                          arguments: {
                            "name": tavsiyalar[index]["name"],
                            "product_id": tavsiyalar[index]["id"],
                            "shop_id": widget.shop_id,
                            "image": widget.image,
                            "desc": widget.desc,
                          });
                    },
                    child: Container(
                      margin: EdgeInsets.only(left: 16.w),
                      width: 150.w,
                      decoration: BoxDecoration(
                        border: Border.all(color: context.tDivider),
                        color: context.tCard,
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      child: Column(
                        children: [
                          Expanded(
                            flex: 7,
                            child: SizedBox(
                              width: MediaQuery.of(context).size.width,
                              child: ClipRRect(
                                borderRadius: BorderRadius.only(
                                  topLeft: Radius.circular(8.r),
                                  topRight: Radius.circular(8.r),
                                ),
                                child: CachedNetworkImage(
                                  fit: BoxFit.fill,
                                  imageUrl: Endpoints.img(
                                      'products', tavsiyalar[index]["image"]),
                                  placeholder: (ctx, url) =>
                                      Shimmer.fromColors(
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
                                      tavsiyalar[index]["name"].toString(),
                                      style: TextStyle(
                                        color: context.tText,
                                        fontSize: 16.sp,
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                    SizedBox(height: 5.h),
                                    Text(
                                      "${tavsiyalar[index]["count"]}+ Sotilgan",
                                      style: TextStyle(
                                        color: context.tSub,
                                        fontSize: 12.sp,
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
            ),
          ],
        ),
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
}
