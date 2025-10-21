'use client';

import { useEffect, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import RealTimeTrackingMap from '@/components/tracking/RealTimeTrackingMap';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const libraries: ('places' | 'drawing' | 'geometry')[] = ['places'];

export default function TrackingDashboardPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    // Get company ID from user context or localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCompanyId(user.companyId || user.company?.id);
    }
  }, []);

  if (loadError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading Google Maps. Please check your API key configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Company information not found. Please ensure you are logged in.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Real-Time Driver Tracking
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor all active drivers and their current locations in real-time
        </p>
      </div>

      {/* Tracking Map Component */}
      <RealTimeTrackingMap companyId={companyId} />
    </div>
  );
}