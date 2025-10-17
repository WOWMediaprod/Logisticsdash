import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // For now, return a demo user ID
    // In real implementation, this would extract from JWT token
    return request.user?.id || 'demo-user-id';
  },
);