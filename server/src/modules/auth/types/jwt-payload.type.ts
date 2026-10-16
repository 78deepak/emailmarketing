export interface JwtPayload {
  sub: string; // user id or admin id
  tenantId?: string;
  email: string;
  isPlatformAdmin?: boolean;
}
