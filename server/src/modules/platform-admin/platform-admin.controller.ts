import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import {
  AdminLoginDto,
  ListTenantsQueryDto,
  UpdatePlatformSettingsDto,
  UpdateTenantPlanDto,
  UpdateTenantStatusDto,
} from './dto/platform-admin.dto';

@Controller('admin')
export class PlatformAdminController {
  constructor(private readonly adminService: PlatformAdminService) {}

  // Public admin login
  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  // Current logged in admin profile
  @UseGuards(PlatformAdminGuard)
  @Get('auth/me')
  getMe(@CurrentUser('id') adminId: string) {
    return this.adminService.getMe(adminId);
  }

  // System overview KPIs
  @UseGuards(PlatformAdminGuard)
  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  // Tenant / Customer management
  @UseGuards(PlatformAdminGuard)
  @Get('tenants')
  listTenants(@Query() q: ListTenantsQueryDto) {
    return this.adminService.listTenants(q);
  }

  @UseGuards(PlatformAdminGuard)
  @Get('tenants/:id')
  getTenantDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getTenantDetail(id);
  }

  @UseGuards(PlatformAdminGuard)
  @Patch('tenants/:id/status')
  updateTenantStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.adminService.updateTenantStatus(id, dto.status);
  }

  @UseGuards(PlatformAdminGuard)
  @Patch('tenants/:id/plan')
  updateTenantPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantPlanDto,
  ) {
    return this.adminService.updateTenantPlan(id, dto.planId);
  }

  // Platform settings
  @UseGuards(PlatformAdminGuard)
  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @UseGuards(PlatformAdminGuard)
  @Patch('settings')
  updateSetting(@Body() dto: UpdatePlatformSettingsDto) {
    return this.adminService.updateSetting(dto);
  }
}
