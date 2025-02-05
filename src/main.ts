import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import * as express from 'express';
import { resolve } from 'path';

async function init() {
  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server));

  // CORS engedélyezése
  app.enableCors({
    origin: ['http://localhost:5173','http://localhost:5174'], // Csak erről a domainről érkező kéréseket engedélyezzük
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Engedélyezett HTTP metódusok
    allowedHeaders: 'Content-Type, Authorization', // Engedélyezett fejléc típusok
  });

  // Globális ValidationPipe hozzáadása
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Törli az ismeretlen mezőket
      forbidNonWhitelisted: true, // Hibát dob, ha ismeretlen mezőt talál
      transform: true, // DTO-kba alakítja az adatokat
      exceptionFactory: (validationErrors) => {
        const formattedErrors = validationErrors.reduce((acc, error) => {
          console.log(error)
          const { property, constraints } = error;
          if(constraints){
            acc[property] = Object.values(constraints);
            return {message: {errors: acc}};
          }
          return null;
        }, {});
        throw new BadRequestException(formattedErrors);
      },
    }),
  );

  app.useStaticAssets(resolve('./public'));
  app.setBaseViewsDir(resolve('./views'));
  app.setViewEngine('ejs');

  await app.listen(process.env.PORT ?? 3000);
  console.log('Server is running on http://localhost:3000');
}

init();