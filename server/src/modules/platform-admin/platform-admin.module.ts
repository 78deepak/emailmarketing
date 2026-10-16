import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService, PlatformAdminGuard],
  exports: [PlatformAdminService, PlatformAdminGuard],
})
export class PlatformAdminModule {}
