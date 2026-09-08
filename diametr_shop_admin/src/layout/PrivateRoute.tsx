import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';

interface PrivateRouteProps {
  children?: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/signin" replace />;
  return children ? <>{children}</> : <Outlet />;
};

