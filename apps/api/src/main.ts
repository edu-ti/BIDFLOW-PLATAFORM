import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConsumerDeserializer, IncomingEvent } from '@nestjs/microservices';

// 1. Desserializador corrigido para extrair o JSON de dentro do Buffer do RabbitMQ
export class RawJsonDeserializer implements ConsumerDeserializer {
  deserialize(value: any): IncomingEvent {
    try {
      // O conteúdo real enviado pelo painel do RabbitMQ fica em value.content (Buffer)
      const rawContent = value.content.toString();
      const parsedData = JSON.parse(rawContent);
      
      return {
        pattern: 'bidflow.tender.v1.result_processed', 
        data: parsedData, // 👈 Agora o data será o seu JSON puro com o tenantId!
      };
    } catch (error) {
      // Previne quebra do microsserviço caso chegue um texto mal formatado
      return {
        pattern: 'bidflow.tender.v1.result_processed',
        data: value,
      };
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('BidFlow API V2')
    .setDescription('BidFlow Core Platform API with Multi-Tenant Support')
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 🛠️ CONFIGURAÇÃO CORRIGIDA: Serve o Swagger DENTRO do prefixo api/v1 e busca arquivos estáticos do CDN (Contorna bug do Webpack no NestJS)
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  });

  // 2. CONECTA O MOTOR DO RABBITMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],
      queue: 'notification_queue',
      deserializer: new RawJsonDeserializer(),
      noAck: false, // 👈 CRÍTICO: Avisa ao NestJS para gerenciar o basic.ack com segurança, matando o erro 406
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.startAllMicroservices();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 BidFlow API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
}

bootstrap();