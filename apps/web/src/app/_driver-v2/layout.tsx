import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Driver Portal - Logistics Platform',
  description: 'Mobile-friendly driver portal for job tracking and earnings',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}