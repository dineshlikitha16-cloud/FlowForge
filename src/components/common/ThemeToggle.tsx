import { useThemeStore } from '../../store/themeStore';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      <div className="theme-toggle-track">
        <Sun className="theme-toggle-icon theme-toggle-sun" size={12} />
        <Moon className="theme-toggle-icon theme-toggle-moon" size={12} />
        <div className={`theme-toggle-thumb ${theme === 'dark' ? 'dark' : ''}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
