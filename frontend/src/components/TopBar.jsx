import { Menu } from 'lucide-react';

export default function TopBar({ onMenuToggle, onSOS }) {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="text-teal-800 hover:opacity-80 transition-transform active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-teal-900 tracking-tighter">NavAbility</h1>
      </div>
      <button
        onClick={onSOS}
        className="bg-error px-6 py-2 rounded-full text-on-error font-bold tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-lg"
      >
        SOS
      </button>
    </header>
  );
}
