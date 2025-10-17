import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for this API route in development
if (process.env.NODE_ENV === 'development') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

export async function POST(request: NextRequest) {
  try {
    const locationData = await request.json();

    console.log('📍 Received location update via HTTP:', locationData);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL || 'http://localhost:3004';
    const targetUrl = `${backendUrl}/api/v1/tracking/live-location`;

    console.log('🔄 Forwarding location to API:', targetUrl);

    // Forward the location data to the API server
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });

    if (!response.ok) {
      throw new Error(`API server responded with status: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Location update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update location',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Location endpoint is working',
    endpoint: 'POST /api/location'
  });
}