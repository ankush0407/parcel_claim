import { Bell, Search, Plus, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from './sidebar-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { toggle } = useSidebar();

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-maersk-navy truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Search — tablet+ */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search claims, tracking numbers..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-64 xl:w-72 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* New Claim */}
        <button
          onClick={() => navigate('/claims/new')}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-maersk-blue text-white text-sm font-medium rounded-lg hover:bg-maersk-navy transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Claim</span>
        </button>
      </div>
    </header>
  );
}
