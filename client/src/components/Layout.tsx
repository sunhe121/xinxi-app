import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { cn } from '@/utils/cn';
import { registerServiceWorker } from '@/utils/register-sw';

const Layout = () => {
  const location = useLocation();
  const showNav = !location.pathname.startsWith('/chat') &&
    !['/onboarding', '/privacy', '/profile-edit', '/share'].includes(location.pathname);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div
        className={cn(
          'w-full max-w-[480px] min-h-screen bg-background relative',
          showNav ? 'pb-[72px]' : ''
        )}
      >
        <Outlet />
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export default Layout;
