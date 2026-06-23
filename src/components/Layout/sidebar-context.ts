import { createContext, useContext } from 'react';

interface SidebarCtx {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export const SidebarContext = createContext<SidebarCtx>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}
