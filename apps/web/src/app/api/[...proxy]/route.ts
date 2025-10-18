import { NextRequest, NextResponse } from 'next/server';

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, '');

const API_BASE_URL = (() => {
  const envInternal = trimTrailingSlash(process.env.API_INTERNAL_URL);
  const envHttps = trimTrailingSlash(process.env.API_URL_HTTPS || process.env.NEXT_PUBLIC_API_URL_HTTPS);
  const envDefault = trimTrailingSlash(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);

  return envInternal || envHttps || envDefault || 'http://localhost:3004';
})();

export async function GET(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params.proxy, 'GET');
}

export async function POST(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params.proxy, 'POST');
}

export async function PUT(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params.proxy, 'PUT');
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params.proxy, 'PATCH');
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const params = await context.params;
  return handleRequest(request, params.proxy, 'DELETE');
}

async function handleRequest(request: NextRequest, pathSegments: string[], method: string) {
  try {
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const url = `${API_BASE_URL}/api/v1/${path}${queryString ? `?${queryString}` : ''}`;

    const headers = new Headers();

    // Copy relevant headers from the original request
    const relevantHeaders = ['content-type', 'authorization', 'accept', 'user-agent'];
    relevantHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await request.text();
      if (body) {
        requestOptions.body = body;
      }
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      console.error('Proxy request failed', { url, status: response.status, statusText: response.statusText });
    }

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization',
      },
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { success: false, error: 'API proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
    },
  });
}

