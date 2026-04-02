import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vetrix-theme");
      return stored !== "light"; // dark by default
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      root.classList.add("theme-transitioning");

      if (isDark) {
        root.classList.remove("light-mode");
        root.classList.add("dark");
      } else {
        root.classList.add("light-mode");
        root.classList.remove("dark");
      }

      localStorage.setItem("vetrix-theme", isDark ? "dark" : "light");
    });

    const timer = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 150); // Reduced from 220ms

    return () => clearTimeout(timer);
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((d) => !d), []);

  return { isDark, toggle };
}
