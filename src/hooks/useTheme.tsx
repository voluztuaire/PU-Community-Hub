import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Mode = "light" | "dark";

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const ThemeContext = createContext<Ctx>({
  mode: "light",
  setMode: () => {},
});

const applyTheme = (mode: Mode) => {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    const m = (localStorage.getItem("theme_mode") as Mode) || "light";
    setModeState(m);
    applyTheme(m);
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem("theme_mode", m);
    applyTheme(m);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
