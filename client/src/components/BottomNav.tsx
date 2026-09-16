import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, HeartHandshake, User } from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/family', icon: Users, label: '家人' },
  { path: '/voice', icon: HeartHandshake, label: '关心话' },
  { path: '/profile', icon: User, label: '我的' },
];

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 -webkit-translate-x-1/2 w-full max-w-[480px] z-50"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 -4px 20px rgba(255, 107, 107, 0.08)',
      }}
    >
      <div className="flex items-center justify-around h-[68px] px-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = isActive(item.path, item.path === '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
               className={cn(
                 'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-300 ease-out active:scale-98',
                 active ? 'scale-105' : 'text-muted-foreground'
               )}
               style={{
                 WebkitTransform: active ? 'scale(1.05)' : 'scale(1)',
                 color: active ? '#FF8C69' : undefined,
               }}
             >
               <item.icon size={22} strokeWidth={2} />
               <span className="text-[11px] font-medium">{item.label}</span>
               {active && (
                 <div
                   className="rounded-full mt-0.5"
                   style={{
                     width: '6px',
                     height: '6px',
                     background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                   }}
                 />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
