import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyPassword } from '../../common/utils/password.util';
import { paginated } from '../../common/dto/pagination.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  AdminLoginDto,
  ListTenantsQueryDto,
  UpdatePlatformSettingsDto,
} from './dto/platform-admin.dto';

@Injectable()
export class PlatformAdminService {
  private readonly logger = new Logger(PlatformAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------------- AUTH ----------------

  async login(dto: AdminLoginDto) {
    const email = dto.email.toLowerCase();

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const valid = await verifyPassword(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (admin.status !== 'active') {
      throw new UnauthorizedException('Admin account is suspended');
    }

    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      isPlatformAdmin: true,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>(
        'jwt.accessExpires',
      ) as SignOptions['expiresIn'],
    });

    // Dedicated admin refresh token
    const refreshToken = await this.jwt.signAsync(
      { sub: admin.id, isPlatformAdmin: true, type: 'refresh' },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: '7d',
      },
    );

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        isSuper: admin.isSuper,
      },
      accessToken,
      refreshToken,
    };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuper: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!admin) throw new NotFoundException('Platform admin not found');
    return admin;
  }

  // ---------------- OVERVIEW & METRICS ----------------

  async getOverview() {
    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      totalContacts,
      totalCampaigns,
      activeSubscriptions,
      usageStats,
      recentTenants,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'active' } }),
      this.prisma.tenant.count({ where: { status: { not: 'active' } } }),
      this.prisma.user.count(),
      this.prisma.contact.count(),
      this.prisma.campaign.count(),
      this.prisma.subscription.findMany({
        where: { status: { in: ['active', 'trialing'] } },
        include: { plan: { select: { priceCents: true } } },
      }),
      this.prisma.usageRecord.aggregate({
        where: { metric: 'emails_month' },
        _sum: { quantity: true },
      }),
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          plan: { select: { name: true, code: true, priceCents: true } },
          _count: {
            select: { users: true, contacts: true, campaigns: true },
          },
        },
      }),
    ]);

    // Calculate MRR from active paid subscriptions (exclude free trial)
    const mrrCents = activeSubscriptions.reduce((acc, sub) => {
      if (sub.status === 'active' && sub.plan?.priceCents) {
        return acc + sub.plan.priceCents;
      }
      return acc;
    }, 0);

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      totalContacts,
      totalCampaigns,
      totalEmailsSent: usageStats._sum.quantity || 0,
      activeSubscriptionsCount: activeSubscriptions.length,
      estimatedMrrCents: mrrCents,
      recentTenants,
    };
  }

  // ---------------- TENANTS MANAGEMENT ----------------

  async listTenants(q: ListTenantsQueryDto) {
    const page = Math.max(1, q.page || 1);
    const limit = Math.min(100, Math.max(1, q.limit || 20));

    const where: any = {};
    if (q.status) {
      where.status = q.status;
    }
    if (q.search?.trim()) {
      const term = q.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          bounceRate: true,
          createdAt: true,
          plan: {
            select: { id: true, name: true, code: true, priceCents: true },
          },
          subscriptions: {
            orderBy: { subscribedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
          _count: {
            select: {
              users: true,
              contacts: true,
              campaigns: true,
              lists: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  async getTenantDetail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: { include: { planLimit: true } },
        subscriptions: {
          orderBy: { subscribedAt: 'desc' },
          include: { plan: true },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            userRoles: { select: { role: { select: { name: true } } } },
          },
        },
        _count: {
          select: {
            contacts: true,
            campaigns: true,
            lists: true,
            segments: true,
            forms: true,
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenantStatus(id: string, status: 'active' | 'suspended') {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, slug: true, status: true },
    });

    this.logger.log(`Tenant ${id} status updated to ${status}`);
    return updated;
  }

  async updateTenantPlan(id: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { planId },
      select: {
        id: true,
        name: true,
        plan: { select: { id: true, name: true, code: true } },
      },
    });

    return updated;
  }

  // ---------------- PLATFORM SETTINGS ----------------

  async getSettings() {
    const rows = await this.prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return rows;
  }

  async updateSetting(dto: UpdatePlatformSettingsDto) {
    const setting = await this.prisma.platformSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: dto.value,
      },
      update: {
        value: dto.value,
      },
    });
    return setting;
  }
}
