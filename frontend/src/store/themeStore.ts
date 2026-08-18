import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface InterfaceState {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileNavigationOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileNavigation: () => void;
  closeMobileNavigation: () => void;
}

export const useThemeStore = create<InterfaceState>()(
  persist(
    (set) => ({
      theme: "dark",
      sidebarCollapsed: false,
      mobileNavigationOpen: false,

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      toggleMobileNavigation: () =>
        set((state) => ({
          mobileNavigationOpen: !state.mobileNavigationOpen,
        })),

      closeMobileNavigation: () => set({ mobileNavigationOpen: false }),
    }),
    {
      name: "exchange-ops-interface",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
