import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  LayoutDashboard,
  ClipboardList,
  Heart,
  User,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/buddy', icon: MessageCircle, labelKey: 'buddy' as const },
  { path: '/cockpit', icon: LayoutDashboard, labelKey: 'cockpit' as const },
  { path: '/tracking', icon: ClipboardList, labelKey: 'tracking' as const },
  { path: '/medical', icon: Heart, labelKey: 'medical' as const },
  { path: '/profile', icon: User, labelKey: 'profile' as const },
];

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg" aria-label="Main navigation">
      <div className="grid grid-cols-5 items-center h-14 max-w-lg mx-auto" role="menubar">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
              aria-label={t.nav[labelKey]}
              className={cn(
                'flex flex-col items-center justify-center h-full py-1',
                'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  'h-5 w-5 mb-0.5',
                  isActive && 'stroke-[2.5px]'
                )}
              />
              <span className="text-[10px] font-medium leading-tight">
                {t.nav[labelKey]}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
