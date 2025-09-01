import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<(number | string)[]>(
      'roles',
      [context.getClass(), context.getHandler()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // console.log('JWT payload in RolesGuard:', user); // log full JWT payload
    // console.log('Roles required for route:', roles); // log roles decorator
    // console.log('User role id being checked:', user?.role?.id); // current check

    if (!roles?.length) return true;

    return roles.map(String).includes(String(user?.role?.id));
  }
}

