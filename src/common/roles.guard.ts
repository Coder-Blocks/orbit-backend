import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

// Reads roles straight from the JWT payload (set by AuthService.issueTokens
// and read back by JwtStrategy.validate) - keep the two in sync if you ever
// change what a token carries.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const request = context.switchToHttp().getRequest();
    const userRoles: string[] = request.user?.roles || [];
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
