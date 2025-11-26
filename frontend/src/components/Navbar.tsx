import { Link } from "react-router-dom";
import { Button } from "flowbite-react";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link to="/calendar" className="flex items-center space-x-3">
          <span className="self-center text-xl font-semibold whitespace-nowrap">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              📅 Cali Calendar AI
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 md:order-2">
          <span className="hidden lg:inline text-sm text-gray-600 dark:text-gray-400">
            {user?.firstName} {user?.lastName}
          </span>
          <ThemeToggle />
          <Button size="sm" color="light" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="hidden md:flex md:w-auto md:order-1">
          <ul className="flex flex-col md:flex-row md:space-x-8 md:mt-0 md:text-base md:font-medium">
            <li>
              <Link
                to="/calendar"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-orange-500 md:p-0 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Calendar
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-orange-500 md:p-0 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
