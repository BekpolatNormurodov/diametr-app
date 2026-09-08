import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLoggerMiddleware } from './_middlewares/logger-handler';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClientModule } from './_prisma_client/prisma_client.module';
import { ConfigModule } from '@nestjs/config';
import { RegionModule } from './region/region.module';
import { ShopModule } from './shop/shop.module';
import { NewModule } from './new/new.module';
import { AdminModule } from './admin/admin.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ServiceModule } from './service/service.module';
import { WorkerModule } from './worker/worker.module';
import { PaymentModule } from './payment/payment.module';
import { SmsModule } from './sms/sms.module';
import { UserModule } from './user/user.module';
import { AdModule } from './ad/ad.module';
import { OrderModule } from './order/order.module';
import { ShopProductModule } from './shop-product/shop-product.module';
import { ProductItemModule } from './product-item/product-item.module';
import { AxiosClientModule } from './_axios_client/axios_client.module';
import { PromoCodeModule } from './promo-code/promo-code.module';
import { TelegramModule } from './telegram/telegram.module';
import { StoreTelegramModule } from './store-telegram/store-telegram.module';
import { UnitTypeModule } from './unit-type/unit-type.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'default_secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES ?? '30d' },
    }),

    AuthModule,
    PrismaClientModule,
    RegionModule,
    ShopModule,
    NewModule,
    AdminModule,
    CategoryModule,
    ProductModule,
    ServiceModule,
    WorkerModule,
    PaymentModule,
    SmsModule,
    UserModule,
    AdModule,
    OrderModule,
    ShopProductModule,
    ProductItemModule,
    AxiosClientModule,
    PromoCodeModule,
    TelegramModule,
    StoreTelegramModule,
    UnitTypeModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
