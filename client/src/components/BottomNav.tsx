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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card/95 backdrop-blur-md border-t border-border z-50 px-4">
      <div className="flex items-center justify-around h-[68px]">
        {navItems.map((item) => {
          const active = isActive(item.path, item.path === '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200',
                active ? 'text-primary scale-105' : 'text-muted-foreground'
              )}
            >
              <item.icon size={22} strokeWidth={2} />
              <span className="text-[11px] font-medium">{item.label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
