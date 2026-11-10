import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.setGlobalPrefix('api/v1');

  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       
      forbidNonWhitelisted: true,
      transform: true,       
    }),
  );

 
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

 
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CloudOps Manager API')
    .setDescription(
      'REST API for managing cloud infrastructure, servers, applications, alerts and metrics.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Auth', 'Login, register, JWT refresh, logout')
    .addTag('Users', 'CRUD utilisateurs et gestion des rôles')
    .addTag('Servers', 'Enregistrement et gestion des serveurs cloud')
    .addTag('Applications', 'Déploiement et suivi des applications')
    .addTag('Metrics', 'Historique des métriques et disponibilité')
    .addTag('Alerts', "Règles d'alerte et gestion des incidents")
    .addTag('Dashboard', 'Vue globale et résumé de la plateforme')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, 
    },
  });

  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀  Server running at http://localhost:${port}/api/v1`);
  console.log(`📖  Swagger docs at  http://localhost:${port}/api/docs`);
}

bootstrap();
