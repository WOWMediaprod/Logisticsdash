'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Truck, Shield, Loader2 } from 'lucide-react';

export default function DriverLoginPage() {
  const [driverIdOrPhone, setDriverIdOrPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverIdOrPhone || !pin) {
      toast({
        title: 'Error',
        description: 'Please enter your Driver ID/Phone and PIN',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/driver-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverIdOrPhone,
          pin,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and driver info
      localStorage.setItem('driverToken', data.accessToken);
      localStorage.setItem('driverId', data.driver.id);
      localStorage.setItem('driverName', data.driver.name);
      localStorage.setItem('driverPhone', data.driver.phone);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.driver.name}`,
      });

      router.push('/driver-v2/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only allow numbers
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Driver Portal</CardTitle>
          <CardDescription>
            Login with your Driver ID or Phone number and PIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverIdOrPhone">Driver ID or Phone Number</Label>
              <Input
                id="driverIdOrPhone"
                type="text"
                placeholder="Enter Driver ID or Phone"
                value={driverIdOrPhone}
                onChange={(e) => setDriverIdOrPhone(e.target.value)}
                disabled={isLoading}
                required
                className="text-base" // Prevent zoom on iOS
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 4-6 digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyPress={handlePinKeyPress}
                  maxLength={6}
                  disabled={isLoading}
                  required
                  className="pl-10 text-base" // Prevent zoom on iOS
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Forgot your PIN?</p>
            <p>Contact your administrator</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}