import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // For now, return a demo company ID
    // In real implementation, this would extract from JWT token or subdomain
    return request.company?.id || 'cmfmbojit0000vj0ch078cnbu';
  },
);