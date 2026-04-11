import { Compass, Accessibility, AlertTriangle, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils.js';

export default function Sidebar({ currentScreen, onScreenChange, isOpen, user }) {
  const navItems = [
    { id: 'map', label: 'Navigation', icon: Compass },
    { id: 'modes', label: 'Control Modes', icon: Accessibility },
    { id: 'report', label: 'Report Issues', icon: AlertTriangle },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  if (user?.role === 'admin') {
    navItems.splice(3, 0, { id: 'admin', label: 'Admin Dashboard', icon: Accessibility });
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col p-6 bg-slate-50 w-80 rounded-r-3xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="mb-10 flex items-center gap-4 mt-20 md:mt-0">
        <img
          alt="User profile"
          className="w-12 h-12 rounded-full border-2 border-primary-fixed object-cover"
          src="https://picsum.photos/seed/user123/200/200"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col">
          <span className="font-headline font-black text-teal-900 text-lg">{user?.name || 'NavAbility User'}</span>
          <span className="text-slate-500 text-sm">{user?.role || 'Smart Wheelchair Active'}</span>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl font-bold transition-all duration-200 text-left",
              (currentScreen === item.id || (item.id === 'map' && currentScreen === 'live'))
                ? "bg-teal-100 text-teal-900"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
