import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SidebarContext } from './sidebar-context';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <Sidebar />

        <main className="flex-1 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
