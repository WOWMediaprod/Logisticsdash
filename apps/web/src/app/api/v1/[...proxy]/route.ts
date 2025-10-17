import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for this API route in development
if (process.env.NODE_ENV === 'development') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

async function proxyRequest(request: NextRequest, params: Promise<{ proxy: string[] }>) {
  try {
    const { proxy } = await params;
    const path = proxy.join('/');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL || 'http://localhost:3004';

    // Include query parameters in the proxied URL
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${backendUrl}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;

    console.log('🔄 Proxying request:', targetUrl);
    console.log('🔍 Query params:', searchParams);

    const headers: Record<string, string> = {};

    // Copy relevant headers
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    const body = request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error during proxy request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, context.params);
}