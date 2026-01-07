'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Menu,
  X,
  Printer,
  GitBranch,
  ClipboardCheck,
  TrendingUp,
  Plus,
  MessageCircle,
  Star,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/features/authSlice';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import LogoLg from '@/assets/logo_2.png';
import LogoSm from '@/assets/logo_1.png';
import { hasPermission } from '@/lib/permissions';


export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  // Define menu items with manual permission checks
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      title: 'Messages',
      icon: MessageCircle,
      href: '/dashboard/chat',
    },
    ...(hasPermission('create ticket') ? [{
      title: 'Create Ticket',
      icon: Plus,
      href: '/dashboard/create-ticket',
    }] : []),
    {
      title: 'Tickets',
      icon: FileText,
      href: '/dashboard/tickets',
    },
    {
      title: 'Reviews',
      icon: Star,
      href: '/dashboard/reviews',
    },
    {
      title: 'Reports',
      icon: BarChart3,
      href: '/dashboard/reports',
    },
    {
      title: 'Workflows',
      icon: GitBranch,
      href: '/dashboard/workflows',
    },
    {
      title: 'Approval Progress',
      icon: TrendingUp,
      href: '/dashboard/approval-progress',
    },
    {
      title: 'User Management',
      icon: Users,
      href: '/dashboard/users',
    },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        ) : (
          <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {/* Mobile Overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={cn(
          'bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 relative',
          // Desktop styles
          'hidden md:flex',
          isCollapsed ? 'md:w-20' : 'md:w-64',
          // Mobile styles - always render but translate off-screen when closed
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:flex max-md:w-64',
          isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
        )}
      >
      {/* Collapse Toggle Button - Hidden on mobile */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-20 z-10 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      <div
        className={cn(
          'border-b border-slate-200 dark:border-slate-700 transition-all duration-300 flex items-center justify-center',
          isCollapsed && !isMobileOpen ? 'p-4' : 'p-6'
        )}
      >
        {isCollapsed && !isMobileOpen ? (
          <Image
            src={LogoSm}
            alt="Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
        ) : (
          <Image
            src={LogoLg}
            alt="Logo"
            width={200}
            height={80}
            className="w-auto h-auto max-w-full"
            priority
          />
        )}
      </div>

      <nav className={cn('flex-1 space-y-2', isCollapsed && !isMobileOpen ? 'p-2' : 'p-4')}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed && !isMobileOpen ? item.title : undefined}
              className={cn(
                'flex items-center rounded-lg transition-colors',
                isCollapsed && !isMobileOpen ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && (
                <span className="font-medium">{item.title}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          'border-t border-slate-200 dark:border-slate-700',
          isCollapsed && !isMobileOpen ? 'p-2' : 'p-4'
        )}
      >
        <Button
          variant="ghost"
          title={isCollapsed ? 'Logout' : undefined}
          className={cn(
            'w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950',
            isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-start'
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn('w-5 h-5', (!isCollapsed || isMobileOpen) && 'mr-3')} />
          {(!isCollapsed || isMobileOpen) && 'Logout'}
        </Button>
      </div>
    </aside>
    </>
  );
}
