import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  BadRequestException,
  ConsoleLogger,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './_middlewares/error-handler';
import { join } from 'path';
import { ResponseLoggingInterceptor } from './_middlewares/reponse-logging-handler';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger(),
    rawBody: true,
    bodyParser: true,
  });

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Authorization,Content-Type,Accept,Origin,X-Requested-With',
  });

  // ⚠️ MUHIM: useStaticAssets() setGlobalPrefix() dan OLDIN chaqirilishi kerak,
  // aks holda /static/* yo'li ham /api/v1 prefiksi bilan kuting deb qoladi.
  // process.cwd() ishlatamiz, chunki upload'lar ham shu yerga yoziladi
  // (shop.controller.ts: join(process.cwd(), 'public', 'shops')).
  // Upload nomlari unique (Date.now()-random.ext) — fayl hech qachon
  // qayta yozilmaydi, shuning uchun uzoq muddatli immutable cache xavfsiz.
  // maxAge'siz Express "Cache-Control: public, max-age=0" yuboradi va
  // nginx proxy_cache rasmlarni saqlamaydi.
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/static/',
    maxAge: '365d',
    immutable: true,
  });

  app.setGlobalPrefix('/api/v1');

  app.useBodyParser('json', { limit: '20mb' });
  app.useBodyParser('urlencoded', { limit: '20mb', extended: true });
  app.useBodyParser('text', { limit: '20mb', extended: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Turn class-validator failures into a structured payload the exception
      // filter can localize. We keep the field, the failed constraint (e.g.
      // "min"), and any numeric args parsed from the raw English message.
      exceptionFactory: (errors) => {
        const validation = errors.map((e) => {
          const constraint = Object.keys(e.constraints ?? {})[0] ?? 'invalid';
          const raw = e.constraints?.[constraint] ?? '';
          const args = raw.match(/-?\d+/g) ?? [];
          return { field: e.property, constraint, args };
        });
        return new BadRequestException({ validation });
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseLoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ─── Swagger ─────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Diametr API')
    .setDescription(
      `## Diametr backend REST API\n\n` +
        `**Base URL:** \`/api/v1\`\n\n` +
        `Barcha himoyalangan endpointlar uchun **Authorize** tugmasini bosing va ` +
        `\`Bearer <token>\` formatida JWT tokeningizni kiriting.`,
    )
    .setVersion('1.0.0')
    .setContact('Diametr', 'https://diametr.uz', 'admin@diametr.uz')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: "JWT tokenni kiriting (Bearer so'zsiz)",
        in: 'header',
      },
      'JWT',
    )
    .addTag('Auth', 'Kirish / chiqish')
    .addTag('User', 'Foydalanuvchilar')
    .addTag('Admin', 'Admin paneli')
    .addTag('Shop', "Do'konlar")
    .addTag('Product', 'Mahsulotlar')
    .addTag('Product-Item', 'Mahsulot variantlari')
    .addTag('Category', 'Kategoriyalar')
    .addTag('Order', 'Buyurtmalar')
    .addTag('Service', 'Xizmatlar')
    .addTag('Worker', 'Ustalar / ishchilar')
    .addTag('Ad', 'Reklamalar')
    .addTag('New', 'Yangiliklar')
    .addTag('Region', 'Hududlar')
    .addTag('Payment', "To'lovlar")
    .addTag('Promo-Code', 'Promo kodlar')
    .addTag('Shop-Product', "Do'kon mahsulotlari")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // sahifa yangilananda token saqlansin
      filter: true, // endpointlarni qidiruv
      displayRequestDuration: true, // so'rov vaqti ko'rinsin
      docExpansion: 'none', // default yopiq (chiroyliroq)
      defaultModelsExpandDepth: 2,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Diametr API Docs',
    customfavIcon: '/static/favicon.ico',
    customCss: `
      .swagger-ui .topbar { background: #1e293b; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #1e293b; font-size: 2rem; }
      .swagger-ui .btn.authorize { background: #2563eb; border-color: #2563eb; color: #fff; }
      .swagger-ui .btn.authorize:hover { background: #1d4ed8; }
    `,
  });
  // ─────────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 8888;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`🚀  Server started on   http://localhost:${port}/api/v1`);
  logger.log(`📖  Swagger docs at     http://localhost:${port}/docs`);
}
main();
