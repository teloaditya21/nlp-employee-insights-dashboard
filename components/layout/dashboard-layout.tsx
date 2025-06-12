'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import ProtectedRoute from '@/components/auth/protected-route';
import ErrorBoundary from '@/components/ErrorBoundary';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/' || pathname === '/login';

  if (isLoginPage) {
    return (
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col relative h-screen overflow-y-auto">
            {children}
          </div>
        </div>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
