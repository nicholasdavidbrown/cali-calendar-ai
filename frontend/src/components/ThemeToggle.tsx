import { Button } from "flowbite-react";
import { HiMoon, HiSun } from "react-icons/hi";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      color="gray"
      size="sm"
      onClick={toggleTheme}
      pill
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <HiMoon className="h-4 w-4" />
      ) : (
        <HiSun className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ThemeToggle;
