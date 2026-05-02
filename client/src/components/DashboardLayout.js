import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';

const DashboardLayout = () => {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg)] relative">
      <Sidebar onOpenSearch={() => setCommandOpen(true)} />
      <main className="flex-1 h-full overflow-y-auto p-6 sm:p-10 relative">
        <Outlet />
      </main>
      
      {/* Global Search Palette */}
      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
    </div>
  );
};

export default DashboardLayout;
