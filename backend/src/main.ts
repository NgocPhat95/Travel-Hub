import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Kích hoạt CORS để cho phép Angular (cổng 4200) gọi API
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  // 2. Kích hoạt Validation tự động toàn cục (dùng cho class-validator ở các bước sau)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3000);
  console.log(`Backend is running on: http://localhost:3000`);
}
bootstrap();
