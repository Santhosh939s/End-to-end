import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, UserPlus, UserCircle, Settings, LogOut, Shield, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

const navItems = [
  { icon: MessageSquare, label: 'Chats', path: '/dashboard/chats' },
  { icon: Users, label: 'All Users', path: '/dashboard/users' },
  { icon: UserPlus, label: 'Requests', path: '/dashboard/requests' },
  { icon: UserCircle, label: 'Profile', path: '/dashboard/profile' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

const DashboardLayout = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dynamicNavItems = [...navItems];
  if (user?.isAdmin) {
    dynamicNavItems.push({ icon: ShieldAlert, label: 'Admin', path: '/dashboard/admin' });
  }

  const NavContent = () => (
    <>
      <div className="flex-1 space-y-2 py-4 px-3 flex md:flex-col justify-around md:justify-start">
        {dynamicNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:py-3 rounded-lg transition-colors group relative",
              isActive 
                ? "text-brand-primary bg-brand-primary/10" 
                : "text-text-secondary hover:bg-bg-panel-hover hover:text-text-primary"
            )}
          >
            <item.icon className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
      
      {/* Desktop logout button */}
      <div className="hidden md:block p-4 border-t border-border-subtle">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-bg-app flex flex-col md:flex-row text-text-primary">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-bg-panel h-screen sticky top-0">
        <div className="p-6 border-b border-border-subtle flex items-center gap-3">
          <Shield className="w-8 h-8 text-brand-primary" />
          <h1 className="text-xl font-bold tracking-tight">CipherLink</h1>
        </div>
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-70px)] md:min-h-screen pb-[70px] md:pb-0 relative">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-bg-panel border-t border-border-subtle z-50 px-2 pb-safe">
        <NavContent />
      </nav>
    </div>
  );
};

export default DashboardLayout;
