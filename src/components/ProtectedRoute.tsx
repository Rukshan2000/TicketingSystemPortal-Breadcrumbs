'use client';

import { ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'moderator' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // If role is required and user doesn't have it, redirect to dashboard
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/dashboard');
      return;
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  // If role is required and user doesn't have it, show nothing
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has required role
  return <>{children}</>;
}
