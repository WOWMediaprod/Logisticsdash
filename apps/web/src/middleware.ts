import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add CSP headers specifically for Google Maps on tracking pages
  if (request.nextUrl.pathname.includes('/dashboard/tracking') ||
      request.nextUrl.pathname.includes('/track') ||
      request.nextUrl.pathname.includes('/mobile-tracker')) {

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://*.gstatic.com https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.gstatic.com https://*.gstatic.com",
      "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com ws://localhost:* wss://localhost:* http://localhost:* https://localhost:* ws://192.168.0.0:* ws://192.168.1.0:* ws://192.168.1.110:* wss://192.168.1.110:* http://192.168.1.110:* https://*.ngrok-free.app wss://*.ngrok-free.app",
      "worker-src 'self' blob: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
      "child-src 'self' blob: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/tracking/:path*',
    '/track/:path*',
    '/mobile-tracker/:path*'
  ]
}
