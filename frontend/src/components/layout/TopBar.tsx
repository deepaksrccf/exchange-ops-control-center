import { useThemeStore } from "../../store/themeStore";

export function TopBar() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <header className="topbar">
      <div className="topbar__status">
        <span className="status-dot status-dot--healthy" />
        API status will be connected in Package C
      </div>

      <button
        type="button"
        className="theme-button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? "Light theme" : "Dark theme"}
      </button>
    </header>
  );
}
