import { Map as MapIcon, Gamepad2, AlertCircle, User } from 'lucide-react';
import { cn } from '../lib/utils.js';

export default function BottomNav({ currentScreen, onScreenChange, user }) {
  const navItems = [
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'modes', label: 'Modes', icon: Gamepad2 },
    { id: 'report', label: 'Report', icon: AlertCircle },
    { id: 'profile', label: 'User', icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.splice(3, 0, { id: 'admin', label: 'Admin', icon: MapIcon });
  }

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 md:hidden bg-white shadow-[0px_-4px_16px_rgba(0,0,0,0.04)] border-t border-slate-100">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onScreenChange(item.id)}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl px-4 py-1 transition-all active:scale-95",
            currentScreen === item.id
              ? "bg-teal-50 text-teal-800"
              : "text-slate-500 hover:text-teal-600"
          )}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-[12px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
