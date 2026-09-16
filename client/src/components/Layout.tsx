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
    <div className="min-h-screen w-full flex justify-center">
      <div
        className={cn(
          'w-full max-w-[480px] mx-auto min-h-screen bg-transparent relative',
          showNav ? 'pb-[80px]' : ''
        )}
      >
        <Outlet />
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export default Layout;
