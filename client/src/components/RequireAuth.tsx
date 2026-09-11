import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '@client/src/api';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
