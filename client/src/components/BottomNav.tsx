import { NavLink } from 'react-router-dom';
import { Home, Users, HeartHandshake, User } from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/family', icon: Users, label: '家人' },
  { path: '/voice', icon: HeartHandshake, label: '我的关心话' },
  { path: '/profile', icon: User, label: '我的' },
];

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-border z-50 px-2">
      <div className="flex items-center justify-around h-[64px]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon size={22} strokeWidth={2} />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
