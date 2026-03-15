import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Heart,
  User,
  Users,
  CalendarHeart,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { cn } from '../../lib/utils';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  labelKey: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { path: '/cockpit', icon: LayoutDashboard, labelKey: 'cockpit' },
  { path: '/nutrition', icon: UtensilsCrossed, labelKey: 'nutrition' },
  { path: '/training', icon: Dumbbell, labelKey: 'training' },
  { path: '/medical', icon: Heart, labelKey: 'medical' },
  { path: '/social', icon: Users, labelKey: 'social' },
  { path: '/profile', icon: User, labelKey: 'profile' },
];

const CYCLE_NAV_ITEM: NavItem = {
  path: '/cycle',
  icon: CalendarHeart,
  labelKey: 'cycle',
};

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: profile } = useProfile();

  // Show cycle nav item for female/other users with cycle tracking enabled
  const showCycleNav = (profile?.gender === 'female' || profile?.gender === 'other')
    && profile?.cycle_tracking_enabled;

  const navItems = useMemo(() => {
    if (!showCycleNav) return BASE_NAV_ITEMS;
    // Insert cycle between Training and Medical
    return [
      BASE_NAV_ITEMS[0], // Cockpit
      BASE_NAV_ITEMS[1], // Ernährung
      BASE_NAV_ITEMS[2], // Training
      CYCLE_NAV_ITEM,     // Zyklus
      BASE_NAV_ITEMS[3], // Medizin
      BASE_NAV_ITEMS[4], // Social
      BASE_NAV_ITEMS[5], // Profil
    ];
  }, [showCycleNav]);

  const gridColsMap: Record<number, string> = { 5: 'grid-cols-5', 6: 'grid-cols-6', 7: 'grid-cols-7' };
  const gridCols = gridColsMap[navItems.length] ?? `grid-cols-${navItems.length}`;

  // Nav label lookup — handle both static t.nav keys and dynamic 'cycle'
  const getLabel = (key: string): string => {
    const navLabels = t.nav as Record<string, string>;
    return navLabels[key] ?? key;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg" aria-label="Main navigation">
      <div className={`grid ${gridCols} items-center h-14 max-w-lg mx-auto`} role="menubar">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              role="menuitem"
              data-tour-nav={labelKey}
              aria-current={isActive ? 'page' : undefined}
              aria-label={getLabel(labelKey)}
              className={cn(
                'flex flex-col items-center justify-center h-full py-1',
                'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon
                aria-hidden={true}
                className={cn(
                  'h-5 w-5 mb-0.5',
                  isActive && 'stroke-[2.5px]'
                )}
              />
              <span className="text-[10px] font-medium leading-tight">
                {getLabel(labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
