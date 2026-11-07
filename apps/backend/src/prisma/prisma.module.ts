import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule is marked @Global so that PrismaService can be injected
 * in any module without needing to import PrismaModule explicitly.
 * Simply import PrismaModule once in AppModule and you're done.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
