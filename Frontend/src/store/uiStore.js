import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  searchOpen: false,
  activePage: 'dashboard',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setActivePage: (activePage) =>
    set({
      activePage,
      mobileSidebarOpen: false,
      searchOpen: false,
    }),
}))
