import { create } from 'zustand'

const createNotification = (notification, createdAt = new Date().toISOString(), read = false) => ({
  id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  createdAt,
  read,
  ...notification,
})

const now = new Date()
const yesterday = new Date(now)
yesterday.setDate(now.getDate() - 1)
const earlier = new Date(now)
earlier.setDate(now.getDate() - 4)

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  searchOpen: false,
  notificationsOpen: false,
  activePage: 'dashboard',
  notifications: [
    createNotification({ type: 'new-job', title: '12 new matches', message: 'Fresh React and Python roles landed across LinkedIn and Indeed.' }, now.toISOString(), false),
    createNotification({ type: 'system', title: 'Scraper connected', message: 'LinkedIn and Naukri sources are online.' }, yesterday.toISOString(), true),
    createNotification({ type: 'error', title: 'Proxy pool warning', message: 'One proxy endpoint returned a rate-limit response.' }, earlier.toISOString(), false),
    createNotification({ type: 'new-job', title: 'Saved search matched', message: 'Remote frontend roles now match your saved filters.' }, earlier.toISOString(), true),
  ],
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  setActivePage: (activePage) =>
    set({
      activePage,
      mobileSidebarOpen: false,
      searchOpen: false,
      notificationsOpen: false,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [createNotification(notification), ...state.notifications].slice(0, 5),
    })),
  markNotificationRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    })),
  dismissNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== notificationId),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
