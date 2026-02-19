import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Heart,
  Scale,
  BarChart3,
  User,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/buddy', icon: MessageCircle, labelKey: 'buddy' as const },
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { path: '/meals', icon: UtensilsCrossed, labelKey: 'meals' as const },
  { path: '/workouts', icon: Dumbbell, labelKey: 'workouts' as const },
  { path: '/medical', icon: Heart, labelKey: 'medical' as const },
  { path: '/body', icon: Scale, labelKey: 'body' as const },
  { path: '/reports', icon: BarChart3, labelKey: 'reports' as const },
  { path: '/profile', icon: User, labelKey: 'profile' as const },
];

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="grid grid-cols-8 items-center h-14 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center h-full py-1',
                'transition-colors duration-200',
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 mb-0.5',
                  isActive && 'stroke-[2.5px]'
                )}
              />
              <span className="text-[9px] font-medium leading-tight">
                {t.nav[labelKey]}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
