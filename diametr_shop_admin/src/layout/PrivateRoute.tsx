import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { clearSession, isTokenExpired } from '../service/session';

interface PrivateRouteProps {
  children?: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/signin" replace />;
  // An expired token would only make every request 401: go to sign-in at once.
  if (isTokenExpired(token)) {
    clearSession(true);
    return <Navigate to="/signin" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};

