import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('flowforge-theme') as Theme) || 'light',

  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('flowforge-theme', next);
      return { theme: next };
    }),

  setTheme: (theme: Theme) => {
    localStorage.setItem('flowforge-theme', theme);
    set({ theme });
  },
}));
