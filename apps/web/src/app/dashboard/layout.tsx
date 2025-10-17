'use client';

import { usePathname } from 'next/navigation';
import { SocketProvider } from '../../contexts/SocketContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Only wrap with SocketProvider on tracking page
  if (pathname?.includes('/tracking')) {
    return (
      <SocketProvider>
        {children}
      </SocketProvider>
    );
  }

  return <>{children}</>;
}