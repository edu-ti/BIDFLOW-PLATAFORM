import { Module } from '@nestjs/common';
import { SupplierController } from './api/controllers/supplier.controller';
import { PrismaSupplierRepository } from './infrastructure/persistence/prisma/prisma-supplier.repository';
import { RegisterSupplierHandler } from './application/commands/register-supplier/register-supplier.handler';
import { UpdateSupplierComplianceHandler } from './application/commands/update-compliance/update-compliance.handler';
import { SupplierRepository } from '../../../../packages/domain/src/repositories/supplier.repository';

import { RabbitMqTenderEventPublisher } from '../tenders/infrastructure/event-publishers/rabbitmq-publisher'; // Assuming reused or shared
import { PrismaModule } from '../prisma/prisma.module'; // Assuming PrismaModule exists

@Module({
  imports: [PrismaModule],
  controllers: [SupplierController],
  providers: [
    {
      provide: 'SupplierRepository', // Use a string token or class depending on your setup. Usually abstract class is better but interface is used in domain.
      useClass: PrismaSupplierRepository,
    },
    {
      provide: 'EVENT_PUBLISHER',
      useClass: RabbitMqTenderEventPublisher, // Reusing the same publisher infrastructure
    },
    {
      provide: RegisterSupplierHandler,
      useFactory: (repo: SupplierRepository, publisher: any) => {
        return new RegisterSupplierHandler(repo, publisher);
      },
      inject: ['SupplierRepository', 'EVENT_PUBLISHER'],
    },
    {
      provide: UpdateSupplierComplianceHandler,
      useFactory: (repo: SupplierRepository, publisher: any) => {
        return new UpdateSupplierComplianceHandler(repo, publisher);
      },
      inject: ['SupplierRepository', 'EVENT_PUBLISHER'],
    },
  ],
})
export class SuppliersModule {}
