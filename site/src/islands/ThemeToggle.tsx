import { useEffect, useState } from "react";

const STORAGE_KEY = "ts-playground:theme";

export default function ThemeToggle() {
  // The inline head script (see BaseLayout) already set data-theme before
  // paint; this just mirrors that state into React so the icon is correct
  // once the island hydrates.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
